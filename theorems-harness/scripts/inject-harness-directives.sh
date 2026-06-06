#!/usr/bin/env bash
# Inject compact harness directives at the lifecycle moments where soft skill
# descriptions are too easy for an agent to miss.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

trap 'printf "{\"continue\":true}\n"; exit 0' ERR

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
hook_event=$(theorem_jq "$input" '.hook_event_name')
if [ -z "$hook_event" ]; then
  hook_event="UserPromptSubmit"
fi
prompt=$(theorem_jq "$input" '.prompt')
context=""

append_context() {
  local block="$1"
  if [ -z "$context" ]; then
    context="$block"
    return
  fi
  context="${context}

${block}"
}

standing_frame='## Harness hooks standing frame
- Treat handoff deliverables as current scope, not as optional future work.
- Use `.harness/checklist.json` as the local checklist contract when present.
- Complete each checklist item by verification evidence or by an honest non-forbidden deferral.
- Be ambitious about scope and capability; be cautious only about irreversible or harmful actions.'

ambition_frame='## Ambition directive
Match the full capability implied by the request. Do not shrink in-scope work into later work, a future milestone, a separate effort, or out of scope for now. Hard is an engineering problem to solve. Genuine risk gets a safeguard, not a smaller build.'

curiosity_frame='## Curiosity directive
For investigation and explanation tasks, pull related graph or code context before answering shallowly. Mention only the few related facts that materially change the answer.'

case "$hook_event" in
  SessionStart)
    append_context "$standing_frame"
    ;;
  UserPromptSubmit)
    if printf '%s' "$prompt" | grep -Eiq 'build|implement|integrat(e|ion)|ship|publish|plan|handoff|spec|migration|feature|fix'; then
      append_context "$ambition_frame"
    fi
    if printf '%s' "$prompt" | grep -Eiq 'investigat|research|explain|understand|why|trace|diagnos|debug|search|evidence|graph context'; then
      append_context "$curiosity_frame"
    fi
    ;;
esac

if [ -z "$context" ]; then
  printf '{"continue":true}\n'
  exit 0
fi

jq -n \
  --arg event "$hook_event" \
  --arg ctx "$context" \
  '{
    continue: true,
    suppressOutput: true,
    hookSpecificOutput: {
      hookEventName: $event,
      additionalContext: $ctx
    }
  }'
