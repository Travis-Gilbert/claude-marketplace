#!/usr/bin/env bash
# plan-pro bootstrap: ensure venv exists, then run the orchestrator.
set -euo pipefail

if [[ -z "${CLAUDE_PLUGIN_ROOT:-}" ]]; then
  CLAUDE_PLUGIN_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fi

cd "$CLAUDE_PLUGIN_ROOT"

if [[ ! -d .venv ]]; then
  echo "plan-pro: creating venv..." >&2
  python3 -m venv .venv
  .venv/bin/pip install -e . >/dev/null 2>&1
fi

exec .venv/bin/python scripts/plan_pro.py "$@"
