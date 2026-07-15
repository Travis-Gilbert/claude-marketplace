#!/usr/bin/env bash

set -euo pipefail
IFS=$'\n\t'

readonly ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT"

if [[ $# -ne 2 || "$1" != "--plugin" || "$2" != "--installed-cache" ]]; then
  printf 'usage: scripts/check-harness-capability-drift.sh --plugin --installed-cache\n' >&2
  exit 2
fi

installed=${THEOREM_CAPABILITY_PLUGIN_CACHE:-}
if [[ -z "$installed" ]]; then
  version=$(python3 -c 'import json; print(json.load(open("theorems-harness/plugin.manifest.json"))["plugin"]["version"])')
  installed="$HOME/.codex/plugins/cache/codex-marketplace/theorems-harness/$version"
fi

args=(theorems-harness --installed-cache "$installed" --require-live)
if [[ -n "${THEOREM_CAPABILITY_LIVE_CATALOG:-}" ]]; then
  args+=(--live-catalog "$THEOREM_CAPABILITY_LIVE_CATALOG")
fi

python3 scripts/validate_plugin.py "${args[@]}"
