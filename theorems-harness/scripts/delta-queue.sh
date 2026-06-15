#!/usr/bin/env bash
# PostToolUse (Edit|Write|NotebookEdit) / FileChanged hook: append changed file
# paths to the session-delta queue, deduped. The queue is flushed at the next
# UserPromptSubmit by code-neighborhood.sh, so the session delta is fresh exactly
# when the context pack is computed -- never per keystroke. Fails open.

set -uo pipefail

# shellcheck disable=SC1091
source "$(dirname "$0")/lib.sh"

# No tenant -> code KG disabled; do nothing.
[ -n "$(theorem_tenant)" ] || { printf '{"continue":true}\n'; exit 0; }
command -v jq >/dev/null 2>&1 || { printf '{"continue":true}\n'; exit 0; }

input=$(theorem_read_stdin)
repo_root=$(theorem_repo_root "$input")

# Candidate paths: the tool's file path (Edit/Write/NotebookEdit) plus a
# FileChanged payload path. Empty for Bash, which then no-ops.
paths=$(printf '%s' "$input" | jq -r '
  [ (.tool_input.file_path // empty),
    (.tool_input.notebook_path // empty),
    (.path // empty),
    (.payload.path // empty) ]
  | map(select(. != "")) | .[]' 2>/dev/null || printf '')

[ -n "$paths" ] || { printf '{"continue":true}\n'; exit 0; }

harness_dir=$(theorem_init_harness_dir "$repo_root")
queue="$harness_dir/session-delta-queue"
touch "$queue" 2>/dev/null || { printf '{"continue":true}\n'; exit 0; }

while IFS= read -r p; do
  [ -n "$p" ] || continue
  rel="${p#"$repo_root"/}"   # store repo-relative
  grep -qxF "$rel" "$queue" 2>/dev/null || printf '%s\n' "$rel" >> "$queue"
done <<< "$paths"

printf '{"continue":true}\n'
exit 0
