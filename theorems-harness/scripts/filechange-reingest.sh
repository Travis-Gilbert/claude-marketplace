#!/usr/bin/env bash
# FileChanged hook: queue narrow code-KG reingestion for changed paths.

set -euo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

theorem_require_jq || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
sid=$(theorem_session_id "$input")
cwd=$(theorem_jq "$input" '.cwd')
[[ -z "$cwd" ]] && cwd="${CLAUDE_PROJECT_DIR:-$PWD}"
repo_root=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$cwd")
path=$(echo "$input" | jq -r '.file_path // .path // .file // empty' 2>/dev/null || echo "")

if [[ -n "$path" && "${THEOREM_CODE_KG_REINGEST:-1}" == "1" ]]; then
  rel_path="$path"
  if [[ "$path" == "$repo_root/"* ]]; then
    rel_path="${path#"$repo_root/"}"
  fi
  ingest_body=$(
    jq -n --arg root "$repo_root" --arg path "$rel_path" \
      '{path: $root, paths: [$path]}'
  )
  (
    theorem_post "/code/ingest/stream/" "$ingest_body" "$sid" >/dev/null 2>&1 || true
  ) &
fi

printf '{"continue":true}\n'
