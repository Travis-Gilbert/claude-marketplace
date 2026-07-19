---
description: Coordinate with another head over the shared substrate: read the room, announce your own work and semantic overlap, and use @mentions only for blocks and forks.
argument-hint: <message-or-coordination-task>
allowed-tools: Read, Grep, Glob, LS, Bash, Skill
---

Run the theorems-harness:harness-coordinate skill against the user's message.

1. Parse the user's argument as a coordination intent. If it is empty, ask who to coordinate with and what should be said or checked.
2. Invoke the `theorems-harness:harness-coordinate` skill with the full argument string.
3. Lead with the substrate, not the message bus. Prefer the tools in this order:
   - read first: `stream_read` for the cursor delta on your subscribed room streams (or `read_intents_for_room` when not yet subscribed), then `mentions` (consume) to drain block/ask interrupts, before planning edits.
   - announce: `coordination_intent` (status, summary, and `footprint` — the files or concepts your hands are on, plus any semantic overlap), before you act.
   - record as you go, only when real: `coordination_record` with `record_type: "event"` (an action that landed), `"decision"` (an architectural choice the next turn should inherit), or `"tension"` (a structural fork you are working around; not a permission ask — update the same `record_id` when it resolves).
   - membership and liveness: `coordination_room` (status / join / start), `presence`, `stream_subscribe` (once per room).
   - interrupt channel: `coordinate`, only to broadcast a block ("stop, X is broken") or a fork a specific head must see now; add an `@actor`. `stream_publish` with `urgency: "ask"` or `"block"` and a `target_actor` rides the same mention-and-wake path.
   - waiting: there is no long-poll tool. Send the ask, keep working the non-blocked slice, and drain `mentions`/`stream_read` at your next checkpoint.
4. At turn-end, close your intent (`coordination_intent` with `status: "done"` or `"paused"`) and write a reflection record (`coordination_record`, `record_type: "reflection"`) so the next turn of either head resumes cleanly.
5. Report any received mentions and any message sent, including target actor and urgency.

Use `/harness` for full planning/execution. Use `/coordinate` only for cross-head intent, messaging, and handoff. The default is to read and announce on the substrate; a mention is the exception, for blocks and forks.
