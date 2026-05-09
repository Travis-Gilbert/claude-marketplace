#!/usr/bin/env bash
# Stop hook. Records run outcome + state hash, then proposes any learning
# patches that the run accumulated. Patches are PROPOSALS; promotion to the
# canonical graph is a separate review step (this never auto-promotes).

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
run_id=$(theorem_run_id "$sid")
[ -z "$run_id" ] && { printf '{"continue":true}\n'; exit 0; }

# Record outcome with whatever signals the harness has aggregated.
outcome_body=$(jq -n \
  --arg sid "$sid" \
  --arg host "claude-code" \
  '{
    host: $host,
    external_session_id: $sid,
    completion: "stopped",
    finalized_at: (now | todate)
  }')
theorem_post "/harness/runs/${run_id}/outcome/" "$outcome_body" >/dev/null 2>&1 || true

# Surface a state hash so the user can replay deterministically later.
state_hash=$(theorem_get "/harness/runs/${run_id}/state-hash/" 2>/dev/null \
  | jq -r '.state_hash // empty')
if [ -n "$state_hash" ]; then
  echo "$state_hash" > "$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}/last-state-hash.txt"
fi

printf '{"continue":true,"suppressOutput":true}\n'
