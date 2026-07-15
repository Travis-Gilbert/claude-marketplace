#!/usr/bin/env bash

set -euo pipefail

plugin_root=$(cd "$(dirname "$0")/.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT

fail() {
  printf 'install-harness upgrade check failed: %s\n' "$*" >&2
  exit 1
}

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
    [[ ! -e "$target_root/$skill" ]] \
      || fail "retired skill remains installed: $target_root/$skill"
  done
  for skill in \
    commitments-policy \
    context-management \
    graph-lisp \
    identity-bindings \
    practice-system \
    programmable-wasm \
    replay-last-run \
    solvers \
    writing-engineering; do
    [[ -f "$target_root/$skill/SKILL.md" ]] \
      || fail "full bundle did not install: $target_root/$skill"
  done
done

printf 'install-harness upgrade cleanup passed\n'
