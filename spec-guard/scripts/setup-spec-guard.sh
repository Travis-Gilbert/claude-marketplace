#!/bin/bash
set -euo pipefail

# Parse arguments
SPEC_PATH=""
PROTECTED_FILES=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --protected)
      PROTECTED_FILES="$2"
      shift 2
      ;;
    *)
      SPEC_PATH="$1"
      shift
      ;;
  esac
done

if [[ -z "$SPEC_PATH" ]]; then
  echo "No spec path provided." >&2
  echo "" >&2
  echo "   Usage: /spec-guard path/to/spec.md" >&2
  echo "   Usage: /spec-guard path/to/spec.md --protected src/styles/,src/components/Hero" >&2
  exit 1
fi

if [[ ! -f "$SPEC_PATH" ]]; then
  echo "Spec file not found: $SPEC_PATH" >&2
  exit 1
fi

mkdir -p .claude

# Copy spec content into the state file
cat > .claude/spec-guard.local.md <<EOF
---
spec_source: $SPEC_PATH
activated_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
---

$(cat "$SPEC_PATH")
EOF

# Write protected paths if provided
if [[ -n "$PROTECTED_FILES" ]]; then
  echo "$PROTECTED_FILES" | tr ',' '\n' > .claude/spec-guard-protected.local.txt
  echo "Protected paths:"
  sed 's/^/   /' .claude/spec-guard-protected.local.txt
  echo ""
fi

echo "Spec Guard activated"
echo ""
echo "   Spec: $SPEC_PATH"
echo "   All Edit/Write/MultiEdit operations will be checked."
echo ""
echo "   To deactivate: rm .claude/spec-guard.local.md"
