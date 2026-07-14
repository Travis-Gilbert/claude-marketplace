#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly PLUGIN_ROOT="$REPO_ROOT/theorems-harness"
readonly RETIRED_PATTERN='show-context|context-refresh|code_theorem|ponytail(-audit|-debt|-gain|-help|-review)?'

retired_names=(
  "show-context"
  "context-refresh"
  "code_theorem"
  "ponytail"
  "ponytail-audit"
  "ponytail-debt"
  "ponytail-gain"
  "ponytail-help"
  "ponytail-review"
)

fail() {
  printf 'dead-surface check failed: %s\n' "$*" >&2
  exit 1
}

[[ -d "$PLUGIN_ROOT" ]] || fail "plugin root not found: $PLUGIN_ROOT"

for name in "${retired_names[@]}"; do
  [[ ! -e "$PLUGIN_ROOT/commands/$name.md" ]] || fail "retired command remains callable: $name"
  [[ ! -e "$PLUGIN_ROOT/skills/$name" ]] || fail "retired skill remains callable: $name"
done

active_surfaces=(
  "$PLUGIN_ROOT/.claude-plugin"
  "$PLUGIN_ROOT/.codex-plugin"
  "$PLUGIN_ROOT/commands"
  "$PLUGIN_ROOT/hooks"
  "$PLUGIN_ROOT/plugin.manifest.json"
)

if command -v rg >/dev/null 2>&1; then
  if rg -n -i "$RETIRED_PATTERN" "${active_surfaces[@]}"; then
    fail "a retired name remains in an active manifest, hook, or command surface"
  fi
else
  if grep -ERin "$RETIRED_PATTERN" "${active_surfaces[@]}"; then
    fail "a retired name remains in an active manifest, hook, or command surface"
  fi
fi

for name in "${retired_names[@]}"; do
  if ! grep -Fq "\"$name\"" "$PLUGIN_ROOT/scripts/install-harness-skills.sh"; then
    fail "upgrade cleanup does not remove retired skill: $name"
  fi
done

[[ -f "$PLUGIN_ROOT/skills/replay-last-run/SKILL.md" ]] || fail "real replay-last-run skill is missing"
[[ -f "$PLUGIN_ROOT/commands/replay-last-run.md" ]] || fail "real replay-last-run command is missing"
[[ -f "$PLUGIN_ROOT/skills/practice-system/SKILL.md" ]] || fail "replacement practice system is missing"

readonly PLAN_SEQUENCE='claim.*patch_proposed.*spawn_verify.*submit_verify.*prove.*done'
for teaching in \
  "$PLUGIN_ROOT/skills/execute/SKILL.md" \
  "$PLUGIN_ROOT/skills/planning-theorem/SKILL.md" \
  "$PLUGIN_ROOT/skills/theorems-harness/SKILL.md"; do
  tr '\n' ' ' < "$teaching" | grep -Eq "$PLAN_SEQUENCE" \
    || fail "Plan lifecycle teaching is incomplete or out of order: ${teaching#$REPO_ROOT/}"
done

grep -Fq 'reviewer distinct from' "$PLUGIN_ROOT/skills/execute/SKILL.md" \
  || fail "execute skill does not require an independent Plan reviewer"

grep -Fq 'patch_digest' "$PLUGIN_ROOT/skills/execute/SKILL.md" \
  || fail "execute skill does not bind Plan evidence to a patch digest"

if tr '\n' ' ' < "$PLUGIN_ROOT/skills/execute/SKILL.md" \
  | grep -Eq 'patch_proposed.{0,80}(->|→).{0,80}verifying.{0,80}(->|→).{0,80}done'; then
  fail "active teaching still routes Plan tasks through the incompatible verifying sequence"
fi

"$PLUGIN_ROOT/tests/install-harness-upgrade.sh"

printf 'theorems-harness dead surfaces: clean\n'
