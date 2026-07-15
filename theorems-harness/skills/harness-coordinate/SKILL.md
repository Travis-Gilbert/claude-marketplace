---
name: harness-coordinate
description: Teach and run Theorem's current cross-head coordination protocol. Use for shared intent, presence, messages, durable records, task-reference rooms, streams, mentions, semantic overlap, or handoff without inventing retired aliases.
---

# Harness Coordinate

Read `../../references/COORDINATION_OPERATIONS_CAPABILITY.md`. The heads are
several hands of one bound agent, but they still edit through isolated host
contexts. Coordination makes those fences visible; it does not create a shared
buffer or a file lock.

## One turn

1. Read `coordinationRoom` or flat `coordination_context` for orientation. Read
   current footprints with `read_intents_for_room` and targeted interrupts with
   `mentions`.
2. Write `coordination_intent` with `status: "working"`, a short summary, and
   the files/concepts in the footprint. Treat it as an announcement, not a
   claim of ownership.
3. Subscribe once with `stream_subscribe`. At checkpoints use `stream_read` for
   ordered deltas. Publish normal progress with `stream_publish`; use
   `coordinate` or an ask/block event only when another head's immediate action
   should change.
4. If two edits are semantically inconsistent, write `coordination_record`
   with `record_type: "tension"`. Build on completed peer work and preserve the
   disagreement rather than silently overwriting it.
5. Close the footprint with `status: "done"` or `status: "paused"`. Write
   durable handoff memory through `coordination_record` with
   `record_type: "reflection"`; record a load-bearing choice with
   `record_type: "decision"`.

## Delivery

Use `ack_policy: "on_read"` for ordinary cursor advancement. Use
`ack_policy: "explicit"` only when injection must be confirmed, then call
`stream_ack` with returned event ids or ordering tokens. A read-only connection
can peek but cannot advance or acknowledge. Piggybacked Head Call summaries do
not advance the cursor.

Coordination V2 task-reference room fields are GraphQL-only. Use `taskRef`,
`turnStartDiscovery`, `roomDigest`, `openPings`, `openContradictions`, and their
documented mutations when stable task identity and room aliases matter. Do not
guess aliases or invoke a flat `coordination_v2` tool.

There are no dedicated coordination-reflection/decision/tension tools, no
long-poll mentions tool, and no generic subscribe tool. The real calls are
`coordination_record`, `mentions`, and `stream_subscribe` / `stream_read`.

## Output

Report the room/task reference, actor, footprint state, interrupt urgency,
stream event/cursor or record id, and any refusal. Mention coordination in the
final result only when it changed the work.
