---
description: "Coordinate with another head over the shared substrate: read the room, announce your own work and semantic overlap, and use @mentions only for blocks and forks."
argument-hint: <message-or-coordination-task>
allowed-tools: Read, Grep, Glob, LS, Bash, Skill
---

Run the theorems-harness:harness-coordinate skill against the user's message.

1. Parse the user's argument as a coordination intent. If it is empty, ask who to coordinate with and what should be said or checked.
2. Invoke the `theorems-harness:harness-coordinate` skill with the full argument string.
3. Lead with the substrate, not the message bus. Prefer the tools in this order:
   - read first: `read_intents_for_room` (what others are doing and which files or concepts they have their hands on), then `mentions` (consume) to drain block/ask interrupts, before planning edits.
   - announce: `write_intent` / `coordination_intent` (what you are doing, which files or concepts you are touching, and any semantic overlap), before you act.
   - record as you go, only when real: `write_event` (an action that landed), `write_decision` (an architectural choice the next turn should inherit), `write_tension` / `resolve_tension` (a structural fork you are working around; not a permission ask).
   - membership and liveness: `coordination_room` (status / join / start), `presence`, `subscribe`.
   - interrupt channel: `coordinate`, only to broadcast a block ("stop, X is broken") or a fork a specific head must see now; add an `@actor`.
   - wait: `mentions_wait`, only when you cannot proceed without the answer (`timeout_seconds` <= 30).
4. At turn-end, close your intent (`write_intent` with `status: done` or `paused`) and write a `coordination_reflection` (`write_reflection`) so the next turn of either head resumes cleanly.
5. Report any received mentions and any message sent, including target actor and urgency.

Use `/harness` for full planning/execution. Use `/coordinate` only for cross-head intent, messaging, and handoff. The default is to read and announce on the substrate; a mention is the exception, for blocks and forks.
