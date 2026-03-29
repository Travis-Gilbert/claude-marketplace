---
description: "Set the active spec for this session. All edits will be checked against it."
argument-hint: "PATH_TO_SPEC [--protected file1,file2,...]"
allowed-tools: ["Bash(${CLAUDE_PLUGIN_ROOT}/scripts/setup-spec-guard.sh:*)"]
---

# Spec Guard

Execute the setup script to activate spec enforcement:

```!
"${CLAUDE_PLUGIN_ROOT}/scripts/setup-spec-guard.sh" $ARGUMENTS
```

After activation, every Edit/Write/MultiEdit will be checked against
the spec before it can proceed. Deviations will be flagged or blocked.

To deactivate: delete `.claude/spec-guard.local.md`
