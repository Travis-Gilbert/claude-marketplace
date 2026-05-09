---
name: replay-last-run
description: Show the event timeline of the current Theorem harness run. Use when the user asks "what did you actually do," "show me the run trace," or wants to audit/debug what tools fired in what order. Calls harness_replay MCP tool and formats the result.
---

# Replay Last Run

The Theorem Context plugin records every tool use, search, and context injection into a harness run with state hashes for determinism. This skill surfaces that timeline.

## What to do

1. Call `harness_replay` with no args (defaults to the current session's run id).
2. Format the returned event list for the user. Group by event kind (tool_use, search, context_injected, outcome) and show timestamps.
3. If the user asked a specific question (e.g., "what files did you edit?"), filter to the relevant events rather than dumping the whole log.

## Output shape

The MCP tool returns:

```json
{
  "run_id": "run_...",
  "state_hash": "sha256:...",
  "events": [
    { "kind": "tool_use", "tool": "Edit", "input": {...}, "timestamp": "..." },
    { "kind": "search", "query": "...", "results": [...] },
    { "kind": "context_injected", "artifact_id": "..." },
    ...
  ]
}
```

State hash is the deterministic-replay key. Mention it if the user might want to compare runs or replay against a different model.

## When NOT to use

- The user wants the conversation transcript. They have that already.
- The user wants the file diff. Use git instead.
- No run_id is available (SessionStart hook didn't fire). Tell the user the harness isn't bound and ask them to restart the session.
