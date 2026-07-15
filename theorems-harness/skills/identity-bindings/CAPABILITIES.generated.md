<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Identity and bindings capability catalog

Ambient admission resolves tenant, principal, project, actor, scopes, budget, and composed binding without caller identity arguments.

Plugin version: `0.9.2`. Source server version: `0.5.0`.
Source catalog SHA-256: `4953f49fcabb220c82489dc5ac8b488ce3566b1f7b9b4639a732358bab7b9a66`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source |
|---|---|---|---|---|---|
| `identity_binding_explain` | flat_mcp | flat compatibility | stable | source-advertised; live-unverified | `tools/list:identity_binding_explain` |
| `identity_binding_status` | flat_mcp | flat compatibility | stable | source-advertised; live-unverified | `tools/list:identity_binding_status` |
| `Query.identityBindingExplain` | graphql | preferred typed explanation | stable | source-advertised; live-unverified | `graphql_introspect:Query.identityBindingExplain` |
| `Query.identityBindingStatus` | graphql | preferred typed status | stable | source-advertised; live-unverified | `graphql_introspect:Query.identityBindingStatus` |

Behavioral contract: `references/IDENTITY_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
