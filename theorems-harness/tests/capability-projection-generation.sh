#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
readonly PLUGIN_ROOT="$REPO_ROOT/theorems-harness"
readonly FIXTURES="$PLUGIN_ROOT/tests/fixtures/capability-projection"
readonly GENERATED="$PLUGIN_ROOT/skills/coordination-operations/CAPABILITIES.generated.md"
fixture_root=$(mktemp -d)
generated_backup="$fixture_root/generated.backup"
trap 'cp "$generated_backup" "$GENERATED" 2>/dev/null || true; rm -rf "$fixture_root"' EXIT
cp "$GENERATED" "$generated_backup"

fail() {
  printf 'capability projection generation check failed: %s\n' "$*" >&2
  exit 1
}

expect_fixture_failure() {
  local fixture=$1
  local expected=$2
  shift 2
  local output="$fixture_root/${fixture%.json}.log"
  if python3 "$REPO_ROOT/scripts/validate_plugin.py" theorems-harness \
      --fixture "$FIXTURES/$fixture" "$@" >"$output" 2>&1; then
    fail "$fixture unexpectedly passed"
  fi
  grep -Fq "$expected" "$output" \
    || fail "$fixture did not report $expected"
}

python3 "$REPO_ROOT/scripts/generate_harness_capability_projections.py" \
  theorems-harness --check >/dev/null
python3 "$REPO_ROOT/scripts/validate_plugin.py" theorems-harness \
  --fixture "$FIXTURES/clean.json" >/dev/null

expect_fixture_failure dirty-fictional.json 'fictional flat MCP capability'
expect_fixture_failure dirty-deprecated.json 'deprecated capability taught as current'
expect_fixture_failure dirty-unregistered.json 'unregistered dynamic capability'
expect_fixture_failure dirty-broken-link.json 'broken skill link'
expect_fixture_failure dirty-version.json 'capability source/plugin version drift'
expect_fixture_failure dirty-live-missing.json 'live-missing capability' \
  --live-catalog "$FIXTURES/live-empty.json"

printf '\nnon-idempotent fixture\n' >>"$GENERATED"
if python3 "$REPO_ROOT/scripts/validate_plugin.py" theorems-harness \
    >"$fixture_root/non-idempotent.log" 2>&1; then
  fail 'dirty generated projection unexpectedly passed'
fi
grep -Fq 'non-idempotent or stale generated projection' \
  "$fixture_root/non-idempotent.log" \
  || fail 'dirty generated projection did not report regeneration drift'
cp "$generated_backup" "$GENERATED"

claude_dir="$fixture_root/claude"
codex_dir="$fixture_root/codex"
"$PLUGIN_ROOT/scripts/install-harness-skills.sh" \
  --source "$PLUGIN_ROOT" \
  --bundle full \
  --claude-dir "$claude_dir" \
  --codex-dir "$codex_dir" >/dev/null 2>&1
mkdir -p "$codex_dir/.codex-plugin"
cp "$PLUGIN_ROOT/.codex-plugin/plugin.json" "$codex_dir/.codex-plugin/plugin.json"
THEOREM_CAPABILITY_PLUGIN_CACHE="$codex_dir" \
THEOREM_CAPABILITY_LIVE_CATALOG="$PLUGIN_ROOT/capabilities/source-surfaces.json" \
  "$REPO_ROOT/scripts/check-harness-capability-drift.sh" \
  --plugin --installed-cache >/dev/null

full_cache="$fixture_root/full-plugin-cache"
mkdir -p "$full_cache/.codex-plugin" "$full_cache/capabilities" \
  "$full_cache/references" "$full_cache/skills"
cp "$PLUGIN_ROOT/.codex-plugin/plugin.json" "$full_cache/.codex-plugin/plugin.json"
cp "$PLUGIN_ROOT/capabilities/families.json" "$full_cache/capabilities/families.json"
cp "$PLUGIN_ROOT/capabilities/source-surfaces.json" \
  "$full_cache/capabilities/source-surfaces.json"
cp "$PLUGIN_ROOT/references/CAPABILITY_CATALOG.generated.md" \
  "$full_cache/references/CAPABILITY_CATALOG.generated.md"
cp "$PLUGIN_ROOT/references/COMPATIBILITY.generated.md" \
  "$full_cache/references/COMPATIBILITY.generated.md"
while IFS= read -r skill; do
  mkdir -p "$full_cache/skills/$skill"
  cp "$PLUGIN_ROOT/skills/$skill/SKILL.md" "$full_cache/skills/$skill/SKILL.md"
  cp "$PLUGIN_ROOT/skills/$skill/CAPABILITIES.generated.md" \
    "$full_cache/skills/$skill/CAPABILITIES.generated.md"
done < <(python3 -c \
  'import json,sys; [print(f["skill"]) for f in json.load(open(sys.argv[1]))["families"]]' \
  "$PLUGIN_ROOT/capabilities/families.json")
python3 "$REPO_ROOT/scripts/validate_plugin.py" theorems-harness \
  --installed-cache "$full_cache" >/dev/null

cp "$FIXTURES/installed-version-drift.json" "$codex_dir/.codex-plugin/plugin.json"
if python3 "$REPO_ROOT/scripts/validate_plugin.py" theorems-harness \
    --installed-cache "$codex_dir" >"$fixture_root/installed-version.log" 2>&1; then
  fail 'installed version drift unexpectedly passed'
fi
grep -Fq 'source/installed-cache version drift' "$fixture_root/installed-version.log" \
  || fail 'installed version fixture did not report version drift'
cp "$PLUGIN_ROOT/.codex-plugin/plugin.json" "$codex_dir/.codex-plugin/plugin.json"

printf '\ninstalled drift fixture\n' \
  >>"$codex_dir/coordination-operations/CAPABILITIES.generated.md"
if python3 "$REPO_ROOT/scripts/validate_plugin.py" theorems-harness \
    --installed-cache "$codex_dir" >"$fixture_root/installed-drift.log" 2>&1; then
  fail 'dirty installed cache unexpectedly passed'
fi
grep -Fq 'source/installed-cache content drift' "$fixture_root/installed-drift.log" \
  || fail 'dirty installed cache did not report content drift'

printf 'capability projection generation and fixtures: complete\n'
