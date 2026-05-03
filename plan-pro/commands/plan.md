---
description: "Produce a complete implementation plan from a topic. Single SDK-driven call; codebase-grounded; outputs to docs/plans/<slug>/implementation-plan.md."
argument-hint: "<topic>"
allowed-tools: Bash
---

# /plan

Run the orchestrator:

```bash
bash "$CLAUDE_PLUGIN_ROOT/scripts/run.sh" plan "$ARGUMENTS"
```

Wait for the script to finish. Report only the final paths it prints. Do not summarize the plan body; the user will read the markdown file.

If the script exits non-zero (validation failure or missing config), report the stderr message and stop.
