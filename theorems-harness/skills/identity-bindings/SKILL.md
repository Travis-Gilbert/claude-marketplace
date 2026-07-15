---
name: identity-bindings
description: "Use when a task needs to inspect or explain the authenticated Harness principal, project, session, actor, binding, head set, scopes, budget, or their admission provenance without accepting caller-supplied identity claims."
---

# Harness identity and bindings

Generated surface map: [capability catalog](./CAPABILITIES.generated.md).

Read `../../references/IDENTITY_CAPABILITY.md` before interpreting identity or
using it to authorize a context operation.

## Workflow

1. Prefer GraphQL `identityBindingStatus`; use flat
   `identity_binding_status` only for compatibility or diagnosis.
2. If the selection, conflict, warning, or provenance chain matters, use
   `identityBindingExplain` or flat `identity_binding_explain`.
3. The operations accept no identity arguments. Tenant, project, session,
   actor, binding, active heads, scopes, and budget must come from the
   authenticated admitted session.
4. Preserve status, `consistent`, project selection, materialization,
   conflicts, warnings, provenance, and receipt hash together.
5. Refuse to infer selection from known projects or identity from environment
   configuration. Do not treat head/model labels as authentication.
6. Label live proof honestly. Local receipt parity is not a production
   admitted-session or two-tenant oracle.

Valid identity status values are `unbound`, `partial`, `resolved`, and
`inconsistent`. Context work additionally requires a resolved, consistent
identity with an admitted project slug and session id.
