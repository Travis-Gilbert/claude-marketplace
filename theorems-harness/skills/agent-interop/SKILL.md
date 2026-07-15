---
name: agent-interop
description: "Use when invoking the composed agent, sending durable Head Calls, or reasoning about A2A and ACP boundaries, with strict identity, tenant, budget, receipt, approval, and live-provider evidence discipline."
---

# Agent interoperability

Generated surface map: [capability catalog](./CAPABILITIES.generated.md).

Read `../../references/AGENT_INTEROP_CAPABILITY.md` before selecting a
transport.

## Route

1. Use flat `composed_agent_run` for one admitted composed-agent turn. Confirm
   write scope, ambient tenant, materialized principal binding, head roster,
   budget, `alignment_verdict`, and every `invocation_receipt`. There is no
   GraphQL or dynamic projection.
2. Use `stream_publish` with `kind: "head_call"` for durable head-to-head
   messages. Preserve `call_id`, actors, room, refs, deadline, and correlation.
   Read through `stream_read`; for durable delivery use explicit ack and call
   `stream_ack` only after injection.
3. Use `/v1/head-calls/ws?stream=...` when the server gateway is available and
   typed validation/live delivery is needed. Only an `injected` ack advances
   the cursor; piggybacked `unread_head_calls` do not.
4. Treat outbound/inbound A2A as Rust-only until a real server projection is
   mounted. Do not invoke an A2A affordance through the generic gateway.
5. Use `/v1/commonplace/acp/ws` only as its `run:write` server WebSocket
   protocol. Preserve session/agent identity and explicit file, command, and
   permission approvals.

Do not infer a live provider from configuration. A real `composed_agent_run`
must return provider/model/transport invocation receipts without a fake
payload. A mounted ACP route still depends on a present server-local agent
binary and workspace. A registered A2A card in a Rust test is not a deployed
A2A endpoint.

There is no monolithic agent invoke tool, general head registry API, or shared
submit/cancel/retry/resume/result contract. `agent_identity_activate` is an
admin-only versioned AgentModel head activation, not registration. Report these
gaps rather than inventing `head_invoke`, `a2a_send`, `acp_run`, or live parity.
