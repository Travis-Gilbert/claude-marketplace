#!/usr/bin/env bash
# SessionStart hook: arm the Writing Engineering prose mode for the session.
#
# The pack/receipt loop ships at `shadow` (telemetry only, no behavior change),
# so the actual behavior latch is this directive. It injects a persistent,
# caveman-strength register directive at session start so the mode stays on for
# every turn instead of being read once and drifting. Honors the per-session
# disable flag written by inject-harness-directives.sh ("normal mode" et al.),
# so a resume that previously turned the mode off stays off.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

trap 'printf "{\"continue\":true}\n"; exit 0' ERR

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
hook_event=$(theorem_jq "$input" '.hook_event_name')
if [ -z "$hook_event" ]; then
  hook_event="SessionStart"
fi
cwd=$(theorem_resolve_cwd "$input")
THEOREM_STATE_DIR=$(theorem_init_state_dir "$cwd")
sid=$(theorem_session_id "$input")
disabled_file="$THEOREM_STATE_DIR/runs/${sid//[\/:]/_}.writing-engineering-disabled"

# Respect an explicit off-switch carried over into a resumed session.
if [ -f "$disabled_file" ]; then
  printf '{"continue":true}\n'
  exit 0
fi

plugin_root=$(theorem_plugin_root)
writing_skill_file="$plugin_root/skills/writing-engineering/SKILL.md"

# Pull the Core Directive from the skill so the rules stay single-sourced.
writing_directive=""
if [ -f "$writing_skill_file" ]; then
  writing_directive=$(awk '
    /^## Core Directive$/ {capture=1; next}
    /^## / && capture {exit}
    capture && NF {print}
  ' "$writing_skill_file" | tr '\n' ' ' | sed 's/[[:space:]][[:space:]]*/ /g; s/[[:space:]]$//')
fi

# Embedded fallback so the latch survives even if the skill file is missing or
# the heading is renamed.
if [ -z "$writing_directive" ]; then
  writing_directive='Write plain. Every word earns its place. Short declarative sentences carry the load; one longer sentence may land a point. Active voice. Concrete nouns, strong verbs, few adverbs. No throat-clearing, no pleasantries, no hedging, no filler. Keep every fact, identifier, number, file path, and error string exact. Code blocks, commit messages, and PR bodies pass through untouched. For security warnings, irreversible actions, and ordered sequences, spend the words: full grammar, no compression. No em dashes.'
fi

directive="## Writing Engineering directive (active this session, persistent)
This is a persistent output register, not a one-time note. Like /caveman, it stays on for every response until turned off. Apply it now and on every later turn; do not drift back after a few turns; still apply it when unsure.
- ${writing_directive}
- Registers: plain (default, humans), spare (tighter, briefs/postmortems), wire (agent-to-agent: intents, reflections, records, handoff summaries, mentions). Switch with \"spare\" / \"wire\" or /writing-engineering.
- Off only on \"normal mode\", \"stop writing engineering\", or \"writing engineering off\". Re-arm with \"writing engineering\" / \"writing mode\".
- Full rules and register targets: skills/writing-engineering/SKILL.md. Receipts: prose-check at the synthesis and Stop boundaries (shadow = telemetry only)."

jq -n \
  --arg event "$hook_event" \
  --arg ctx "$directive" \
  '{
    continue: true,
    suppressOutput: true,
    hookSpecificOutput: {
      hookEventName: $event,
      additionalContext: $ctx
    }
  }'
