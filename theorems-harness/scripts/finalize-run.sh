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

outcome_payload=$(jq -n \
  --arg sid "$sid" \
  --arg host "$host" \
  '{
    accepted: true,
    tests_passed: false,
    validator_results: [],
    files_changed: [],
    summary: ($host + " session stopped; validation status is not inferred by the Stop hook"),
    external_session_id: $sid,
    finalized_at: (now | todate)
  }')
(theorem_append_transition "$run_id" "OUTCOME.RECORDED" "$actor" "$outcome_payload" "session-outcome:$sid" >/dev/null 2>&1 || true) &

close_payload=$(jq -n \
  --arg host "$host" \
  '{summary: ($host + " session stopped; validation status is not inferred by the Stop hook"), closed_by: $host}')
result=$(theorem_append_transition "$run_id" "RUN.CLOSED" "$actor" "$close_payload" "session-stop:$sid" 2>/dev/null || printf '')
state_hash=$(printf '%s' "$result" | jq -r '.result.state_hash_after // .state_hash_after // empty' 2>/dev/null || printf '')
if [ -n "$state_hash" ]; then
  mkdir -p "$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}"
  printf '%s' "$state_hash" > "$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}/last-state-hash.txt"
fi

printf '{"continue":true,"suppressOutput":true}\n'
