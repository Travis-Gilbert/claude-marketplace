#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly CONTRACT="$PLUGIN_ROOT/references/CODE_CAPABILITY.md"

fail() {
  printf 'code-capability surface check failed: %s\n' "$*" >&2
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
  "ingestCodebase"
  "reindexCodebase"
  "codeStatus"
  "codeSearch"
  "codeContext"
  "codeExplain"
  "codeSpec"
  "codeDrift"
  "codeFeatures"
  "codeObligations"
)

flat_tools=(
  "compute_code"
  "code_ingest"
  "code_compile_spec"
  "code_spec_drift"
  "code_extract_features"
  "code_implementation_obligations"
)

for field in "${graphql_fields[@]}"; do
  require_text "$CONTRACT" "$field"
  require_text "$PLUGIN_ROOT/README.md" "$field"
  require_text "$PLUGIN_ROOT/commands/compute_code.md" "$field"
  require_text "$PLUGIN_ROOT/skills/compute_code/SKILL.md" "$field"
done

for tool in "${flat_tools[@]}"; do
  require_text "$CONTRACT" "$tool"
  require_text "$PLUGIN_ROOT/README.md" "$tool"
  require_text "$PLUGIN_ROOT/commands/compute_code.md" "$tool"
  require_text "$PLUGIN_ROOT/skills/compute_code/SKILL.md" "$tool"
done

require_text "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md" 'CODE_CAPABILITY.md'
require_text "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md" '/compute_code'

teaching_surfaces=(
  "$PLUGIN_ROOT/README.md"
  "$PLUGIN_ROOT/commands"
  "$PLUGIN_ROOT/references"
  "$PLUGIN_ROOT/skills"
)

if command -v rg >/dev/null 2>&1; then
  if rg -n '\bcode_context\b' "${teaching_surfaces[@]}" \
    --glob '!rust-engineering/scripts/**'; then
    fail "teaching still names a nonexistent standalone code context tool"
  fi
elif grep -ERn '(^|[^[:alnum:]_])code_context([^[:alnum:]_]|$)' \
  "${teaching_surfaces[@]}"; then
  fail "teaching still names a nonexistent standalone code context tool"
fi

require_text "$PLUGIN_ROOT/skills/research/SKILL.md" '`codeSearch`'
require_text "$PLUGIN_ROOT/skills/research/SKILL.md" '`codeContext`'
require_text "$PLUGIN_ROOT/skills/research/SKILL.md" 'operation `context`'
require_text "$PLUGIN_ROOT/commands/research.md" '`codeExplain`'

printf 'code-capability teaching surface: complete\n'
