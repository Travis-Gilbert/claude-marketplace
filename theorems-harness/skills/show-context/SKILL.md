---
name: show-context
description: Show the Context Artifact currently injected for this session. Use when the user asks "what context do you actually have," "what did the harness give you," "what brief are you working from," "verify the brief before I send you off," or otherwise wants to inspect the active context artifact before issuing a task. Wraps the `harness_describe_current` MCP tool.
---

# Show Current Context

Surface what the `UserPromptSubmit` hook injected on this turn (or whatever
Context Artifact is currently active for the run). This is the trust lens for
"do you actually know what I'm asking about, before I send you off?"

## When to use

- Trust verification: "show me the brief before I send you off."
- Debugging stale-context behavior: "you don't seem to know about the auth
  changes I just made."
- Drafting follow-ups: the user wants to know what's already in the agent's
  working set so they don't re-paste material the harness already injected.
- Pre-execution audit: just before running `/harness mode=execute`, confirm
  the compiled context is the right one.

## What to do

1. Call `harness_describe_current`.
2. If the response contains a Context Artifact, render it readably:
   - **Task** it was compiled for (one line).
   - **Token ledger** summary: capsule + atoms + remaining budget.
   - **Source atoms** grouped by kind: `claim`, `snippet`, `doc`, `web`,
     `code`, `memory`. Show counts per kind plus 1-2 representative items.
   - **Action Rail rules** currently in effect (if any).
   - **Provenance** pointers (which run, which prepare-context call).
3. If no artifact has been injected yet, say so plainly: "The
   UserPromptSubmit hook hasn't fired yet for this session. The next prompt
   will produce an artifact via prepare-context.sh."
4. If the artifact looks thin or off-target, suggest `/context-refresh` so
   the user can recompile against a sharper task description.

## When NOT to use

- The user asked what they themselves wrote earlier. That's transcript
  history, not artifact content.
- The user wants the live knowledge graph state. Use the Theorem-side RustyRed
  MCP (`mcp__rustyred-thg__*` tools) instead.
- The user wants the prior-run timeline. Use the `replay-last-run` skill or
  call `harness_replay` directly.

## Related tools

- `/context-refresh`: recompile the artifact for a new or revised task
  without running the full `/harness` workflow.
- `harness_context`: compile a Context Artifact from a specific run with
  explicit task and budget arguments (programmatic equivalent of
  `prepare-context.sh`).
- `replay-last-run`: see the event timeline that produced this artifact.
