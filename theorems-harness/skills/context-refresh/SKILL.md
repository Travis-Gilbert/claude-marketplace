---
name: context-refresh
description: The Harness context-compile capability. Use when the active Context Artifact is stale, missing, or too narrow for the next slice. Reachable as /context-refresh or as part of the /harness adaptive loop when source code contradicts the injected brief.
---

# Context Refresh

Context Refresh recompiles the active Context Artifact without running a full
Harness loop. It is the narrow refresh path. The full loop owns planning,
execution, validation, and reporting; this skill only updates what the agent
knows about the task.

Use `/show-context` first if you want to see the current artifact before
refreshing.

## When To Refresh

Use this capability when:

- the conversation pivots to a different repo, task, or subsystem
- the current injected context is stale or too thin for what's next
- a review or cross-repo synthesis needs a larger context budget
- source code directly contradicts the injected brief
- a `UserPromptSubmit` hook fired with a sparse artifact and the next slice
  needs more

Do not use this for planning, implementation, validation, coordination, or
learning. Those belong to `/harness`, `/coordinate`, or `/encode`.

## Tool

Call `orchestrate_refresh` (the canonical MCP verb; the public command name
is `/context-refresh`):

```json
{
  "task": "one sentence describing the context needed",
  "budget_tokens": 4000
}
```

Default budgets:

| Case | Budget |
|---|---|
| small pivot | 4000 |
| review | 8000 |
| cross-repo synthesis | 12000 |
| launch-week reconciliation | 16000 |

The returned artifact supersedes the previous working context for the current
task. Mention the refresh in user-facing output only if it changes what
you're about to do.

## Anti-Patterns

- Refreshing when the existing artifact would have been enough.
- Refreshing instead of reading the actual source file when one read is
  cheaper than a recompile.
- Treating the refreshed artifact as authoritative when it disagrees with
  the live source. Source code wins; surface the disagreement.
