#!/usr/bin/env bash
#
# Hermetic guards for the live tool-surface snapshot.
#
# The full drift check (scripts/regen-routing.sh --check) needs a live server or
# a source-catalog dump, so it cannot run here. These are the parts that can be
# checked offline: that the snapshot is internally consistent (so a hand-edit is
# caught), and that the generator has not regained a teaching role that the
# capability projections own.

set -euo pipefail

plugin_root=$(cd "$(dirname "$0")/.." && pwd)
readonly SNAPSHOT="$plugin_root/references/TOOL_SURFACE.md"
readonly GENERATOR="$plugin_root/scripts/regen-routing.sh"

fail() {
  printf 'tool-surface snapshot check failed: %s\n' "$*" >&2
  exit 1
}

[[ -f "$SNAPSHOT" ]] || fail "snapshot is missing: references/TOOL_SURFACE.md"
[[ -x "$GENERATOR" ]] || fail "generator is missing or not executable: scripts/regen-routing.sh"

bash -n "$GENERATOR" || fail "generator has a syntax error"

grep -Fq 'scripts/regen-routing.sh' "$SNAPSHOT" \
  || fail "snapshot does not declare its generator"
grep -Fq 'drift evidence, not a teaching catalog' "$SNAPSHOT" \
  || fail "snapshot must state it is drift evidence, not a teaching catalog"

declared=$(sed -n 's/^- tools: \([0-9]\{1,\}\)$/\1/p' "$SNAPSHOT" | head -1)
[[ -n "$declared" ]] || fail "snapshot has no '- tools: <n>' header line"

actual=$(grep -c '^| `' "$SNAPSHOT" || true)
[[ "$declared" == "$actual" ]] \
  || fail "snapshot declares $declared tools but lists $actual rows (hand-edited? rerun scripts/regen-routing.sh)"

digest=$(sed -n 's/^- digest: `\([0-9a-f]\{1,\}\)`$/\1/p' "$SNAPSHOT" | head -1)
[[ -n "$digest" ]] || fail "snapshot has no '- digest: <hex>' header line"

# The capability projections own teaching. The generator must never write into a
# skill, or the plugin regains the second global catalog that design forbids.
if grep -qE '(SKILL_FILE|skills/[a-z_-]+/SKILL\.md)' "$GENERATOR"; then
  fail "generator writes into a skill; teaching belongs to capabilities/ projections"
fi

printf 'tool-surface snapshot: %s tools, digest %s, generator scoped to references only\n' \
  "$declared" "$digest"
