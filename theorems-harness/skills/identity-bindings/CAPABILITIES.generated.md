<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Identity and bindings capability catalog

Ambient admission resolves tenant, principal, project, actor, scopes, budget, and composed binding without caller identity arguments.

Plugin version: `0.9.4`. Source server version: `0.5.0`.
Source catalog SHA-256: `feb39dae1c91bf89c5050323c4922f9fbbc5092b6ac5f85fffa34396a173701b`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source | Canonical descriptor |
|---|---|---|---|---|---|---|
| `identity_binding_explain` | flat_mcp | flat compatibility | stable | source-advertised; live-unverified | `tools/list:identity_binding_explain` | — |
| `identity_binding_status` | flat_mcp | flat compatibility | stable | source-advertised; live-unverified | `tools/list:identity_binding_status` | — |
| `Query.identityBindingExplain` | graphql | preferred typed explanation | stable | source-advertised; live-unverified | `graphql_introspect:Query.identityBindingExplain` | — |
| `Query.identityBindingStatus` | graphql | preferred typed status | stable | source-advertised; live-unverified | `graphql_introspect:Query.identityBindingStatus` | — |

Behavioral contract: `references/IDENTITY_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
