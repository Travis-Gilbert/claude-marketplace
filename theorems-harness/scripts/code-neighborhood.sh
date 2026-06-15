#!/usr/bin/env bash
# UserPromptSubmit hook: the ambient code-KG context pack (AM8 flush + AM9 pack).
#  1. Flush the session-delta queue: ship dirty file texts to session_reingest.
#  2. Call context_pack and inject the returned markdown as a "## Code
#     neighborhood" additionalContext block (after the coordination brief).
# Fails open: any error injects nothing. Capped at 40 files / 2 MB per flush;
# over-cap degrades to a labeled paths-only pack.

set -uo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }
if [ -z "$(theorem_tenant)" ]; then
  theorem_log "code KG disabled: no tenant"
  printf '{"continue":true}\n'
  exit 0
fi

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
prompt=$(theorem_jq "$input" '.prompt')
repo_root=$(theorem_repo_root "$input")
harness_dir=$(theorem_init_harness_dir "$repo_root")

# repo_id comes from the SessionStart manifest; skip the pack if the base is
# not registered yet (local-only repo or ingest not fired).
manifest="$harness_dir/code-kg-manifest.json"
repo_id=""
[ -f "$manifest" ] && repo_id=$(jq -r '.repo_id // empty' "$manifest" 2>/dev/null)
if [ -z "$repo_id" ]; then
  theorem_log "no code-kg manifest repo_id; skipping pack"
  printf '{"continue":true}\n'
  exit 0
fi
head_sha=$(theorem_git_head "$repo_root")

# --- AM8 flush: queue + working set -> dedup -> cap 40 -> session_reingest ---
queue="$harness_dir/session-delta-queue"
declare -A seen=()
declare -a files=()
add_path() {
  local p="$1"
  [ -n "$p" ] || return
  [ -n "${seen[$p]:-}" ] && return
  seen[$p]=1
  [ "${#files[@]}" -lt 40 ] && files+=("$p")
}
if [ -f "$queue" ]; then
  while IFS= read -r p; do add_path "$p"; done < "$queue"
fi
while IFS= read -r p; do add_path "$p"; done < <(
  git -C "$repo_root" status --porcelain 2>/dev/null | awk '{print $NF}'
)

over_cap=0
if [ "${#files[@]}" -gt 0 ]; then
  files_json="[]"
  total=0
  for rel in "${files[@]}"; do
    abs="$repo_root/$rel"
    [ -f "$abs" ] || continue
    sz=$(wc -c < "$abs" 2>/dev/null || echo 0)
    if [ "$total" -ge $((2 * 1024 * 1024)) ]; then over_cap=1; break; fi
    total=$((total + sz))
    text=$(cat "$abs" 2>/dev/null) || continue
    files_json=$(jq -n --argjson cur "$files_json" --arg path "$rel" --arg text "$text" \
      '$cur + [{path: $path, text: $text}]') || continue
  done
  if [ "$files_json" != "[]" ]; then
    reingest_extra=$(jq -n --arg repo "$repo_id" --arg sess "$sid" --arg head "$head_sha" \
      --argjson files "$files_json" \
      '{repo_id: $repo, session_id: $sess, base_commit_sha: $head, files: $files}')
    theorem_code_call "session_reingest" "$reingest_extra" >/dev/null 2>&1 || true
  fi
  : > "$queue" 2>/dev/null || true
fi

# --- AM9 context_pack -> markdown ---
dirty_json='[]'
if [ "${#files[@]}" -gt 0 ]; then
  dirty_json=$(printf '%s\n' "${files[@]}" | jq -R . | jq -s '.' 2>/dev/null || printf '[]')
fi
pack_extra=$(jq -n --arg repo "$repo_id" --arg sess "$sid" --arg prompt "$prompt" \
  --argjson dirty "$dirty_json" \
  '{repo_id: $repo, session_id: $sess, prompt_text: $prompt, dirty_files: $dirty,
    footprint_files: [], top_k: 20, budget_tokens: 2000}')
pack=$(theorem_code_call "context_pack" "$pack_extra" 2>/dev/null || printf '')
markdown=$(printf '%s' "$pack" | jq -r '.markdown // empty' 2>/dev/null || printf '')
node_ids=$(printf '%s' "$pack" | jq -c '.node_ids // []' 2>/dev/null || printf '[]')

if [ -z "$markdown" ]; then
  printf '{"continue":true}\n'
  exit 0
fi

# Record offered node_ids for the Stop-time use-receipt loop (AM10).
printf '%s\n' "$node_ids" >> "$harness_dir/offered-nodes.jsonl" 2>/dev/null || true

label="## Code neighborhood"
[ "$over_cap" = "1" ] && label="$label (delta capped: paths-only over 2 MB)"
block=$(printf '%s\n\n%s' "$label" "$markdown")

jq -n --arg ctx "$block" '{
  continue: true,
  suppressOutput: true,
  hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: $ctx }
}'
