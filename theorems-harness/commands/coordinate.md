---
description: Coordinate with another agent through shared presence, @mentions, and the mention wait queue.
argument-hint: <message-or-coordination-task>
allowed-tools: Read, Grep, Glob, LS, Bash, Skill
---

Run the theorems-harness:harness-coordinate skill against the user's message.

1. Parse the user's argument as a coordination intent. If it is empty, ask who to coordinate with and what should be said or checked.
2. Invoke the `theorems-harness:harness-coordinate` skill with the full argument string.
3. Prefer the shared coordination tools in this order: `presence`, `subscribe`, `mentions`, `coordinate`, `mentions_wait`.
4. Report any received mentions and any message sent, including target actor and urgency.

Use `/harness` for full planning/execution. Use `/coordinate` only for cross-agent presence, messaging, and handoff behavior.
