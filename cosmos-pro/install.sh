#!/usr/bin/env bash
# cosmos-pro: clone reference repositories into refs/ at pinned versions.
# Mirrors the vie-design install pattern: shallow, no tags, no LFS smudge.
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
    GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --no-tags "${url}" "${target}" \
      || { rm -rf "${target}"; echo "  [FAIL] ${name}"; return 1; }
    # Strip .git to keep the plugin light; we never push from here.
    rm -rf "${target}/.git"
    echo "  [done] ${name}"
  fi
}

echo "cosmos-pro: cloning reference repositories..."

# cosmos.gl/graph engine source.
# Pin: track the version in travisgilbert.me's package.json (cosmos v2.x).
# Default to main if no pinned tag exists for the cosmos v2 line.
clone_if_missing "cosmos-gl"     "https://github.com/cosmosgl/graph.git" &

# Mosaic core + sql + vgplot from uwdata.
# Pin: matches @uwdata/mosaic-core 0.24.x in the runtime project.
clone_if_missing "mosaic"        "https://github.com/uwdata/mosaic.git" &

# DuckDB-WASM TypeScript source. Pin: 1.32.0 matches the runtime project.
clone_if_missing "duckdb-wasm"   "https://github.com/duckdb/duckdb-wasm.git" &

# Luma.gl shadertools (heatmap overlay recipe). Pin: 9.2.6 per runtime brief.
clone_if_missing "luma-gl"       "https://github.com/visgl/luma.gl.git" &

wait

# theseus-viz-types is synced from the runtime project, not cloned.
# This script only ensures the directory exists. sync-plugins.sh (or a
# project-specific sync step) is responsible for copying the SceneDirective
# source file in.
mkdir -p "${REFS_DIR}/theseus-viz-types"
if [ ! -f "${REFS_DIR}/theseus-viz-types/README.md" ]; then
  cat > "${REFS_DIR}/theseus-viz-types/README.md" <<'EOF'
# theseus-viz-types (sync target)

This directory is populated by syncing from the runtime project, not by
cloning. The expected content:

- `SceneDirective.ts` — copied from
  `<travisgilbert.me>/src/lib/theseus-viz/SceneDirective.ts`

Sync command (from the runtime project root):

```bash
cp src/lib/theseus-viz/SceneDirective.ts \
  ../codex-plugins/cosmos-pro/refs/theseus-viz-types/SceneDirective.ts
```

Run this after every change to the SceneDirective contract. The cosmos-pro
adapter (`templates/applyDirective.ts`) is the only consumer; if the contract
drifts, the adapter must move with it.
EOF
fi

echo "cosmos-pro: done."
echo "Note: examples/raw/ is populated by a separate scrape step (see"
echo "skills/cosmos-recipes/SKILL.md for the cosmograph.app/dev/ scrape plan)."
