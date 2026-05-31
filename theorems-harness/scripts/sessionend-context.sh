#!/usr/bin/env bash
# Stop hook: records session completion for Pairformer training export.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
tenant_id="${THEOREM_TENANT_ID:-public}"
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
run_id=$(theorem_run_id "$sid" || true)
actor="${THEOREM_ACTOR:-$(theorem_host)}"
repo_root=$(theorem_repo_root "$input")
repo_label=$(theorem_repo_label "$repo_root")
branch=$(theorem_git_branch "$repo_root")
changed_files_json=$(theorem_changed_files_json "$repo_root")
reflection_summary=$(
  echo "$input" | jq -r '
    .summary // .result.summary // .result // .message // .transcript // ""
  ' 2>/dev/null | tr '\n' ' ' | cut -c1-500
)
if [ -z "$reflection_summary" ]; then
  reflection_summary="Session ended; no explicit host summary was provided."
fi

event_body=$(jq -n \
  --arg tenant_id "$tenant_id" \
  --arg session_id "$sid" \
  --arg run_id "$run_id" \
  --argjson payload "$input" \
  '{
    tenant_id: $tenant_id,
    session_id: $session_id,
    event_type: "SessionEnd",
    payload: { harness_run_id: $run_id, outcome: $payload }
  }')
theorem_post "/pairformer/session-event/" "$event_body" "$sid" >/dev/null 2>&1 || true

reflection_body=$(jq -n \
  --arg actor "$actor" \
  --arg repo "$repo_label" \
  --arg branch "$branch" \
  --arg summary "$reflection_summary" \
  --arg run_id "$run_id" \
  --argjson changed_files "$changed_files_json" \
  '{
    actor: $actor,
    repo: $repo,
    branch: $branch,
    summary: $summary,
    assumptions: [],
    open_questions: [],
    pointers: ((if $run_id != "" then ["run:" + $run_id] else [] end) + $changed_files)
  }')
theorem_post "/harness/coordination/reflection/" "$reflection_body" "$sid" >/dev/null 2>&1 || true

printf '{"continue":true}\n'
