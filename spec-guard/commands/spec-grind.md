---
description: "Start autonomous spec implementation loop"
argument-hint: "PATH_TO_SPEC [--verify COMMAND] [--max-iterations N]"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/setup-grind.sh:*)"]
hide-from-slash-command-tool: "true"
---

# Spec Grind

Execute the setup script to start the grinding loop:

```!
"${CLAUDE_PLUGIN_ROOT}/scripts/setup-grind.sh" $ARGUMENTS
```

Implement every requirement in the spec. After each implementation pass,
run the verification command (if provided) and check results. The Stop
hook will prevent exit and re-inject the spec until all requirements
are met.

CRITICAL: Output <promise>SPEC_COMPLETE</promise> ONLY when every
requirement in the spec is implemented and verified. Do not output
a false promise to exit the loop.

Approach:
1. Read the full spec
2. List all requirements not yet implemented
3. Implement the next requirement
4. Run the verification command
5. If anything fails, fix it
6. Repeat until all requirements pass
7. Output <promise>SPEC_COMPLETE</promise>
