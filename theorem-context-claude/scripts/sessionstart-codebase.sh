#!/usr/bin/env bash
# SessionStart hook: warm the code KG for a new workstream without blocking.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
tenant_id="${THEOREM_TENANT_ID:-public}"
cwd=$(theorem_jq "$input" '.cwd')
[[ -z "$cwd" ]] && cwd="${CLAUDE_PROJECT_DIR:-$PWD}"
repo_root=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$cwd")
repo_label=$(basename "$repo_root")

manifest_files='[]'
tracked_files='[]'
if git -C "$repo_root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  manifest_files=$(
    git -C "$repo_root" ls-files \
      package.json Cargo.toml pyproject.toml go.mod requirements.txt \
      README.md README.markdown README.rst \
      2>/dev/null | jq -R . | jq -s '.[0:20]'
  ) || manifest_files='[]'
  tracked_files=$(
    git -C "$repo_root" ls-files 2>/dev/null | jq -R . | jq -s '.[0:200]'
  ) || tracked_files='[]'
fi

event_body=$(jq -n \
  --arg tenant_id "$tenant_id" \
  --arg session_id "$sid" \
  --arg repo "$repo_label" \
  --arg root "$repo_root" \
  --argjson manifests "$manifest_files" \
  --argjson files "$tracked_files" \
  '{
    tenant_id: $tenant_id,
    session_id: $session_id,
    event_type: "SessionStart",
    payload: {
      repo: $repo,
      root: $root,
      code_kg_status: "building",
      manifests: $manifests,
      file_tree_sample: $files
    }
  }')
theorem_post "/pairformer/session-event/" "$event_body" "$sid" >/dev/null 2>&1 || true

if [[ "${THEOREM_CODE_KG_AUTO_INGEST:-1}" == "1" ]]; then
  ingest_body=$(jq -n --arg path "$repo_root" '{path: $path}')
  (
    theorem_post "/code/ingest/stream/" "$ingest_body" "$sid" >/dev/null 2>&1 || true
  ) &
fi

printf '{"continue":true}\n'
