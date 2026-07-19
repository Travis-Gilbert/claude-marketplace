#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CONTRACT="$PLUGIN_ROOT/references/AGENT_INTEROP_CAPABILITY.md"
readonly SKILL="$PLUGIN_ROOT/skills/agent-interop/SKILL.md"

fail() {
  printf 'agent-interop capability surface check failed: %s\n' "$*" >&2
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
    'composed_agent_run' \
    'materialized principal binding' \
    'alignment_verdict' \
    'invocation_receipt' \
    'stream_publish' \
    'head_call' \
    'stream_read' \
    'stream_ack' \
    'injected' \
    'unread_head_calls' \
    'A2A' \
    'ACP' \
    '/v1/commonplace/acp/ws' \
    'live provider'; do
    require_text "$file" "$token"
  done
done

for token in \
  'POST /v1/theorem/agent/run' \
  '5,000' \
  'THEOREM_HEAD_INVOKER=fake' \
  '/v1/head-calls/ws?stream=' \
  'deadline_ms' \
  'correlation_id' \
  'a2a.message.send' \
  '/.well-known/agent-card.json' \
  'run:write' \
  'agent_identity_activate'; do
  require_text "$CONTRACT" "$token"
done

for surface in \
  "$PLUGIN_ROOT/README.md" \
  "$PLUGIN_ROOT/references/PLUGIN_INVENTORY.md" \
  "$PLUGIN_ROOT/references/ROUTING.md" \
  "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md"; do
  require_text "$surface" 'AGENT_INTEROP_CAPABILITY.md'
  require_text "$surface" 'agent-interop'
  require_text "$surface" 'composed_agent_run'
done

printf 'agent-interop capability teaching surface: complete\n'
