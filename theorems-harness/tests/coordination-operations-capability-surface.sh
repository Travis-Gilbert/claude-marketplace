#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CONTRACT="$PLUGIN_ROOT/references/COORDINATION_OPERATIONS_CAPABILITY.md"
readonly SKILL="$PLUGIN_ROOT/skills/coordination-operations/SKILL.md"

fail() {
  printf 'coordination-operations capability surface check failed: %s\n' "$*" >&2
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
    'coordination_intent' \
    'coordination_record' \
    'stream_subscribe' \
    'stream_read' \
    'stream_ack' \
    'job_submit' \
    'spawn_session' \
    '/ready' \
    '/version' \
    'tools/list' \
    'graphql_introspect'; do
    require_text "$file" "$token"
  done
done

for token in \
  'writeCoordinationRecord' \
  'advanceCoordinationStream' \
  'turnStartDiscovery' \
  'recordClaim' \
  'ordering_token' \
  'dispatch_mirrored' \
  'job_note' \
  'multihead_run' \
  'repository_dispatch' \
  'store_not_ready' \
  'tool_catalog_hash'; do
  require_text "$CONTRACT" "$token"
done

for surface in \
  "$PLUGIN_ROOT/README.md" \
  "$PLUGIN_ROOT/references/PLUGIN_INVENTORY.md" \
  "$PLUGIN_ROOT/references/ROUTING.md" \
  "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md"; do
  require_text "$surface" 'COORDINATION_OPERATIONS_CAPABILITY.md'
  require_text "$surface" 'coordination-operations'
done

for surface in \
  "$PLUGIN_ROOT/README.md" \
  "$PLUGIN_ROOT/agents/plugin-router.md" \
  "$PLUGIN_ROOT/commands/coordinate.md" \
  "$PLUGIN_ROOT/sdk/route-policy.mjs" \
  "$PLUGIN_ROOT/skills/harness-coordinate/SKILL.md" \
  "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md"; do
  if grep -Eq '\b(coordination_reflection|coordination_decision|coordination_tension|mentions_wait|spawn_handoff_session)\b' "$surface"; then
    fail "${surface#$PLUGIN_ROOT/} teaches a nonexistent coordination alias"
  fi
done

printf 'coordination-operations capability teaching surface: complete\n'
