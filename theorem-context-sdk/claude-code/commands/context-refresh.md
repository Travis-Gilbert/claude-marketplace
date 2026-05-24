---
description: Refresh the injected Theorem Context artifact for the current Claude Code task.
argument-hint: <task-or-context-need>
allowed-tools: Skill
---

Run the theorem-context-claude `context-refresh` skill against the user's task.

1. Treat the user's argument as the current context need. If empty, ask what task should be refreshed.
2. Invoke the `context-refresh` skill. The skill calls the `orchestrate_refresh` MCP tool.
3. Return the refreshed artifact summary and run id from the tool response.

This command replaces the legacy SDK-plugin `/orchestrate` refresh alias. The real `/orchestrate` workflow belongs to the `production-theorem` plugin.
