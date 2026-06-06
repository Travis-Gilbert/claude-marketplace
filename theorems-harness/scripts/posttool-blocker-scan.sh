#!/usr/bin/env bash
# PostToolUse hook: notice early deferral/give-up language and inject the
# engineering-mindset correction without blocking the already-finished tool.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

trap 'printf "{\"continue\":true}\n"; exit 0' ERR

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
transcript_path=$(theorem_jq "$input" '.transcript_path')

scan_text=$(echo "$input" | jq -r '
  [
    (.last_assistant_message // ""),
    (.tool_response // .response // .result // "" | tostring)
  ] | join("\n")
' 2>/dev/null || printf '')

if [ -n "$transcript_path" ] && [ -r "$transcript_path" ]; then
  scan_text="${scan_text}
$(tail -c 50000 "$transcript_path" 2>/dev/null || true)"
fi

if ! printf '%s' "$scan_text" | grep -Eiq 'later|future milestone|separate effort|out of scope for now|not possible|isn.t possible|would require|blocked on|cannot be done|can.t be done'; then
  printf '{"continue":true}\n'
  exit 0
fi

signal_hash=$(printf '%s' "$scan_text" | shasum -a 256 | awk '{print substr($1,1,24)}')
hash_file="$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}.blocker-signal"
mkdir -p "$(dirname "$hash_file")"
if [ -f "$hash_file" ] && [ "$(cat "$hash_file")" = "$signal_hash" ]; then
  printf '{"continue":true}\n'
  exit 0
fi
printf '%s' "$signal_hash" > "$hash_file"

context='## Engineering-mindset trigger
Recent output contains blocker or deferral language. Before continuing toward completion: search the local source and current docs, try one bounded reversible experiment, choose the safest useful default, and only defer with a concrete external blocker. Forbidden deferrals include: later, future milestone, separate effort, and out of scope for now.'

jq -n \
  --arg ctx "$context" \
  '{
    continue: true,
    suppressOutput: true,
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: $ctx
    }
  }'
