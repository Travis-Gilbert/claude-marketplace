#!/bin/bash
set -euo pipefail

SPEC_FILE=".claude/spec-guard.local.md"

# No active spec, allow everything
if [[ ! -f "$SPEC_FILE" ]]; then
  exit 0
fi

# Read hook input
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE_PATH" ]]; then
  exit 0  # No file path in input, allow
fi

# Check if file is in the spec's protected paths list
# (extracted from spec frontmatter during setup)
PROTECTED_FILE=".claude/spec-guard-protected.local.txt"
if [[ -f "$PROTECTED_FILE" ]]; then
  while IFS= read -r pattern; do
    if [[ "$FILE_PATH" == *"$pattern"* ]]; then
      echo "Spec Guard: Editing protected file '$FILE_PATH' (matches '$pattern')" >&2
      echo "   Review the spec at $SPEC_FILE before proceeding." >&2
      # Note: exit 2 would BLOCK. For now, warn only.
      # Change to exit 2 for hard enforcement.
      exit 0
    fi
  done < "$PROTECTED_FILE"
fi

exit 0
