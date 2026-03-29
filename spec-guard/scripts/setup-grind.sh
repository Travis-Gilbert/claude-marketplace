#!/bin/bash
set -euo pipefail

SPEC_PATH=""
VERIFY_CMD=""
MAX_ITERATIONS=30

while [[ $# -gt 0 ]]; do
  case $1 in
    --verify)
      VERIFY_CMD="$2"
      shift 2
      ;;
    --max-iterations)
      MAX_ITERATIONS="$2"
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
  echo "   Usage: /spec-grind path/to/spec.md" >&2
  echo "   Usage: /spec-grind path/to/spec.md --verify 'npm test' --max-iterations 20" >&2
  exit 1
fi

if [[ ! -f "$SPEC_PATH" ]]; then
  echo "Spec file not found: $SPEC_PATH" >&2
  exit 1
fi

mkdir -p .claude

cat > .claude/spec-grind.local.md <<EOF
---
active: true
iteration: 1
max_iterations: $MAX_ITERATIONS
completion_promise: "SPEC_COMPLETE"
verify_command: "$VERIFY_CMD"
spec_source: $SPEC_PATH
started_at: "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
---

Implement the following spec completely. After each change, run the
verification command (if any) and check results.

Verification command: ${VERIFY_CMD:-"(none, use your judgment)"}

When ALL requirements are implemented and verified, output:
<promise>SPEC_COMPLETE</promise>

Do NOT output the promise until the spec is genuinely complete.

--- SPEC BEGINS ---

$(cat "$SPEC_PATH")

--- SPEC ENDS ---
EOF

# Also activate spec-guard so edits are checked during grinding
cp ".claude/spec-grind.local.md" ".claude/spec-guard.local.md"

echo "Spec Grind activated"
echo ""
echo "   Spec: $SPEC_PATH"
echo "   Verify: ${VERIFY_CMD:-"(none)"}"
echo "   Max iterations: $MAX_ITERATIONS"
echo ""
echo "   The Stop hook will keep you in the loop until done."
echo "   Spec Guard is also active (edits checked against spec)."
echo ""
echo "   To cancel: /cancel-grind"
