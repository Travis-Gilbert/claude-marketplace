#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CONTRACT="$PLUGIN_ROOT/references/AGENT_CONTRACTS_CAPABILITY.md"
readonly SKILL="$PLUGIN_ROOT/skills/agent-contracts/SKILL.md"

fail() {
  printf 'agent-contracts capability surface check failed: %s\n' "$*" >&2
  exit 1
}

require_text() {
  local file=$1
  local expected=$2
  grep -Fq -- "$expected" "$file" \
    || fail "${file#$PLUGIN_ROOT/} does not teach $expected"
}

for file in "$CONTRACT" "$SKILL"; do
  [[ -f "$file" ]] || fail "missing ${file#$PLUGIN_ROOT/}"
  for token in \
    'tools/list' \
    'graphql_introspect' \
    '/version' \
    'isError' \
    'structuredContent' \
    '{data, errors}' \
    'Data' \
    'stream' \
    'tool_result_fetch' \
    'idempotency' \
    'receipt' \
    'timeout'; do
    require_text "$file" "$token"
  done
done

for token in \
  'initialize' \
  'graphql_default_surface' \
  '-32700' \
  '-32004' \
  'offset:<number>' \
  'raw_total_count' \
  'new_cursors' \
  'fetch_handle' \
  'next_offset' \
  'theorem.graph.mutation.v1' \
  'receipt_hash' \
  'HCM-031'; do
  require_text "$CONTRACT" "$token"
done

for surface in \
  "$PLUGIN_ROOT/README.md" \
  "$PLUGIN_ROOT/references/PLUGIN_INVENTORY.md" \
  "$PLUGIN_ROOT/references/ROUTING.md" \
  "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md"; do
  require_text "$surface" 'AGENT_CONTRACTS_CAPABILITY.md'
  require_text "$surface" 'agent-contracts'
done

printf 'agent-contracts capability teaching surface: complete\n'
