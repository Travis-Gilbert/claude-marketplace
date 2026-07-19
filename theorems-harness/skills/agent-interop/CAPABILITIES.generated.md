<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Agent interoperability capability catalog

Composed turns and durable Head Calls are callable; A2A remains source-only and ACP is a server WebSocket.

Plugin version: `0.10.0`. Source server version: `0.5.0`.
Source catalog SHA-256: `feb39dae1c91bf89c5050323c4922f9fbbc5092b6ac5f85fffa34396a173701b`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source | Canonical descriptor |
|---|---|---|---|---|---|---|
| `composed_agent_run` | flat_mcp | one admitted composed turn | beta | source-advertised; provider-live-unverified | `tools/list:composed_agent_run` | — |
| `POST /v1/theorem/agent/run` | http | direct admitted agent route | beta | server-route; live-unverified | `openapi` | — |
| `WS /v1/commonplace/acp/ws` | http | ACP server session | beta | server-route; agent-binary-dependent | `ACP protocol` | — |
| `WS /v1/head-calls/ws` | http | Head Call switchboard | beta | server-route; live-unverified | `head-call protocol` | — |
| `A2A client/runtime` | rust | crate-level membrane | source-only | unmounted | `A2A crate` | — |

Behavioral contract: `references/AGENT_INTEROP_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
