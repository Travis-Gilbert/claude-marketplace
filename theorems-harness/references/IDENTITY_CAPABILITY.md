# Identity and Binding Capability

Harness identity is an admitted-session capability. The current principal,
project, session, actor, binding, head set, memory scope, capability scope, and
budget come from the authenticated transport and materialized binding chain.
They are not selected by tool arguments or inferred from environment-only
configuration.

Prefer the typed GraphQL queries after `graphql_introspect`. Use the flat MCP
tools only when GraphQL is unavailable or when flat compatibility is the
surface under test.

## Surface mapping

| Operation | GraphQL | Flat MCP | Effect |
|---|---|---|---|
| Status | Query `identityBindingStatus` | `identity_binding_status` | Resolves the admitted principal and summarizes its current identity and binding. |
| Explain | Query `identityBindingExplain` | `identity_binding_explain` | Returns the same receipt plus every available provenance hop, conflict, and warning. |

Both operations accept no identity arguments. Do not pass tenant, project,
session, actor, binding, head, or budget claims in a nested input. On a
GraphQL-default server the covered flat tools may be absent from `tools/list`;
that is not evidence that identity resolution is missing.

## Receipt contract

The GraphQL fields return a typed `IdentityBindingReceipt`. Flat MCP returns
the equivalent JSON projection. Preserve these parts together:

- `schemaVersion` / `schema_version`, `mode`, `status`, and `consistent`.
- Principal identity: principal, user, session, project, tenant, actor,
  binding, admin status, and `resolutionPath` / `resolution_path`.
- Binding state: materialization and lifecycle status, run and event anchors,
  agent and owner identity, composition hash, trust tier, active head set,
  memory and capability scope, budget, and trace id.
- Agent/model metadata and project selection, including `knownProjects`.
- Provenance hops, conflicts, warnings, and the stable 64-character
  `receiptHash` / `receipt_hash` content address.

The status is `unbound`, `partial`, `resolved`, or `inconsistent`.
`consistent: true` means the receipt has no binding conflict codes; it does not
mean every optional field is materialized. An admitted but unmaterialized
binding can therefore be `partial` and carry a warning.

## Admission and selection rules

1. An authenticated MCP request context is mandatory. Missing principal
   admission is a refusal, not an anonymous identity.
2. The principal tenant must match the active Harness tenant. Cross-tenant
   claims refuse.
3. Environment or server configuration alone cannot manufacture identity; a
   config-only identity is refused.
4. Project selection is explicit. A list of known UserModel projects does not
   silently select one. Selection status may be `unbound`, `legacy_id_only`,
   `claimed`, `resolved`, or `inconsistent`.
5. An actor outside the active composition is refused. Report head and model
   fields as runtime metadata, not as substitutes for the authenticated
   principal and binding chain.
6. Context operations require a `resolved`, consistent identity with a
   nonempty admitted project slug and session id. The server fixes that context
   surface to `harness_prepare`.

## Current proof boundary

Repository tests prove typed GraphQL and flat MCP parity, config-only refusal,
actor/composition refusal, partial unmaterialized bindings, and receipt
projection. They do not prove a production admitted session for this install.
The live identity oracle is environment-gated and requires
`THEOREM_RUN_IDENTITY_LIVE=1` plus authenticated Harness MCP access.

Still open in the substrate are the full two-tenant/auth live matrix,
per-field GraphQL and async-worker admission, and complete consistency checks
for every binding, head, budget, and calibration field. Report those as live or
implementation gaps rather than promoting local receipt tests to production
evidence.
