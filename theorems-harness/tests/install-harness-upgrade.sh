#!/usr/bin/env bash

set -euo pipefail

plugin_root=$(cd "$(dirname "$0")/.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT

claude_dir="$fixture/claude"
codex_dir="$fixture/codex"
retired_skills=(
  "code_theorem"
  "context-refresh"
  "ponytail"
  "ponytail-audit"
  "ponytail-debt"
  "ponytail-gain"
  "ponytail-help"
  "ponytail-review"
  "show-context"
)

for target_root in "$claude_dir" "$codex_dir"; do
  for skill in "${retired_skills[@]}"; do
    mkdir -p "$target_root/$skill"
    printf 'stale\n' >"$target_root/$skill/SKILL.md"
  done
done

"$plugin_root/scripts/install-harness-skills.sh" \
  --source "$plugin_root" \
  --bundle full \
  --claude-dir "$claude_dir" \
  --codex-dir "$codex_dir" \
  >/dev/null 2>&1

for target_root in "$claude_dir" "$codex_dir"; do
  for skill in "${retired_skills[@]}"; do
    [[ ! -e "$target_root/$skill" ]]
  done
  [[ -f "$target_root/context-management/SKILL.md" ]]
  [[ -f "$target_root/identity-bindings/SKILL.md" ]]
  [[ -f "$target_root/practice-system/SKILL.md" ]]
  [[ -f "$target_root/programmable-wasm/SKILL.md" ]]
  [[ -f "$target_root/replay-last-run/SKILL.md" ]]
  [[ -f "$target_root/solvers/SKILL.md" ]]
  [[ -f "$target_root/writing-engineering/SKILL.md" ]]
done

printf 'install-harness upgrade cleanup passed\n'
