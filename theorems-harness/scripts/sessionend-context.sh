#!/usr/bin/env bash
# Stop hook: records session completion for Pairformer training export.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
tenant_id=$(theorem_tenant)
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
  --arg actor "$actor" \
  --arg session_id "$sid" \
  --arg run_id "$run_id" \
  --argjson payload "$input" \
  '{
    actor: $actor,
    record_type: "event",
    summary: "SessionEnd",
    title: "SessionEnd",
    metadata: { session_id: $session_id, harness_run_id: $run_id, outcome: $payload }
  }')
theorem_native_call "coordination_record" "$event_body" >/dev/null 2>&1 || true

reflection_args=$(jq -n \
  --arg actor "$actor" \
  --arg repo "$repo_label" \
  --arg branch "$branch" \
  --arg summary "$reflection_summary" \
  --arg run_id "$run_id" \
  --argjson changed_files "$changed_files_json" \
  '{
    actor: $actor,
    record_type: "reflection",
    summary: $summary,
    title: "Session end reflection",
    metadata: {
      assumptions: [],
      open_questions: [],
      pointers: ((if $run_id != "" then ["run:" + $run_id] else [] end) + $changed_files),
      repo: $repo,
      branch: $branch
    }
  }')
theorem_native_call "coordination_record" "$reflection_args" >/dev/null 2>&1 || true

printf '{"continue":true}\n'
