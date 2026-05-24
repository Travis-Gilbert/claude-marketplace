---
description: Record a feedback signal, durable solution, or postmortem in the shared harness memory substrate.
argument-hint: <good|bad|solution|postmortem note>
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash, Skill
---

Run the theorems-harness:encode skill against the user's note.

1. Parse the user's argument as a memory encoding request. If it is empty, ask what feedback, solution, or postmortem should be encoded.
2. Invoke the `theorems-harness:encode` skill via the Skill tool, passing the user's full argument as input.
3. The skill should prefer the `encode` MCP tool when available. If unavailable, it should fall back to `self_note` plus `theorem_memory_signal` or equivalent memory-fitness tooling.
4. Return the saved document id, outcome, signal, and whether it was agent-triggered or user-triggered.

Agents may also invoke `theorems-harness:encode` without an explicit slash command when a session produces a durable lesson, a notable success/failure, or a postmortem-worthy incident.
