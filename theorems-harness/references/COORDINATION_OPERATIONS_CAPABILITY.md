# Coordination, Jobs, and Operations Capability

Coordination, dispatch jobs, multi-head work graphs, session spawning, and
service operations share a tenant substrate, but they are not one task API.
Choose the narrow surface whose state machine matches the work.

## Coordination rooms and records

Prefer typed GraphQL when the server exposes it:

- `coordinationRoom` reads one room packet: room, presence, intents, messages,
  records, pending mentions, and counts;
- `writeCoordinationIntent` writes the current actor's footprint;
- `writeCoordinationRecord` writes an `event`, `decision`, `tension`, or
  `reflection` record;
- `publishCoordinationEvent`, `coordinationStream`,
  `advanceCoordinationStream`, and `ackCoordinationStream` operate durable
  streams;
- `workGraph`, `nextTaskNode`, `createTaskNode`, and `claimTaskNode` expose the
  native multi-head task graph.

Flat compatibility and flat-only operations include `coordination_room`,
`presence`, `coordination_intent`, `read_intents_for_room`, `coordinate`,
`mentions`, `coordination_record`, `read_messages_for_room`,
`read_records_for_room`, and `coordination_context`.

There are no dedicated `coordination_reflection`, `coordination_decision`, or
`coordination_tension` tools. Write those semantics through
`coordination_record` with the corresponding `record_type`. There is no
`mentions_wait` tool. Read `mentions` or the durable stream at a bounded
checkpoint instead.

`coordination_intent` is a footprint, not a file lock. Close it with
`status: "done"` or `status: "paused"`. Authenticated admission owns tenant and
actor identity; do not treat caller-provided labels as stronger evidence.

## Task-reference rooms

Coordination V2 is GraphQL-only. Its query fields are `taskRef`,
`turnStartDiscovery`, `roomDigest`, `openPings`, `openContradictions`, and
`relatedEvents`. Its mutations are `registerTaskRef`, `routeMessageToTask`,
`createPing`, `consumePing`, and `recordClaim`.

The instance scope is connection-bound. Task metadata resolves a stable
`task_ref_id`, canonical room, and aliases; do not guess a room alias or invent
a flat `coordination_v2` tool. A recorded conflicting claim can create a
`CONTRADICTS` edge and a room-visible contradiction; it is not automatically a
proof that either side is false.

## Durable streams

Use `stream_subscribe` and `stream_unsubscribe` to manage an actor's topics,
`stream_publish` to append, `stream_read` to receive ordered deltas, and
`stream_ack` for explicit delivery. The stream key is tenant plus topic and
events receive monotonic `ordering_token` values.

- `ack_policy: "on_read"` advances the actor/topic cursor when `advance` is
  true. A read-only server can read but suppresses advancement.
- `ack_policy: "explicit"` requires a write-capable read, tracks pending
  deliveries, redelivers after the requested window, and dead-letters after the
  maximum attempts. Acknowledge returned event ids or ordering tokens.
- `coordinationStream` is a non-advancing GraphQL query;
  `advanceCoordinationStream` is the mutating read.
- An `ask` or `block` publish with `target_actor` also uses the mention/wake
  bridge. A subscription is not required for that ping.

Do not confuse stream cursors with list pagination. `new_cursors` is durable
per actor/topic delivery state. Head Call injection adds a stricter typed ack
stage described in `AGENT_INTEROP_CAPABILITY.md`.

## Dispatch jobs

Prefer GraphQL `jobList`, `jobSubmit`, `jobNote`, and `jobArchive`; the flat
compatibility names are `job_list`, `job_submit`, `job_note`, and
`job_archive`.

A job is a durable thread whose state is derived, not a general workflow:

- `pending`: no `started_at` or `archived_at`;
- `started`: `started_at` exists and `archived_at` does not;
- `archived`: `archived_at` exists.

`job_submit` requires `title`, `repo`, and exactly one useful spec source
(`spec_ref` or `spec_inline`). It creates or upserts by job id or
`idempotency_key`; a duplicate may update only allowed scheduling/spec fields.
Submission does not prove execution. A receiver uses `job_note` with
`start_session_ref` for the set-once launch write. Ordinary notes append
receipts; `job_archive` preserves the thread and records a reason.

The THG job node is canonical coordination state. A configured server may
mirror it to the Postgres hot dispatch queue, but mirror failure is non-fatal
and is reported through `dispatch_mirrored` / `dispatch_mirror_error`. The
Postgres lease, retry, reaper, and worker APIs are not MCP or GraphQL tools.
There is no job cancel or retry verb; archive and append an explanatory receipt
rather than inventing one.

## Work graphs and spawning

The GraphQL work-graph fields above coexist with flat `multihead_run`,
`multihead_next`, `multihead_task`, `multihead_claim`, `multihead_patch`,
`multihead_proof`, and `multihead_review`. These operate task nodes and leases;
they are not Dispatch jobs or durable Plans.

Flat `spawn_session` is callable when write mode and its policy gate allow it.
It first writes a room-visible coordination record and Harness run, then fires
the configured GitHub Actions `repository_dispatch` handoff. It is not a local
CLI launcher, and there is no `spawn_handoff_session` tool. A returned
`status: "running"` proves dispatch acceptance, not that the remote workflow or
agent completed; preserve `dispatch_id`, `run_id`, policy receipt, and any
`dispatch_error`.

## Service operations

These are server HTTP routes, not MCP tools:

- `GET /health` is unauthenticated process liveness only;
- `GET /ready` checks the configured store and every configured startup-prewarm
  tenant. It returns `503` with `store_not_ready` while recovery or storage is
  unavailable and does not recover a tenant as a side effect;
- `GET /version` reports build/deployment identity plus the active MCP
  `tool_count`, `tool_catalog_hash`, tool names, read-only/admin mode, and
  GraphQL-default mode;
- `GET /openapi.json`, `GET /.well-known/mcp/rustyred_thg.json`, and
  `GET /.well-known/agent.json` expose HTTP/MCP discovery. The last route is not
  an A2A Agent Card.

MCP `initialize`, `tools/list`, and `graphql_introspect` remain the callable
schema truth for the active connection. `/version` catalog identity does not
prove provider credentials, receiver residency, per-tenant data correctness,
or successful task execution. There is no monolithic `operations_status` or
`capability_status` agent tool.

## Honest gaps

HCM-026 remains open for complete delivery/cursor/redelivery/dead-letter
acceptance, room-alias and catalog status, agent/admin separation, and live
receiver/coordination proof. The plugin must report those dependencies rather
than promoting local contract tests into production evidence.
