#!/usr/bin/env bash
# UserPromptSubmit companion hook: suggests subagent dispatch for high-bloat prompts.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
tenant_id="${THEOREM_TENANT_ID:-public}"
prompt=$(theorem_jq "$input" '.prompt')

body=$(jq -n \
  --arg tenant_id "$tenant_id" \
  --arg session_id "$sid" \
  --arg prompt "$prompt" \
  '{tenant_id: $tenant_id, session_id: $session_id, prompt: $prompt}')
response=$(theorem_post "/pairformer/complexity-score/" "$body" "$sid" 2>/dev/null || true)
if [[ -z "$response" ]] || ! echo "$response" | jq empty 2>/dev/null; then
  printf '{"continue":true}\n'
  exit 0
fi

should=$(echo "$response" | jq -r '.should_suggest_subagent // false')
if [[ "$should" != "true" ]]; then
  printf '{"continue":true}\n'
  exit 0
fi

score=$(echo "$response" | jq -r '.score // 0')
ctx="Pairformer complexity score ${score}: consider dispatching a subagent"
ctx="${ctx} for investigation before making broad edits."
jq -n --arg ctx "$ctx" '{
  continue: true,
  suppressOutput: true,
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: $ctx
  }
}'
