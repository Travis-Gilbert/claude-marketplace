# Agents, Head Calls, A2A, and ACP Capability

The current interoperability family has four different boundaries: a flat
composed-agent turn, durable Head Calls with an optional WebSocket accelerator,
Rust-only outbound/inbound A2A membranes, and a server ACP WebSocket. They are
not one universal agent tool.

## Composed agent

`composed_agent_run` is a flat write tool with no GraphQL or dynamic
projection. The server also exposes the same operation at
`POST /v1/theorem/agent/run`.

Input is a required `task`, optional `claims` carrying `text` and `provenance`,
and an optional binding id. On authenticated MCP/HTTP requests:

- the ambient tenant is authoritative;
- `graph:write` or `admin:write` is required;
- a non-admin caller's admitted binding claim overwrites a supplied binding id;
- that materialized principal binding must already be valid; authenticated
  calls cannot create it implicitly;
- read-only MCP mode refuses the operation.

The run uses the binding head registry, scratchpad, policy/alignment gate, and
budget. The default composed-agent budget is 5,000 units and may be changed by
`THEOREM_COMPOSED_AGENT_BUDGET_UNITS`; the binding's own budget and parallel
head policy still apply. Read `alignment_verdict` before using
`published_claims`. Inspect every `invocation_receipt` for head id, role,
provider/model/transport payload, cost units, claims, and receipt hash.

Non-test MCP execution defaults to the real provider invoker. It still requires
`THEOREM_AGENT_HEADS` and matching credentials or a configured local/hosted
endpoint. Tests default to `FakeHeadInvoker`, and an explicit
`THEOREM_HEAD_INVOKER=fake` result contains fake payloads. Configuration alone
is not live provider proof; claim live execution only from returned provider
receipts and the observed provider response.

`composed_agent_run` is one synchronous composed turn. Provider errors and
90-second invocation timeouts are typed; the HTTP wrapper defaults to a
12-second response window. There is no agent task cancel, retry, resume, or
result-poll protocol on this surface.

`agent_identity_activate` is a separate admin-only flat write. It activates a
versioned head source for the canonical AgentModel without resetting UserModel,
commitments, operators, or calibration history. It appears only when admin MCP
tools are enabled and requires `admin:write`; it is not general head
registration.

## Durable Head Calls

Head Calls ride the existing coordination stream. From MCP, publish
`stream_publish` with `kind: "head_call"`, the room/task topic in `stream`, and
the serialized call in `payload`. Read with `stream_read`; use
`ack_policy: "explicit"` plus `stream_ack` when durable injection must be
confirmed. `Ask` and `Block` should set `urgency` and `target_actor` so the
existing mention/wake bridge fires.

The call envelope has five kinds:

- `say`: fire and forget;
- `ask` and `block`: require absolute `deadline_ms`;
- `reply` and `timeout`: require the originating `call_id` as
  `correlation_id`.

Flat `stream_publish` accepts a free-form payload and does not itself construct
or validate `HeadCall`. Use the typed Rust constructor or the WebSocket gateway
when invariant enforcement matters.

The live gateway is `GET /v1/head-calls/ws?stream=<topic>`. It requires
`coordination:read`, derives tenant and head from the authenticated principal,
overwrites `from_actor` and `room_id`, validates the call, and uses explicit
stream delivery. An ack at stage `received` is advisory; only `injected`
advances the durable cursor. Deliveries are retried and can become a typed
dead-letter tension after the configured attempts.

Ordinary MCP results may include `unread_head_calls` and
`unread_head_calls_more`. That piggyback is a non-advancing peek; it does not
acknowledge or inject the call.

## A2A

Outbound A2A exists as the Rust crate `rustyred-thg-a2a-client`, not as an MCP,
GraphQL, or generic dynamic-gateway action. Its APIs can:

- fetch `/.well-known/agent-card.json`;
- register one tenant-scoped `a2a_skill` affordance per advertised skill with
  permission `a2a.message.send`;
- dry-run or fire an allowlisted JSON-RPC `message/send` request;
- extract an artifact/outcome and record `a2a_task_ok` or `a2a_task_error` in
  the ordinary affordance fitness loop.

The runtime inbound A2A membrane can turn authorized messages into jobs and
list the resulting tasks, but the current server router does not mount the A2A
Agent Card or JSON-RPC endpoints. `/.well-known/agent.json` is the MCP discovery
manifest, not the A2A `/.well-known/agent-card.json` contract. Do not route an
agent to invented `a2a_register`, `a2a_send`, or `a2a_cancel` tools.

## ACP

The server mounts `GET /v1/commonplace/acp/ws`. It requires `run:write` and
bridges the WebSocket to a server-local ACP stdio child. Supported inbound
frames are `start_session`, `prompt`, `execute_offload`,
`approve_file_write`, `deny_file_write`, `approve_command`, `deny_command`,
`respond_permission`, and `cancel_permission`.

`start_session` selects a configured agent command, canonicalizes the requested
workspace root, performs ACP initialize and `session/new`, and injects the
Harness MCP server. File writes and terminal commands are staged behind
explicit approval frames. Offload keeps the resumable plan and opaque resume
state on the receiver/host side.

ACP is not an MCP or GraphQL tool family. A mounted WebSocket does not prove a
particular ACP binary exists on the deployed host, that its workspace is
available, or that a session completed. Preserve `session_id`, `agent_id`,
permission request ids, command/file approvals, run receipts, and errors.

## Honest gaps

HCM-025 still requires:

- principal-bound remote head registration, discovery, capability, and status;
- one signed task contract shared by local, provider, A2A, and ACP heads;
- task submit, cancel, retry, resume, poll, and result surfaces with replayable
  receipts;
- MCP/GraphQL projections for A2A registration/invocation and mounted inbound
  A2A server endpoints;
- stronger ACP tenant/session binding and deployed-agent capability status;
- live local-resident and external-provider acceptance across the same budget,
  provenance, error, timeout, and cancellation contract.
