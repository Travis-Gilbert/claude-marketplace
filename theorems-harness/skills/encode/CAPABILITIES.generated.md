<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Memory capability catalog

One admitted tenant/project memory graph supports typed recall, revision, archive, outcomes, handoffs, and actor-memory compatibility.

Plugin version: `0.9.2`. Source server version: `0.5.0`.
Source catalog SHA-256: `4953f49fcabb220c82489dc5ac8b488ce3566b1f7b9b4639a732358bab7b9a66`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source |
|---|---|---|---|---|---|
| `encode` | flat_mcp | outcome-bearing flat write | stable | source-advertised; live-unverified | `tools/list:encode` |
| `evidence_bundle` | flat_mcp | flat-only cited context packet | stable | source-advertised; live-unverified | `tools/list:evidence_bundle` |
| `recall` | flat_mcp | flat compatibility | stable | source-advertised; live-unverified | `tools/list:recall` |
| `Mutation.createHandoff` | graphql | preferred typed handoff | stable | source-advertised; live-unverified | `graphql_introspect:Mutation.createHandoff` |
| `Mutation.rememberMemory` | graphql | preferred typed remember/encode | stable | source-advertised; live-unverified | `graphql_introspect:Mutation.rememberMemory` |
| `Query.memory` | graphql | preferred typed recall | stable | source-advertised; live-unverified | `graphql_introspect:Query.memory` |

Behavioral contract: `references/MEMORY_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
