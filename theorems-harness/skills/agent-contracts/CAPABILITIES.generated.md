<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Agent contracts capability catalog

MCP, GraphQL, domain pagination, truncation, retries, idempotency, and receipts are interpreted by family rather than one invented envelope.

Plugin version: `0.9.2`. Source server version: `0.5.0`.
Source catalog SHA-256: `4953f49fcabb220c82489dc5ac8b488ce3566b1f7b9b4639a732358bab7b9a66`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source |
|---|---|---|---|---|---|
| `family-specific result contracts` | behavior | preserve protocol and domain layers | incomplete standardization | HCM-028 dependency | `references/AGENT_CONTRACTS_CAPABILITY.md` |
| `graphql_introspect` | flat_mcp | discover typed schema | stable | source-advertised; live-unverified | `tools/list:graphql_introspect` |
| `tool_result_fetch` | flat_mcp | process-local byte continuation | stable | source-advertised; live-unverified | `tools/list:tool_result_fetch` |

Behavioral contract: `references/AGENT_CONTRACTS_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
