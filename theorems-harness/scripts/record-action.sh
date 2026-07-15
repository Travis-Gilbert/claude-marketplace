#!/usr/bin/env bash
# PostToolUse hook. Records the tool call into the harness run as an event,
# so the timeline is replayable and comparable across runs.
# Delivery is queued locally with a stable hook-event key. The hook returns
# immediately; transport failures remain retryable and visible in ambient
# status rather than silently dropping the event.

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
run_id=$(theorem_run_id "$sid")
[ -z "$run_id" ] && { printf '{"continue":true}\n'; exit 0; }

tool_name=$(echo "$input" | jq -r '
  if (.tool | type) == "object" then (.tool.name // "")
  elif (.tool | type) == "string" then .tool
  else (.tool_name // .name // "")
  end
' 2>/dev/null || echo "")
tool_input=$(echo "$input" | jq -c '.tool_input // .input // .arguments // {}' 2>/dev/null || echo '{}')
tool_response=$(echo "$input" | jq -c '.tool_response // .response // .result // {}' 2>/dev/null || echo '{}')

step_body=$(jq -n \
  --arg tool "$tool_name" \
  --argjson tin "$tool_input" \
  --argjson tout "$tool_response" \
  '{
    event_subtype: "tool_use",
    tool: $tool,
    input: $tin,
    output_summary: ($tout | tostring | .[0:2000]),
    timestamp: (now | todate)
  }')

tool_event_id=$(echo "$input" | jq -r '.tool_use_id // .toolUseId // .event_id // .eventId // empty' 2>/dev/null || echo "")
if [ -z "$tool_event_id" ]; then
  tool_event_id=$(printf '%s' "$input" | jq -cS . 2>/dev/null | shasum -a 256 | awk '{print $1}')
fi
request_key="tool-use:$sid:$tool_event_id"
theorem_ambient_queue_transition \
  "$cwd" "$sid" "500" "$run_id" "SESSION.EVENT_RECORDED" \
  "${THEOREM_ACTOR:-$(theorem_host)}" "$step_body" "$request_key" \
  >/dev/null 2>&1 || true

printf '{"continue":true}\n'
