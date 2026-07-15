#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CONTRACT="$PLUGIN_ROOT/references/CONTEXT_CAPABILITY.md"
readonly SKILL="$PLUGIN_ROOT/skills/context-management/SKILL.md"
readonly CLAUDE_HOOKS="$PLUGIN_ROOT/hooks/hooks.json"
readonly CODEX_HOOKS="$PLUGIN_ROOT/hooks/codex-hooks.json"

fail() {
  printf 'context-capability surface check failed: %s\n' "$*" >&2
  exit 1
}

require_text() {
  local file=$1
  local expected=$2
  grep -Fq "$expected" "$file" \
    || fail "${file#$PLUGIN_ROOT/} does not teach $expected"
}

for file in "$CONTRACT" "$SKILL"; do
  [[ -f "$file" ]] || fail "missing ${file#$PLUGIN_ROOT/}"
  for token in \
    'contextStatus' \
    'contextExplain' \
    'refreshContext' \
    'invalidateContext' \
    'context_status' \
    'context_explain' \
    'context_invalidate' \
    'harness_prepare' \
    'PostToolUse' \
    'PreCompact' \
    'admitted session'; do
    require_text "$file" "$token"
  done
done

for contract_token in \
  'first_turn' \
  'explicit_refresh' \
  'missing_brief' \
  'post_compaction' \
  'semantic_invalidation' \
  'included' \
  'excluded' \
  'mandatory' \
  'ranked_within_budget' \
  'token_budget_exhausted' \
  'active' \
  'stale' \
  'evicted' \
  'retention_limit' \
  'does not call' \
  'Codex currently has no `PreCompact` hook' \
  'live admitted production session'; do
  require_text "$CONTRACT" "$contract_token"
done

for surface in \
  "$PLUGIN_ROOT/README.md" \
  "$PLUGIN_ROOT/references/PLUGIN_INVENTORY.md" \
  "$PLUGIN_ROOT/references/ROUTING.md" \
  "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md"; do
  require_text "$surface" 'CONTEXT_CAPABILITY.md'
  require_text "$surface" 'harness_prepare'
  require_text "$surface" 'refreshContext'
  require_text "$surface" 'context_invalidate'
done

for hooks in "$CLAUDE_HOOKS" "$CODEX_HOOKS"; do
  require_text "$hooks" 'prepare-context.sh'
  require_text "$hooks" 'posttool-context.sh'
done
require_text "$CLAUDE_HOOKS" '"PreCompact"'
require_text "$CLAUDE_HOOKS" 'precompact-flush.sh'
if grep -Fq '"PreCompact"' "$CODEX_HOOKS"; then
  fail 'Codex hook manifest gained PreCompact; update the capability contract and oracle'
fi
if grep -Fq 'context_invalidate' "$PLUGIN_ROOT/scripts/posttool-context.sh" \
  || grep -Fq 'context_invalidate' "$PLUGIN_ROOT/scripts/precompact-flush.sh"; then
  fail 'hook invalidation wiring changed; update the capability contract and lifecycle tests'
fi

readonly INVENTED_PATTERN='\b(context_prepare|context_refresh|prepareContext|refresh_context_tool)\b'
if command -v rg >/dev/null 2>&1; then
  if rg -n "$INVENTED_PATTERN" \
    "$PLUGIN_ROOT/README.md" "$PLUGIN_ROOT/commands" "$PLUGIN_ROOT/references" "$PLUGIN_ROOT/skills" \
    --glob '!PLANNED-CAPABILITY-PLUGIN-IDEAS.md'; then
    fail 'active teaching names an invented flat context surface'
  fi
elif grep -ERn '(context_prepare|context_refresh|prepareContext|refresh_context_tool)' \
  "$PLUGIN_ROOT/README.md" "$PLUGIN_ROOT/commands" "$PLUGIN_ROOT/references" "$PLUGIN_ROOT/skills" \
  | grep -v 'PLANNED-CAPABILITY-PLUGIN-IDEAS.md'; then
  fail 'active teaching names an invented flat context surface'
fi

printf 'context-capability teaching surface: complete\n'
