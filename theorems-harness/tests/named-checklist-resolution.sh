#!/usr/bin/env bash

set -euo pipefail

plugin_root=$(cd "$(dirname "$0")/.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT

mkdir -p "$fixture/.git"
export PLUGIN_ROOT="$plugin_root"
export THEOREM_HARNESS_MCP_URL="http://127.0.0.1:9/mcp"

emit_contract() {
  local session_id="$1"
  local plan_id="$2"
  local plan_slug="$3"
  jq -n \
    --arg cwd "$fixture" \
    --arg session_id "$session_id" \
    --arg plan_id "$plan_id" \
    --arg plan_slug "$plan_slug" \
    --arg prompt $'Implement this plan.\n\n### 1. Prove the named checklist\nAcceptance: The bound session resolves only its own projection.' \
    '{cwd: $cwd, session_id: $session_id, plan_id: $plan_id, plan_slug: $plan_slug, prompt: $prompt}' \
    | "$plugin_root/scripts/checklist-contract.sh" >/dev/null
}

gate_session() {
  local session_id="$1"
  jq -n --arg cwd "$fixture" --arg session_id "$session_id" \
    '{cwd: $cwd, session_id: $session_id}' \
    | "$plugin_root/scripts/checklist-gate.sh"
}

emit_contract "session-a" "plan-a" "memtensors"
emit_contract "session-b" "plan-b" "context-leases"

memtensor_checklist="$fixture/.harness/checklists/memtensors--plan-a.json"
context_checklist="$fixture/.harness/checklists/context-leases--plan-b.json"

test -f "$memtensor_checklist"
test -f "$context_checklist"
test ! -f "$fixture/.harness/checklist.json"

jq '.items[0].status = "verified" | .items[0].verification = {status: "passed", evidence: "fixture"}' \
  "$context_checklist" > "$context_checklist.tmp"
mv "$context_checklist.tmp" "$context_checklist"

session_a_result=$(gate_session "session-a")
session_b_result=$(gate_session "session-b")

test "$(printf '%s' "$session_a_result" | jq -r '.decision')" = "block"
printf '%s' "$session_a_result" | jq -e --arg path "$memtensor_checklist" '.reason | contains($path)' >/dev/null
test "$(printf '%s' "$session_b_result" | jq -r '.continue')" = "true"

rm -rf "$fixture/.harness/checklists" "$fixture/.harness/session-plan-bindings"
mkdir -p "$fixture/.harness"
jq -n '{items: [{id: "legacy", deliverable: "legacy projection", status: "open"}]}' \
  > "$fixture/.harness/checklist.json"

legacy_result=$(gate_session "legacy-session")
test "$(printf '%s' "$legacy_result" | jq -r '.decision')" = "block"
printf '%s' "$legacy_result" | jq -e '.reason | contains(".harness/checklist.json")' >/dev/null

bound_without_projection=$(
  jq -n --arg cwd "$fixture" --arg session_id "missing-plan-session" --arg plan_id "missing-plan" \
    '{cwd: $cwd, session_id: $session_id, plan_id: $plan_id}' \
    | "$plugin_root/scripts/checklist-gate.sh"
)
test "$(printf '%s' "$bound_without_projection" | jq -r '.continue')" = "true"

printf 'named checklist resolution: ok\n'
