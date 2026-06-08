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
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
sid=$(theorem_session_id "$input")
writing_disabled_file="$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}.writing-engineering-disabled"
plugin_root=$(theorem_plugin_root)
writing_skill_file="$plugin_root/skills/writing-engineering/SKILL.md"

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
- Complete each checklist item by verification evidence or a concrete deferral reason.
- Be ambitious about scope and capability; be cautious only about irreversible or harmful actions.'

ambition_frame='## Ambition directive
Match the full capability implied by the request. Do not quietly shrink in-scope work; if scope changes, keep the skipped item visible with a concrete reason. Hard is an engineering problem to solve. Genuine risk gets a safeguard, not a smaller build.'

curiosity_frame='## Curiosity directive
For investigation and explanation tasks, pull related graph or code context before answering shallowly. Mention only the few related facts that materially change the answer.'

writing_frame=''
if [ -f "$writing_skill_file" ]; then
  writing_directive=$(awk '
    /^## Core Directive$/ {capture=1; next}
    /^## / && capture {exit}
    capture && NF {print}
  ' "$writing_skill_file" | tr '\n' ' ' | sed 's/[[:space:]][[:space:]]*/ /g; s/[[:space:]]$//')
  if [ -n "$writing_directive" ]; then
    writing_frame="## Writing Engineering directive
- ${writing_directive}
- Source: skills/writing-engineering/SKILL.md"
  fi
fi

agents_file="$plugin_root/AGENTS.md"
cadence_frame=''
if [ -f "$agents_file" ]; then
  cadence_body=$(awk '
    /^## Coordination cadence$/ {capture=1; next}
    /^## / && capture {exit}
    capture {print}
  ' "$agents_file" | sed '/^[[:space:]]*$/d')
  if [ -n "$cadence_body" ]; then
    cadence_frame="## Coordination cadence (turn-shape contract)
${cadence_body}"
  fi
fi
if [ -z "$cadence_frame" ]; then
  cadence_frame='## Coordination cadence (turn-shape contract)
- Turn-start: read room intents and drain your mentions before planning.
- Begin: write your intent with the files you are claiming now.
- During: broadcast forks as tensions and keep working; never freeze a lane.
- Questions: substrate first (recall, room decisions); else record an ask with a named default and continue on non-blocked work.
- Blocked: do not wait on a peer; take other ready work or re-read the room.
- Turn-end: close your intent as the handoff and write a reflection.
- Wake: a live head drains its own wakes at its checkpoint; the courier only spawns asleep heads. Frequency over fences.'
fi

if [ "$hook_event" = "UserPromptSubmit" ] && printf '%s' "$prompt" | grep -Eiq '(^|[^[:alnum:]])normal mode([^[:alnum:]]|$)'; then
  mkdir -p "$(dirname "$writing_disabled_file")" 2>/dev/null || true
  printf 'disabled by normal mode at %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$writing_disabled_file" 2>/dev/null || true
fi

case "$hook_event" in
  SessionStart)
    append_context "$standing_frame"
    append_context "$cadence_frame"
    rm -f "$writing_disabled_file" 2>/dev/null || true
    if [ -n "$writing_frame" ]; then
      append_context "$writing_frame"
    fi
    ;;
  UserPromptSubmit)
    if printf '%s' "$prompt" | grep -Eiq 'build|implement|integrat(e|ion)|ship|publish|plan|handoff|spec|migration|feature|fix'; then
      append_context "$ambition_frame"
    fi
    if printf '%s' "$prompt" | grep -Eiq 'investigat|research|explain|understand|why|trace|diagnos|debug|search|evidence|graph context'; then
      append_context "$curiosity_frame"
    fi
    if [ ! -f "$writing_disabled_file" ] && [ -n "$writing_frame" ] && printf '%s' "$prompt" | grep -Eiq 'synthes|report|handoff|coordinate|mention|postmortem|summary|write|prose|brief'; then
      append_context "$writing_frame"
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
