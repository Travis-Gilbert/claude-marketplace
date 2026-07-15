#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CONTRACT="$PLUGIN_ROOT/references/VERIFICATION_CAPABILITY.md"

fail() {
  printf 'verification-capability surface check failed: %s\n' "$*" >&2
  exit 1
}

require_text() {
  local file=$1
  local expected=$2

  grep -Fq "$expected" "$file" \
    || fail "${file#$PLUGIN_ROOT/} does not teach $expected"
}

[[ -f "$CONTRACT" ]] || fail "canonical contract is missing"

graphql_fields=(
  "recordVerification"
  "verificationReceipt"
  "verificationExplain"
  "verificationAllocate"
  "calibrationReliability"
)

flat_tools=(
  "verification_record"
  "verification_receipt"
  "verification_explain"
  "verification_allocate"
  "calibration_reliability"
)

for field in "${graphql_fields[@]}"; do
  require_text "$CONTRACT" "$field"
  require_text "$PLUGIN_ROOT/README.md" "$field"
  require_text "$PLUGIN_ROOT/references/ROUTING.md" "$field"
  require_text "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md" "$field"
done

for tool in "${flat_tools[@]}"; do
  require_text "$CONTRACT" "$tool"
  require_text "$PLUGIN_ROOT/README.md" "$tool"
  require_text "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md" "$tool"
done

linked_surfaces=(
  "$PLUGIN_ROOT/README.md"
  "$PLUGIN_ROOT/references/PLUGIN_INVENTORY.md"
  "$PLUGIN_ROOT/references/ROUTING.md"
  "$PLUGIN_ROOT/skills/symbolic/SKILL.md"
  "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md"
)

for surface in "${linked_surfaces[@]}"; do
  require_text "$surface" "VERIFICATION_CAPABILITY.md"
done

for schema_token in \
  "claim_ref" \
  "evidence_ref" \
  "supports" \
  "attacks" \
  "lineage_refs" \
  "actor_id" \
  "binding_id" \
  "head_id" \
  "model_version" \
  "method_id" \
  "supported" \
  "refuted" \
  "inconclusive" \
  "graph_version" \
  "calibration_key" \
  "oracle" \
  "test_or_proof" \
  "user_correction" \
  "diagnosis" \
  "idempotent_replay" \
  "admission_tier" \
  "load_bearing" \
  "quarantined"; do
  require_text "$CONTRACT" "$schema_token"
done

for guardrail in \
  "overwrite" \
  "reported runtime metadata" \
  "confidence is not proof" \
  "authentication, action authorization" \
  "does not change calibration" \
  "symbolic tool"; do
  require_text "$CONTRACT" "$guardrail"
done

teaching_surfaces=(
  "$PLUGIN_ROOT/README.md"
  "$PLUGIN_ROOT/commands"
  "$PLUGIN_ROOT/references"
  "$PLUGIN_ROOT/skills"
)

readonly INVENTED_PATTERN='\b(verification_create|verification_get|verification_read|verification_budget|verification_calibrate|verification_reliability|calibration_score|calibration_get|verificationCreate|verificationGet|verificationBudget|verificationReliability)\b'
if command -v rg >/dev/null 2>&1; then
  if rg -n "$INVENTED_PATTERN" "${teaching_surfaces[@]}" \
    --glob '!PLANNED-CAPABILITY-PLUGIN-IDEAS.md'; then
    fail "active teaching names an invented verification or calibration surface"
  fi
elif grep -ERn '(verification_create|verification_get|verification_read|verification_budget|verification_calibrate|verification_reliability|calibration_score|calibration_get|verificationCreate|verificationGet|verificationBudget|verificationReliability)' \
  "${teaching_surfaces[@]}" \
  | grep -v 'PLANNED-CAPABILITY-PLUGIN-IDEAS.md'; then
  fail "active teaching names an invented verification or calibration surface"
fi

printf 'verification-capability teaching surface: complete\n'
