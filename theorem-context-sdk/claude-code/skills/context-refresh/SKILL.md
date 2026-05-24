---
name: context-refresh
description: Force a fresh Theorem Context compile for the current task. Use when the conversation has shifted and the artifact injected at the top of this turn no longer covers what is needed. The user can also invoke this directly with /context-refresh to refresh context before issuing a new task.
---

# Context Refresh

The Theorem Context plugin injects a fresh Context Artifact via the
UserPromptSubmit hook at the start of every turn. That covers most cases. This
skill exists for the cases where it does not:

- The user pivots mid-session and the artifact compiled for the previous prompt
  is stale.
- The user wants to widen the budget.
- The agent notices it is working with thin context and needs a refreshed brief.

This is not the Production Theorem `/orchestrate` workflow. It is the legacy
SDK plugin's manual context-refresh fallback around the `orchestrate_refresh`
MCP tool.

## What To Do

Call the `orchestrate_refresh` MCP tool with:

- `task`: a one-sentence description of what context is needed. Mirror the
  user's most recent request as closely as possible.
- `budget_tokens`: optional, default 4000. Use 8000 for review tasks and 12000
  for cross-repo synthesis.

Example invocation:

```json
{
  "task": "review the auth middleware for missing rate limits and CSRF gaps",
  "budget_tokens": 8000
}
```

The response is the new Context Artifact body. Treat it as authoritative working
knowledge: it supersedes whatever was in your context before this call.

## When Not To Use

- For the main Production Theorem workflow. Use `production-theorem:orchestrate`
  or `/orchestrate` from the Production Theorem plugin.
- For trivial follow-ups on the same task. The injected artifact is fine.
- When the answer is in a file. Read the file first.
