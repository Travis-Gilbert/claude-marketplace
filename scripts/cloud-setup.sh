#!/usr/bin/env bash
# Claude Code Web setup script.
#
# Paste the contents of this file into your cloud environment's "Setup script"
# field. It runs once at session start and forces the install of every
# codex-marketplace plugin via the official `claude plugin install` CLI —
# bypassing any .claude/settings.json parsing.
#
# Idempotent: re-runs are safe (claude plugin install no-ops on already-
# installed plugins).

set -e

MARKETPLACE_REPO="Travis-Gilbert/claude-marketplace"
MARKETPLACE_NAME="codex-marketplace"

PLUGINS=(
  animation-pro app-forge app-pro cosmos-pro d3-pro
  django-design django-engine-pro ml-pro next-pro plan-pro
  scipy-pro shipit spec-compliance spec-guard swift-pro
  three-pro ui-design-pro ux-pro vie-design
)

echo "[cloud-setup] adding marketplace ${MARKETPLACE_NAME} from github:${MARKETPLACE_REPO}"
claude plugin marketplace add "$MARKETPLACE_REPO" || true

echo "[cloud-setup] installing ${#PLUGINS[@]} plugins..."
for p in "${PLUGINS[@]}"; do
  echo "  ${p}@${MARKETPLACE_NAME}"
  claude plugin install "${p}@${MARKETPLACE_NAME}" || echo "    (skip: already installed or transient failure)"
done

echo "[cloud-setup] done. Verify with: claude plugin list"
