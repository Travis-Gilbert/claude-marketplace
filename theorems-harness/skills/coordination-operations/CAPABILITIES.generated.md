<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Coordination and operations capability catalog

Rooms, records, streams, task-reference rooms, jobs, work graphs, spawning, and operations retain distinct state machines.

Plugin version: `0.9.2`. Source server version: `0.5.0`.
Source catalog SHA-256: `4953f49fcabb220c82489dc5ac8b488ce3566b1f7b9b4639a732358bab7b9a66`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source |
|---|---|---|---|---|---|
| `coordination_intent` | flat_mcp | footprint announcement | stable | source-advertised; live-unverified | `tools/list:coordination_intent` |
| `coordination_record` | flat_mcp | typed durable record | stable | source-advertised; live-unverified | `tools/list:coordination_record` |
| `job_submit` | flat_mcp | queue a durable job thread | beta | source-advertised; receiver-live-unverified | `tools/list:job_submit` |
| `spawn_session` | flat_mcp | GitHub repository dispatch handoff | beta | source-advertised; dispatch-live-unverified | `tools/list:spawn_session` |
| `stream_ack` | flat_mcp | explicit delivery acknowledgement | beta | source-advertised; live-unverified | `tools/list:stream_ack` |
| `stream_read` | flat_mcp | durable actor/topic delivery | beta | source-advertised; live-unverified | `tools/list:stream_read` |
| `Mutation.recordClaim` | graphql | GraphQL-only task-reference claim | beta | source-advertised; live-unverified | `graphql_introspect:Mutation.recordClaim` |
| `Query.turnStartDiscovery` | graphql | GraphQL-only task-reference discovery | beta | source-advertised; live-unverified | `graphql_introspect:Query.turnStartDiscovery` |
| `GET /ready` | http | store readiness observation | stable | server-route; live-unverified | `openapi:/ready` |
| `GET /version` | http | build and catalog identity | stable | server-route; live-unverified | `openapi:/version` |

Behavioral contract: `references/COORDINATION_OPERATIONS_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
