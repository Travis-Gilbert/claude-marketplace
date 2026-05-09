---
name: show-context
description: Show the Context Artifact currently injected for this session. Use when the user asks "what context do you actually have," "what did the orchestrator give you," or wants to verify the brief before issuing a task. Calls harness_describe_current MCP tool.
---

# Show Current Context

Surface what the UserPromptSubmit hook injected on this turn. Useful for:

- Trust verification ("show me the brief before I send you off")
- Debugging stale-context behavior ("you don't seem to know about the auth changes")
- Drafting follow-ups based on what the agent already saw

## What to do

1. Call `harness_describe_current`.
2. If the response contains a Context Artifact, render it readably: task it was compiled for, token ledger summary (capsule + atoms), source atoms grouped by kind (claim, snippet, doc, web), and any Action Rail rules in effect.
3. If no artifact has been injected yet (early in the session), say so plainly: "The UserPromptSubmit hook hasn't fired yet for this session. The next prompt will produce an artifact."

## When NOT to use

- The user asked what they themselves wrote earlier. That's transcript history, not artifact.
- The user wants the live graph state. Use the fat Theseus MCP (Mode 3) instead.
