#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CONTRACT="$PLUGIN_ROOT/references/COMMITMENTS_POLICY_CAPABILITY.md"
readonly SKILL="$PLUGIN_ROOT/skills/commitments-policy/SKILL.md"

fail() {
  printf 'commitments-policy surface check failed: %s\n' "$*" >&2
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
    'writeCoordinationRecord' \
    'coordination_record' \
    'commitment_retract' \
    'commitment_supersede' \
    'commitment_check' \
    'recordClaim' \
    'assert_typed_claim' \
    'affirm_typed_commitment' \
    'supersede_typed_commitment' \
    'retract_typed_commitment' \
    'explain_typed_commitment' \
    'Constitution::refusal' \
    'typed_commitment_affirm' \
    'typed_commitment_supersede' \
    'typed_commitment_retract' \
    'typed_commitment_read' \
    'typed_commitment_explain'; do
    require_text "$file" "$token"
  done
done

for contract_token in \
  'supports' \
  'attacks' \
  'contradicts' \
  'supersedes' \
  'TypedClaimWitness' \
  'TypedAssertionReceipt' \
  'affirmed' \
  'retracted' \
  'TypedCommitmentLifecycleReceipt' \
  'StructuredPolicyRefusal' \
  'global_law' \
  'self_model' \
  'project_law' \
  'current_request' \
  'live_evidence' \
  'persisted structured' \
  'full declared core'; do
  require_text "$CONTRACT" "$contract_token"
done

for surface in \
  "$PLUGIN_ROOT/README.md" \
  "$PLUGIN_ROOT/references/PLUGIN_INVENTORY.md" \
  "$PLUGIN_ROOT/references/ROUTING.md" \
  "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md"; do
  require_text "$surface" 'COMMITMENTS_POLICY_CAPABILITY.md'
  require_text "$surface" 'commitment_check'
  require_text "$surface" 'recordClaim'
  require_text "$surface" 'assert_typed_claim'
done

readonly INVENTED_PATTERN='\b(typed_claim_assert|claim_assert|assertTypedClaim|typedCommitmentAffirm|constitutionCheck|policyExplain|commitmentExplain)\b'
if command -v rg >/dev/null 2>&1; then
  if rg -n "$INVENTED_PATTERN" \
    "$PLUGIN_ROOT/README.md" "$PLUGIN_ROOT/commands" "$PLUGIN_ROOT/references" "$PLUGIN_ROOT/skills" \
    --glob '!PLANNED-CAPABILITY-PLUGIN-IDEAS.md'; then
    fail 'active teaching names an invented commitments, claims, or policy surface'
  fi
elif grep -ERn '(typed_claim_assert|claim_assert|assertTypedClaim|typedCommitmentAffirm|affirmTypedCommitment|constitutionCheck|policyExplain|commitmentExplain)' \
  "$PLUGIN_ROOT/README.md" "$PLUGIN_ROOT/commands" "$PLUGIN_ROOT/references" "$PLUGIN_ROOT/skills" \
  | grep -v 'PLANNED-CAPABILITY-PLUGIN-IDEAS.md'; then
  fail 'active teaching names an invented commitments, claims, or policy surface'
fi

printf 'commitments-policy teaching surface: complete\n'
