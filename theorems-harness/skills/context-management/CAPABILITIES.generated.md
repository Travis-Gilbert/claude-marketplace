<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Context management capability catalog

Context leases, generations, preparation, and explicit invalidation expose an admitted-session boundary.

Plugin version: `0.9.2`. Source server version: `0.5.0`.
Source catalog SHA-256: `4953f49fcabb220c82489dc5ac8b488ce3566b1f7b9b4639a732358bab7b9a66`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source |
|---|---|---|---|---|---|
| `context_invalidate` | flat_mcp | explicit epoch advance | stable | source-advertised; live-unverified | `tools/list:context_invalidate` |
| `context_status` | flat_mcp | flat diagnostic | stable | source-advertised; live-unverified | `tools/list:context_status` |
| `harness_prepare` | flat_mcp | prepare or reuse context | stable | source-advertised; live-unverified | `tools/list:harness_prepare` |
| `Mutation.invalidateContext` | graphql | preferred typed epoch advance | stable | source-advertised; live-unverified | `graphql_introspect:Mutation.invalidateContext` |
| `Mutation.refreshContext` | graphql | preferred typed compilation | stable | source-advertised; live-unverified | `graphql_introspect:Mutation.refreshContext` |
| `Query.contextExplain` | graphql | preferred typed explanation | stable | source-advertised; live-unverified | `graphql_introspect:Query.contextExplain` |

Behavioral contract: `references/CONTEXT_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
