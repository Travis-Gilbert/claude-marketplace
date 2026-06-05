---
name: replay-last-run
description: Show the event timeline of the current Theorem's Harness run. Use when the user asks "what did you actually do," "show me the run trace," "walk me through the run," "audit what happened," "what tools fired and in what order," or otherwise wants to inspect, audit, or debug an in-progress or just-finished harness run. Wraps the `harness_replay` MCP tool with formatting and filtering.
---

# Replay Last Run

Theorem's Harness records every tool call, search, observation, decision, and
context injection into a harness run with a deterministic state hash. This
skill surfaces that timeline in human-readable form. It is the audit lens for
"what actually happened, in what order, with which evidence."

## When to use

- User asks "what did you actually do" or "show me the run trace."
- User wants to verify a claim ("did you actually search the codebase?").
- User wants to debug a result ("which tool fired right before that bad edit?").
- User wants to compare two runs (mention the state hash so they can pair it
  with `harness_compare`).
- User wants to fork from a specific step (surface the step ids so they can
  pass one to `harness_fork`).

Do not use this for: the conversation transcript (they have that already),
the file diff (use `git diff`), or live graph state (use the Theorem-side
RustyRed MCP).

## What to do

1. Call `harness_replay`. With no `run_id` arg, the current session's run is
   used. With an explicit `run_id`, replay that specific run.
2. Format the returned event list for the user. Group by event kind
   (`tool_call`, `observation`, `decision`, `search`, `context_injected`,
   `outcome`) and show timestamps and step ids.
3. If the user asked a focused question, filter to the relevant events instead
   of dumping the entire log. Examples:
   - "what files did you edit?" → show `tool_call` events with `tool=Edit|Write`
     and the touched paths
   - "which decisions were forks from the plan?" → show `decision` events with
     payloads referencing `deviation_from_handoff` or `decided` keys
   - "where did this run lose ~5 minutes?" → show consecutive timestamps with
     large gaps

## Output shape

The MCP tool returns:

```json
{
  "run_id": "run:...",
  "state_hash": "sha256:...",
  "events": [
    { "step_id": "step:...", "kind": "tool_call",   "payload": {...}, "created_at": "..." },
    { "step_id": "step:...", "kind": "observation", "payload": {...}, "created_at": "..." },
    { "step_id": "step:...", "kind": "decision",    "payload": {...}, "created_at": "..." },
    ...
  ]
}
```

Mention the `state_hash` if the user might want to compare runs or replay
against a different model: it is the deterministic-replay key.

## When NOT to use

- The user wants the conversation transcript. That's already visible to them.
- The user wants the file diff. Use `git diff` or `git log -p`.
- No `run_id` is available (`harness_begin` was never called this session).
  Tell the user the harness isn't bound to a run and offer to start one with
  `/harness` or `harness_begin`.

## Related tools

- `harness_compare`: diff two runs (state hashes, evidence overlap,
  divergence point). Reach for this when the user wants to know how two
  attempts differed.
- `harness_fork`: branch a new run through a specific step id from this
  timeline. Reach for this when the user wants to explore an alternative path.
- `harness_context`: compile the final Context Artifact for a run, rather
  than the raw event timeline.
