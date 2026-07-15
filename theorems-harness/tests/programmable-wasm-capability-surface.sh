#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CONTRACT="$PLUGIN_ROOT/references/PROGRAMMABLE_WASM_CAPABILITY.md"
readonly SKILL="$PLUGIN_ROOT/skills/programmable-wasm/SKILL.md"

fail() {
  printf 'programmable-wasm surface check failed: %s\n' "$*" >&2
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
    'tool_search' \
    'describe' \
    'invoke' \
    'wasm_plugin:<plugin_id>.<export>' \
    'DurableWasmCapabilityRegistry' \
    'publish' \
    'promote' \
    'inspect' \
    'invoke_selected' \
    'load_receipt' \
    'rollback_selected' \
    'not exposed as MCP'; do
    require_text "$file" "$token"
  done
done


for contract_token in \
  'DurableWasmOperation::Published' \
  'DurableWasmOperation::Promoted' \
  'DurableWasmOperation::Invoked' \
  'DurableWasmOperation::RolledBack' \
  'snapshot hashes' \
  'version/module/policy hashes' \
  'one GraphStore batch' \
  'DurableWasmReceipt'; do
  require_text "$CONTRACT" "$contract_token"
done

for surface in \
  "$PLUGIN_ROOT/README.md" \
  "$PLUGIN_ROOT/references/PLUGIN_INVENTORY.md" \
  "$PLUGIN_ROOT/references/ROUTING.md" \
  "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md"; do
  require_text "$surface" 'PROGRAMMABLE_WASM_CAPABILITY.md'
  require_text "$surface" 'wasm_plugin:<plugin_id>.<export>'
done

readonly INVENTED_PATTERN='\b(wasm_publish|wasm_promote|wasm_inspect|wasm_invoke|wasm_rollback|programmable_wasm_publish|programmable_wasm_promote|programmable_wasm_inspect|programmable_wasm_invoke|programmable_wasm_rollback)\b'
if command -v rg >/dev/null 2>&1; then
  if rg -n "$INVENTED_PATTERN" \
    "$PLUGIN_ROOT/README.md" "$PLUGIN_ROOT/commands" "$PLUGIN_ROOT/references" "$PLUGIN_ROOT/skills" \
    --glob '!PLANNED-CAPABILITY-PLUGIN-IDEAS.md'; then
    fail 'active teaching names an invented programmable WASM lifecycle tool'
  fi
elif grep -ERn '(wasm_publish|wasm_promote|wasm_inspect|wasm_invoke|wasm_rollback|programmable_wasm_publish|programmable_wasm_promote|programmable_wasm_inspect|programmable_wasm_invoke|programmable_wasm_rollback)' \
  "$PLUGIN_ROOT/README.md" "$PLUGIN_ROOT/commands" "$PLUGIN_ROOT/references" "$PLUGIN_ROOT/skills" \
  | grep -v 'PLANNED-CAPABILITY-PLUGIN-IDEAS.md'; then
  fail 'active teaching names an invented programmable WASM lifecycle tool'
fi

printf 'programmable-wasm teaching surface: complete\n'
