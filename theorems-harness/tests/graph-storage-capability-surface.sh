#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CONTRACT="$PLUGIN_ROOT/references/GRAPH_STORAGE_CAPABILITY.md"
readonly SKILL="$PLUGIN_ROOT/skills/graph-storage/SKILL.md"

fail() {
  printf 'graph-storage capability surface check failed: %s\n' "$*" >&2
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
    'GraphQL' \
    'Inline' \
    'admin' \
    'theorem.graph.mutation.v1' \
    'partial' \
    'graph-version' \
    'caller-carried' \
    '/ready' \
    'AOF' \
    'DocTree' \
    'AgentFS'; do
    require_text "$file" "$token"
  done
done

for token in \
  'graphAlgorithm' \
  'multiVectorSearch' \
  'rustyred_thg_graph_query' \
  'payload_too_large' \
  'bulkNodes' \
  'rustyred_thg_bulk_nodes' \
  'rustyred_thg_graph_version_compile' \
  'rustyred_thg_graph_version_checkout' \
  'rustyred_thg_index_spine' \
  'verify-latest'; do
  require_text "$CONTRACT" "$token"
done

for surface in \
  "$PLUGIN_ROOT/README.md" \
  "$PLUGIN_ROOT/references/PLUGIN_INVENTORY.md" \
  "$PLUGIN_ROOT/references/ROUTING.md" \
  "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md"; do
  require_text "$surface" 'GRAPH_STORAGE_CAPABILITY.md'
  require_text "$surface" 'graph-storage'
done

printf 'graph-storage capability teaching surface: complete\n'
