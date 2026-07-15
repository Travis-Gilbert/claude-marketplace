<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Agent interoperability capability catalog

Composed turns and durable Head Calls are callable; A2A remains source-only and ACP is a server WebSocket.

Plugin version: `0.9.2`. Source server version: `0.5.0`.
Source catalog SHA-256: `4953f49fcabb220c82489dc5ac8b488ce3566b1f7b9b4639a732358bab7b9a66`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source |
|---|---|---|---|---|---|
| `composed_agent_run` | flat_mcp | one admitted composed turn | beta | source-advertised; provider-live-unverified | `tools/list:composed_agent_run` |
| `POST /v1/theorem/agent/run` | http | direct admitted agent route | beta | server-route; live-unverified | `openapi` |
| `WS /v1/commonplace/acp/ws` | http | ACP server session | beta | server-route; agent-binary-dependent | `ACP protocol` |
| `WS /v1/head-calls/ws` | http | Head Call switchboard | beta | server-route; live-unverified | `head-call protocol` |
| `A2A client/runtime` | rust | crate-level membrane | source-only | unmounted | `A2A crate` |

Behavioral contract: `references/AGENT_INTEROP_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
