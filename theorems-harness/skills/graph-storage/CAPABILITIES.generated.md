<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Graph and storage capability catalog

Typed graph reads and gated mutations coexist with flat diagnostics and caller-carried version values; storage internals remain unprojected.

Plugin version: `0.9.3`. Source server version: `0.5.0`.
Source catalog SHA-256: `feb39dae1c91bf89c5050323c4922f9fbbc5092b6ac5f85fffa34396a173701b`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source | Canonical descriptor |
|---|---|---|---|---|---|---|
| `rustyred_thg_graph_query` | flat_mcp | flat-only bounded diagnostic | stable | source-advertised; live-unverified | `tools/list:rustyred_thg_graph_query` | — |
| `rustyred_thg_graph_version_checkout` | flat_mcp | reconstruct snapshot without live rollback | beta | source-advertised; live-unverified | `tools/list:rustyred_thg_graph_version_checkout` | — |
| `rustyred_thg_graph_version_compile` | flat_mcp | compile caller-carried snapshot | beta | source-advertised; live-unverified | `tools/list:rustyred_thg_graph_version_compile` | — |
| `rustyred_thg_index_spine` | flat_mcp | inspect index artifacts | beta | source-advertised; live-unverified | `tools/list:rustyred_thg_index_spine` | — |
| `rustyred_thg_relational_query` | flat_mcp | flat-only relational plan | stable | source-advertised; live-unverified | `tools/list:rustyred_thg_relational_query` | — |
| `Mutation.bulkNodes` | graphql | admin-gated partial bulk mutation | stable | source-advertised; admin-live-unverified | `graphql_introspect:Mutation.bulkNodes` | — |
| `Query.graphAlgorithm` | graphql | preferred typed algorithm | stable | source-advertised; live-unverified | `graphql_introspect:Query.graphAlgorithm` | — |
| `Query.vectorSearch` | graphql | preferred typed vector retrieval | stable | source-advertised; live-unverified | `graphql_introspect:Query.vectorSearch` | — |

Behavioral contract: `references/GRAPH_STORAGE_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
