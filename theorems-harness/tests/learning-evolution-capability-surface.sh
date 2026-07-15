#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CONTRACT="$PLUGIN_ROOT/references/LEARNING_EVOLUTION_CAPABILITY.md"
readonly SKILL="$PLUGIN_ROOT/skills/learning-evolution/SKILL.md"

fail() {
  printf 'learning-evolution capability surface check failed: %s\n' "$*" >&2
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
    'recordVerification' \
    'verification_record' \
    'calibrationReliability' \
    'calibration_reliability' \
    'rememberMemory' \
    'encode' \
    'programmable_graph' \
    'action: "evolve"' \
    'programmable_graph_apply' \
    'GEPA' \
    'ReasoningBank' \
    'theorem-evolve' \
    'tenant' \
    'outcome' \
    'independent' \
    'live provider'; do
    require_text "$file" "$token"
  done
done

for token in \
  'gepa_trainset_for_intent' \
  'route_gepa_candidate_through_gate' \
  'score_candidate' \
  'evaluate_world_forks' \
  'promote_candidates' \
  'There is no GraphQL or dynamic projection' \
  'No rollback API'; do
  require_text "$CONTRACT" "$token"
done

for surface in \
  "$PLUGIN_ROOT/README.md" \
  "$PLUGIN_ROOT/references/PLUGIN_INVENTORY.md" \
  "$PLUGIN_ROOT/references/ROUTING.md" \
  "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md"; do
  require_text "$surface" 'LEARNING_EVOLUTION_CAPABILITY.md'
  require_text "$surface" 'learning-evolution'
  require_text "$surface" 'programmable_graph'
done

printf 'learning-evolution capability teaching surface: complete\n'
