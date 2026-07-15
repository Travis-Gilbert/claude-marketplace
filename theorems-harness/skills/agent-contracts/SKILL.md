---
name: agent-contracts
description: "Use when interpreting or designing Harness MCP, GraphQL, HTTP, pagination, truncation, error, idempotency, budget, or receipt behavior and a universal contract must not be assumed."
---

# Agent contracts

Generated surface map: [capability catalog](./CAPABILITIES.generated.md).

Read `../../references/AGENT_CONTRACTS_CAPABILITY.md` before interpreting a
cross-family agent result or proposing a contract.

## Interpret a call

1. Discover the active schema with `tools/list` and `graphql_introspect`; bind
   deployment/catalog identity through `/version` when it matters.
2. Check top-level JSON-RPC `error`, then `result.isError` and
   `structuredContent`, then GraphQL `{data, errors}` or the domain result.
3. Follow the family's own continuation contract. Keep Data cursors, replay
   offsets, stream cursors/acks, and result-fetch byte offsets distinct.
4. If `structuredContent.truncated` is true, use `tool_result_fetch` promptly
   on the same serving process. A fetch handle is not a durable artifact.
5. Preserve the exact family receipt, identity, tenant, budget, version,
   evidence, outcome, refusal, and hash fields. Do not manufacture a generic
   receipt or proof status.
6. Before retrying a write, use that surface's idempotency/replay rules and
   re-read state. Transport timeout does not prove the mutation failed.

HCM-028 standardization and HCM-031 generated projection remain dependencies.
Report current contract differences instead of promising uniform cancellation,
pagination, errors, or receipts.
