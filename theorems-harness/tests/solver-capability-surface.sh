#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CONTRACT="$PLUGIN_ROOT/references/SOLVER_CAPABILITY.md"
readonly SKILL="$PLUGIN_ROOT/skills/solvers/SKILL.md"

fail() {
  printf 'solver-capability surface check failed: %s\n' "$*" >&2
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
    'constraint.check' \
    'constraint.optimize' \
    'candidate_affordance_ids' \
    'operation_receipt' \
    'proof_eligible'; do
    require_text "$file" "$token"
  done
done

for contract_token in \
  '120,000' \
  '1,000,000' \
  '4,096' \
  'receipt_hash' \
  'execution_hash' \
  'verification_state' \
  'recorded'; do
  require_text "$CONTRACT" "$contract_token"
done

for surface in \
  "$PLUGIN_ROOT/README.md" \
  "$PLUGIN_ROOT/references/PLUGIN_INVENTORY.md" \
  "$PLUGIN_ROOT/references/ROUTING.md" \
  "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md"; do
  require_text "$surface" 'SOLVER_CAPABILITY.md'
  require_text "$surface" 'constraint.check'
  require_text "$surface" 'constraint.optimize'
done

readonly INVENTED_PATTERN='\b(constraint_check|constraint_optimize|solver_check|solver_optimize|ConstraintCheckMutation|ConstraintOptimizeMutation)\b'
if command -v rg >/dev/null 2>&1; then
  if rg -n "$INVENTED_PATTERN" \
    "$PLUGIN_ROOT/README.md" "$PLUGIN_ROOT/commands" "$PLUGIN_ROOT/references" "$PLUGIN_ROOT/skills" \
    --glob '!PLANNED-CAPABILITY-PLUGIN-IDEAS.md'; then
    fail 'active teaching names an invented dedicated solver surface'
  fi
elif grep -ERn '(constraint_check|constraint_optimize|solver_check|solver_optimize|ConstraintCheckMutation|ConstraintOptimizeMutation)' \
  "$PLUGIN_ROOT/README.md" "$PLUGIN_ROOT/commands" "$PLUGIN_ROOT/references" "$PLUGIN_ROOT/skills" \
  | grep -v 'PLANNED-CAPABILITY-PLUGIN-IDEAS.md'; then
  fail 'active teaching names an invented dedicated solver surface'
fi

printf 'solver-capability teaching surface: complete\n'
