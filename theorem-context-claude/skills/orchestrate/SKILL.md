---
name: orchestrate
description: Force a fresh Theorem Context compile for the current task. Use when the conversation has shifted and the artifact injected at the top of this turn no longer covers what's needed. The user can also invoke this directly with /orchestrate to refresh context before issuing a new task.
---

# Orchestrate (manual context refresh)

The Theorem Context plugin injects a fresh Context Artifact via the UserPromptSubmit hook at the start of every turn. That covers most cases. This skill exists for the cases where it doesn't:

- The user pivots mid-session ("now help me with the deploy script") and the artifact compiled for the previous prompt is stale.
- The user wants to widen the budget ("compile a deeper brief, 8000 tokens this time").
- The agent itself notices it's working with thin context and wants more.

## What to do

Call the `orchestrate_refresh` MCP tool with:

- `task`: a one-sentence description of what context is needed. Mirror the user's most recent request as closely as possible.
- `budget_tokens`: optional, default 4000. Use 8000 for review tasks, 12000 for cross-repo synthesis.

Example invocation:

```
orchestrate_refresh({
  "task": "review the auth middleware for missing rate limits and CSRF gaps",
  "budget_tokens": 8000
})
```

The response is the new Context Artifact body. Treat it as authoritative working knowledge: it supersedes whatever was in your context before this call.

## When NOT to use

- For trivial follow-ups ("can you also...") on the same task. The injected artifact is fine.
- When the user is asking you to recall something you already saw this turn. Memory, not retrieval.
- When the answer is in a file. Use Read first.
