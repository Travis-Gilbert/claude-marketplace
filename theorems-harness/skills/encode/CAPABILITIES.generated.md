<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Memory capability catalog

One admitted tenant/project memory graph supports typed recall, revision, archive, outcomes, handoffs, and actor-memory compatibility.

Plugin version: `0.10.0`. Source server version: `0.5.0`.
Source catalog SHA-256: `feb39dae1c91bf89c5050323c4922f9fbbc5092b6ac5f85fffa34396a173701b`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source | Canonical descriptor |
|---|---|---|---|---|---|---|
| `encode` | flat_mcp | outcome-bearing flat write | stable | source-advertised; live-unverified | `tools/list:encode` | — |
| `evidence_bundle` | flat_mcp | flat-only cited context packet | stable | source-advertised; live-unverified | `tools/list:evidence_bundle` | — |
| `recall` | flat_mcp | flat compatibility | stable | source-advertised; live-unverified | `tools/list:recall` | — |
| `Mutation.createHandoff` | graphql | preferred typed handoff | stable | source-advertised; live-unverified | `graphql_introspect:Mutation.createHandoff` | — |
| `Mutation.rememberMemory` | graphql | preferred typed remember/encode | stable | source-advertised; live-unverified | `graphql_introspect:Mutation.rememberMemory` | — |
| `Query.memory` | graphql | preferred typed recall | stable | source-advertised; live-unverified | `graphql_introspect:Query.memory` | — |

Behavioral contract: `references/MEMORY_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
