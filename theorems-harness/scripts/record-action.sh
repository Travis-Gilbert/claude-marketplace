#!/usr/bin/env bash
# PostToolUse hook. Records the tool call into the harness run as an event,
# so the timeline is replayable and comparable across runs.
# Background: best-effort. If the backend is slow or unreachable, drop the
# event silently rather than block the session.

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
  --argjson tin "${tool_input:-{}}" \
  --argjson tout "${tool_response:-{}}" \
  '{
    kind: "tool_use",
    tool: $tool,
    input: $tin,
    output_summary: ($tout | tostring | .[0:2000]),
    timestamp: (now | todate)
  }')

# Best-effort, fire-and-forget so the user's session isn't slowed.
( theorem_post "/harness/runs/${run_id}/step/" "$step_body" >/dev/null 2>&1 || true ) &

printf '{"continue":true}\n'
