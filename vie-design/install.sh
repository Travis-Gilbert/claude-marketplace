#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REFS_DIR="${SCRIPT_DIR}/refs"

mkdir -p "${REFS_DIR}"

clone_if_missing() {
  local name="$1"
  local url="$2"
  local target="${REFS_DIR}/${name}"

  if [ -d "${target}" ]; then
    echo "  [skip] ${name} already exists"
  else
    echo "  [clone] ${name}..."
    GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --no-tags "${url}" "${target}" || { rm -rf "${target}"; echo "  [FAIL] ${name}"; return 1; }
    echo "  [done] ${name}"
  fi
}

echo "vie-design: cloning reference repositories..."
clone_if_missing "mantine"              "https://github.com/mantinedev/mantine.git" &
clone_if_missing "sonner"               "https://github.com/emilkowalski/sonner.git" &
clone_if_missing "vaul"                 "https://github.com/emilkowalski/vaul.git" &
clone_if_missing "cmdk"                 "https://github.com/pacocoursey/cmdk.git" &
clone_if_missing "ink-ui"               "https://github.com/vadimdemedes/ink-ui.git" &
clone_if_missing "vega-lite"            "https://github.com/vega/vega-lite.git" &
clone_if_missing "observable-framework" "https://github.com/observablehq/framework.git" &
wait
echo "vie-design: done."
