---
name: context-refresh
description: Refresh the active Theorem Context artifact without running a full Production Theorem orchestration pass. Use when the conversation pivots and the current injected context is stale.
---

# Context Refresh

Use this skill for a narrow refresh of working context. It is intentionally not
the full `/orchestrate` workflow.

## When To Use

Use when:

- the user asks for `/context-refresh`
- the conversation pivots to a different repo, task, or subsystem
- the current injected context artifact is stale or too thin
- a review or cross-repo synthesis needs a larger context budget

Do not use this for planning, implementation, validation, coordination, or
learning. Those belong to `/orchestrate`, `/coordinate`, or `/encode`.

## Tool

Call `orchestrate_refresh` with:

```json
{
  "task": "one sentence describing the context needed",
  "budget_tokens": 4000
}
```

Use these budget defaults:

| Case | Budget |
|---|---|
| small pivot | 4000 |
| review | 8000 |
| cross-repo synthesis | 12000 |

The returned artifact supersedes the previous working context for the current
task. Mention the refresh only if it changes what you are about to do.
