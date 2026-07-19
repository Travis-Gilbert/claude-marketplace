#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CONTRACT="$PLUGIN_ROOT/references/MEMORY_CAPABILITY.md"

fail() {
  printf 'memory-capability surface check failed: %s\n' "$*" >&2
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
  "memory"
  "memoryDoc"
  "memoryArchive"
  "links"
  "related"
  "rememberMemory"
  "reviseMemory"
  "forgetMemory"
  "createHandoff"
)

flat_tools=(
  "recall"
  "relate"
  "remember"
  "encode"
  "self_revise"
  "forget"
  "handoff"
  "self_recall_archive"
  "observe"
  "self_note"
  "self_archive"
  "retrieve_memory"
  "turn_start"
  "evidence_bundle"
)

for field in "${graphql_fields[@]}"; do
  require_text "$CONTRACT" "$field"
  require_text "$PLUGIN_ROOT/README.md" "$field"
  require_text "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md" "$field"
done

for tool in "${flat_tools[@]}"; do
  require_text "$CONTRACT" "$tool"
  require_text "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md" "$tool"
done

linked_surfaces=(
  "$PLUGIN_ROOT/README.md"
  "$PLUGIN_ROOT/commands/encode.md"
  "$PLUGIN_ROOT/references/PLUGIN_INVENTORY.md"
  "$PLUGIN_ROOT/references/ROUTING.md"
  "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md"
  "$PLUGIN_ROOT/skills/encode/SKILL.md"
  "$PLUGIN_ROOT/skills/practice-system/SKILL.md"
)

for surface in "${linked_surfaces[@]}"; do
  require_text "$surface" "MEMORY_CAPABILITY.md"
done

for evidence in \
  "projectSlug" \
  "rankSignals" \
  "episodeProvenance" \
  "episodeProvenanceContentAddress" \
  "DO NOT INDEX THIS CHAT" \
  "3 distinct content-addressed episodes" \
  "3 distinct runs" \
  "2 distinct sessions" \
  "2 positive outcomes" \
  "positive rate of 2/3"; do
  require_text "$CONTRACT" "$evidence"
done

teaching_surfaces=(
  "$PLUGIN_ROOT/README.md"
  "$PLUGIN_ROOT/commands"
  "$PLUGIN_ROOT/references"
  "$PLUGIN_ROOT/skills"
)

readonly INVENTED_PATTERN='\b(memory_search|memory_get|memory_write|memory_retrieve|memory_status|episode_capture|episode_search|retro_import|theorem_memory_signal|training_weight|training_target)\b'
if command -v rg >/dev/null 2>&1; then
  if rg -n "$INVENTED_PATTERN" "${teaching_surfaces[@]}" \
    --glob '!PLANNED-CAPABILITY-PLUGIN-IDEAS.md'; then
    fail "active teaching names a nonexistent standalone memory or episode tool"
  fi
elif grep -ERn '(memory_search|memory_get|memory_write|memory_retrieve|memory_status|episode_capture|episode_search|retro_import|theorem_memory_signal|training_weight|training_target)' \
  "${teaching_surfaces[@]}" \
  | grep -v 'PLANNED-CAPABILITY-PLUGIN-IDEAS.md'; then
  fail "active teaching names a nonexistent standalone memory or episode tool"
fi

printf 'memory-capability teaching surface: complete\n'
