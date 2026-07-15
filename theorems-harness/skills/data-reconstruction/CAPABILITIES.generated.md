<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Data and reconstruction capability catalog

Data, instant KG, resolution, DATAWAVE, and staged reconstruction preserve provenance and unresolved obligations.

Plugin version: `0.9.2`. Source server version: `0.5.0`.
Source catalog SHA-256: `4953f49fcabb220c82489dc5ac8b488ce3566b1f7b9b4639a732358bab7b9a66`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source |
|---|---|---|---|---|---|
| `datawave_ingest` | flat_mcp | flat-only DATAWAVE ingestion | beta | source-advertised; live-unverified | `tools/list:datawave_ingest` |
| `query_data` | flat_mcp | flat Data compatibility | stable | source-advertised; live-unverified | `tools/list:query_data` |
| `reconstruct_binary` | flat_mcp | flat-only binary reconstruction | beta | source-advertised; live-unverified | `tools/list:reconstruct_binary` |
| `resolve_ingest` | flat_mcp | flat-only entity resolution | stable | source-advertised; live-unverified | `tools/list:resolve_ingest` |
| `Mutation.reverseEngineerCompose` | graphql | typed staged reconstruction | beta | source-advertised; live-unverified | `graphql_introspect:Mutation.reverseEngineerCompose` |
| `Query.dataQuery` | graphql | preferred typed Data query | stable | source-advertised; live-unverified | `graphql_introspect:Query.dataQuery` |
| `Query.harnessKgSearch` | graphql | preferred typed instant-KG search | stable | source-advertised; live-unverified | `graphql_introspect:Query.harnessKgSearch` |

Behavioral contract: `references/DATA_RECONSTRUCTION_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
