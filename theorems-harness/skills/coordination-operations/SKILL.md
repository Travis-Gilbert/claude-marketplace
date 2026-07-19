---
name: coordination-operations
description: "Use for Harness coordination rooms, durable streams, dispatch jobs, multi-head work graphs, session spawning, service readiness, or active-catalog questions, with exact state, cursor, tenant, and execution-proof boundaries."
---

# Coordination and operations

Generated surface map: [capability catalog](./CAPABILITIES.generated.md).

Read `../../references/COORDINATION_OPERATIONS_CAPABILITY.md` before selecting
a coordination, job, work-graph, spawn, or service-status surface.

## Route

1. Prefer typed GraphQL room, stream, work-graph, and job fields when present.
   Use flat names only for compatibility or flat-only behavior.
2. Announce overlap with `coordination_intent`. Write durable decisions,
   tensions, reflections, and events through `coordination_record` plus its
   real `record_type`; there are no dedicated tools for those record kinds.
3. Use `stream_subscribe`, `stream_publish`, `stream_read`, and `stream_ack`
   for ordered durable delivery. Keep actor/topic cursors and explicit pending
   delivery separate from list pagination.
4. Treat `job_submit` as queueing. Inspect idempotent reuse and any dispatch
   mirror status; a receiver start receipt or later run evidence is required to
   claim execution.
5. Treat `spawn_session` as a GitHub Actions repository-dispatch handoff, not a
   local launcher. Preserve its policy, coordination, dispatch, and run ids.
6. Use `/health`, `/ready`, and `/version` only for their exact operational
   claims. Validate the callable catalog with `tools/list` and
   `graphql_introspect`.

In read-only mode, room status, presence get, non-advancing stream reads, and
other pure reads remain available while writes/cursor advancement refuse.
Never invent `mentions_wait`, `subscribe`, `spawn_handoff_session`, job cancel,
or a monolithic operations/capability-status tool.
