---
description: "Cancel active spec grind loop"
allowed-tools: ["Bash(test -f .claude/spec-grind.local.md:*)", "Bash(rm .claude/spec-grind.local.md)", "Bash(rm -f .claude/spec-guard.local.md)", "Read(.claude/spec-grind.local.md)"]
---

# Cancel Grind

1. Check if `.claude/spec-grind.local.md` exists
2. If not found: say "No active grind loop."
3. If found:
   - Read it to get the iteration number
   - Remove `.claude/spec-grind.local.md`
   - Remove `.claude/spec-guard.local.md`
   - Report: "Cancelled spec grind (was at iteration N)"
