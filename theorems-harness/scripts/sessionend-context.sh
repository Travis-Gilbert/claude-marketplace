#!/usr/bin/env bash
# Stop hook: records session completion for Pairformer training export.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
tenant_id="${THEOREM_TENANT_ID:-public}"
run_id=$(theorem_run_id "$sid" || true)

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

printf '{"continue":true}\n'
