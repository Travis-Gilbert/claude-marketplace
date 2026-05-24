---
description: Refresh the active Theorem Context artifact without running the full Harness workflow.
argument-hint: <task-or-context-need>
allowed-tools: Skill
---

Run the theorems-harness:context-refresh skill against the user's task.

1. Treat the user's argument as the context need. If empty, ask what task should be refreshed.
2. Invoke the `theorems-harness:context-refresh` skill with the full argument string.
3. Return the refreshed artifact summary and run id when available.

Use `/harness` when the user wants planning, execution, validation, or a report. Use `/context-refresh` only when the current context artifact is stale.
