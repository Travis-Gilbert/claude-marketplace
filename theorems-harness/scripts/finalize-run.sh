#!/usr/bin/env bash
# Stop hook. Records a native run close transition and mirrors the last state
# hash from the returned transition receipt.

set -uo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

trap 'printf "{\"continue\":true}\n"; exit 0' ERR

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
host=$(theorem_host)
actor="${THEOREM_ACTOR:-$host}"
run_id=$(theorem_run_id "$sid")
[ -z "$run_id" ] && { printf '{"continue":true}\n'; exit 0; }
repo_root=$(theorem_repo_root "$input")
changed_files_json=$(theorem_changed_files_json "$repo_root")
summary=$(printf '%s' "$input" | jq -r '.summary // .result.summary // .message // empty' 2>/dev/null | tr '\n' ' ' | cut -c1-500)
if [ -z "$summary" ]; then
  summary="$host session stopped; validation status is not inferred by the Stop hook"
fi

# A host can stop before UserPromptSubmit produced a Context Brief. The kernel
# admits AGENT.ACTING directly after RUN.CREATED, so queue that stable fallback;
# if the ordinary context path already acknowledged it, local/server
# idempotency makes this a no-op.
acting_payload=$(jq -n --arg actor "$actor" '{adapter: $actor, started_at: (now | todate)}')
theorem_ambient_queue_transition \
  "$cwd" "$sid" "090" "$run_id" "AGENT.ACTING" "$actor" "$acting_payload" "agent-acting:$sid" \
  >/dev/null 2>&1 || true

outcome_payload=$(jq -n \
  --arg sid "$sid" \
  --arg host "$host" \
  --arg summary "$summary" \
  --argjson files_changed "$changed_files_json" \
  '{
    accepted: true,
    tests_passed: false,
    validator_results: [],
    files_changed: $files_changed,
    summary: $summary,
    external_session_id: $sid,
    finalized_at: (now | todate)
  }')
theorem_ambient_queue_transition \
  "$cwd" "$sid" "900" "$run_id" "OUTCOME.RECORDED" "$actor" "$outcome_payload" "session-outcome:$sid" \
  >/dev/null 2>&1 || true

close_payload=$(jq -n \
  --arg host "$host" \
  --arg summary "$summary" \
  '{summary: $summary, closed_by: $host}')
theorem_ambient_queue_transition \
  "$cwd" "$sid" "910" "$run_id" "RUN.CLOSED" "$actor" "$close_payload" "session-stop:$sid" \
  >/dev/null 2>&1 || true

printf '{"continue":true,"suppressOutput":true}\n'
