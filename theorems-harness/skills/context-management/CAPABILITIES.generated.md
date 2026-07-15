<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Context management capability catalog

Context leases, generations, preparation, and explicit invalidation expose an admitted-session boundary.

Plugin version: `0.9.3`. Source server version: `0.5.0`.
Source catalog SHA-256: `feb39dae1c91bf89c5050323c4922f9fbbc5092b6ac5f85fffa34396a173701b`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source | Canonical descriptor |
|---|---|---|---|---|---|---|
| `context_invalidate` | flat_mcp | explicit epoch advance | stable | source-advertised; live-unverified | `tools/list:context_invalidate` | — |
| `context_status` | flat_mcp | flat diagnostic | stable | source-advertised; live-unverified | `tools/list:context_status` | — |
| `harness_prepare` | flat_mcp | prepare or reuse context | stable | source-advertised; live-unverified | `tools/list:harness_prepare` | — |
| `Mutation.invalidateContext` | graphql | preferred typed epoch advance | stable | source-advertised; live-unverified | `graphql_introspect:Mutation.invalidateContext` | — |
| `Mutation.refreshContext` | graphql | preferred typed compilation | stable | source-advertised; live-unverified | `graphql_introspect:Mutation.refreshContext` | — |
| `Query.contextExplain` | graphql | preferred typed explanation | stable | source-advertised; live-unverified | `graphql_introspect:Query.contextExplain` | — |

Behavioral contract: `references/CONTEXT_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
