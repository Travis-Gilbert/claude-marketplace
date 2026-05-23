#!/usr/bin/env bash
# PreToolUse hook. Reads the active Action Rail from the current run and decides
# whether to allow, warn, or deny the tool call.
#
# Modes (THEOREM_ACTION_RAIL):
#   off      - hook is a no-op
#   record   - default; never blocks, just lets PostToolUse log the action
#   enforce  - blocks tool calls that violate the rail's deny rules
#
# Failure semantics: if the rail can't be loaded or evaluated, the hook fails
# OPEN (allow) rather than closed. We do not want this plugin to brick a
# session because the backend is slow.

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

if [ "${THEOREM_ACTION_RAIL}" = "off" ]; then
  printf '{"continue":true}\n'; exit 0
fi
if [ "${THEOREM_ACTION_RAIL}" != "enforce" ]; then
  # record-mode: never blocks here; PostToolUse handles recording.
  printf '{"continue":true}\n'; exit 0
fi

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
tool_name=$(theorem_jq "$input" '.tool_name')
tool_input=$(theorem_jq "$input" '.tool_input')

rail_file="$THEOREM_STATE_DIR/current-action-rail.json"
if [ ! -f "$rail_file" ]; then
  # No rail compiled yet; allow.
  printf '{"continue":true}\n'; exit 0
fi

# Evaluate locally first (fast, common case). The rail format mirrors the
# backend: { allow: [..], deny: [..], require_confirmation: [..] }
# with each rule shaped like { tool: "Bash", pattern: "git push", ... }.
deny_match=$(jq -r --arg tool "$tool_name" --argjson tin "$tool_input" '
  (.deny // [])
  | map(select(.tool == $tool))
  | map(select(
      (.pattern // "") as $p
      | ($tin | tostring | test($p; "i"))
    ))
  | first
  | (.reason // "denied by Action Rail")
' "$rail_file" 2>/dev/null)

if [ -n "$deny_match" ] && [ "$deny_match" != "null" ]; then
  jq -n --arg reason "$deny_match" '{
    continue: false,
    decision: "block",
    reason: ("Theorem Action Rail blocked this action: " + $reason)
  }'
  exit 0
fi

# Allow.
printf '{"continue":true}\n'
