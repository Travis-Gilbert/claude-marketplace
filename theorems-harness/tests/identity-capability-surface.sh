#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CONTRACT="$PLUGIN_ROOT/references/IDENTITY_CAPABILITY.md"
readonly SKILL="$PLUGIN_ROOT/skills/identity-bindings/SKILL.md"

fail() {
  printf 'identity-capability surface check failed: %s\n' "$*" >&2
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
    'identityBindingStatus' \
    'identityBindingExplain' \
    'identity_binding_status' \
    'identity_binding_explain' \
    'accept no identity arguments' \
    'unbound' \
    'partial' \
    'resolved' \
    'inconsistent' \
    'admitted session'; do
    require_text "$file" "$token"
  done
done

for contract_token in \
  'IdentityBindingReceipt' \
  'knownProjects' \
  'receiptHash' \
  '64-character' \
  'config-only identity is refused' \
  'THEOREM_RUN_IDENTITY_LIVE=1' \
  'two-tenant/auth live matrix' \
  'async-worker admission'; do
  require_text "$CONTRACT" "$contract_token"
done

for surface in \
  "$PLUGIN_ROOT/README.md" \
  "$PLUGIN_ROOT/references/PLUGIN_INVENTORY.md" \
  "$PLUGIN_ROOT/references/ROUTING.md" \
  "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md"; do
  require_text "$surface" 'IDENTITY_CAPABILITY.md'
  require_text "$surface" 'identityBindingStatus'
  require_text "$surface" 'identity_binding_status'
done

readonly INVENTED_PATTERN='\b(identity_status|identity_explain|binding_status|binding_explain|getIdentityBinding|identityBindingQuery)\b'
if command -v rg >/dev/null 2>&1; then
  if rg -n "$INVENTED_PATTERN" \
    "$PLUGIN_ROOT/README.md" "$PLUGIN_ROOT/commands" "$PLUGIN_ROOT/references" "$PLUGIN_ROOT/skills" \
    --glob '!PLANNED-CAPABILITY-PLUGIN-IDEAS.md'; then
    fail 'active teaching names an invented identity or binding surface'
  fi
elif grep -ERn '(identity_status|identity_explain|binding_status|binding_explain|getIdentityBinding|identityBindingQuery)' \
  "$PLUGIN_ROOT/README.md" "$PLUGIN_ROOT/commands" "$PLUGIN_ROOT/references" "$PLUGIN_ROOT/skills" \
  | grep -v 'PLANNED-CAPABILITY-PLUGIN-IDEAS.md'; then
  fail 'active teaching names an invented identity or binding surface'
fi

printf 'identity-capability teaching surface: complete\n'
