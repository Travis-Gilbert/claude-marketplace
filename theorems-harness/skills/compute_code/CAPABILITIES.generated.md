<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Code intelligence capability catalog

Typed code ingest, discovery, compiler views, and revision evidence replace the obsolete code tool cluster.

Plugin version: `0.9.3`. Source server version: `0.5.0`.
Source catalog SHA-256: `feb39dae1c91bf89c5050323c4922f9fbbc5092b6ac5f85fffa34396a173701b`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source | Canonical descriptor |
|---|---|---|---|---|---|---|
| `code_ingest` | flat_mcp | flat ingest compatibility | stable | source-advertised; live-unverified | `tools/list:code_ingest` | — |
| `compute_code` | flat_mcp | consolidated flat compatibility | stable | source-advertised; live-unverified | `tools/list:compute_code` | — |
| `Mutation.ingestCodebase` | graphql | preferred typed ingest | stable | source-advertised; live-unverified | `graphql_introspect:Mutation.ingestCodebase` | — |
| `Query.codeContext` | graphql | preferred typed context | stable | source-advertised; live-unverified | `graphql_introspect:Query.codeContext` | — |
| `Query.codeObligations` | graphql | preferred typed compiler obligations | stable | source-advertised; live-unverified | `graphql_introspect:Query.codeObligations` | — |
| `Query.codeSearch` | graphql | preferred typed search | stable | source-advertised; live-unverified | `graphql_introspect:Query.codeSearch` | — |

Behavioral contract: `references/CODE_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
