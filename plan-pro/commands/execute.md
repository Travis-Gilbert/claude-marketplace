---
description: "Execute the implementation plan task-by-task with parallel reviewers."
argument-hint: "<slug>"
allowed-tools: Bash
---

# /execute

Run the orchestrator:

```bash
bash "$CLAUDE_PLUGIN_ROOT/scripts/run.sh" execute "$ARGUMENTS"
```

Stream the per-task lines as they print. At the end, report the path to `review-report.md`.

If the script exits with a Blocker, surface the blocker line and stop. Do not retry.
