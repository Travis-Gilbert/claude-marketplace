<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Constraint solvers capability catalog

Stable solver affordances are discovered and invoked dynamically with provider, bound, cancellation, and proof receipts.

Plugin version: `0.9.2`. Source server version: `0.5.0`.
Source catalog SHA-256: `4953f49fcabb220c82489dc5ac8b488ce3566b1f7b9b4639a732358bab7b9a66`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source |
|---|---|---|---|---|---|
| `constraint.check` | dynamic | stable satisfiability affordance | stable dynamic | registry-declared; live-unverified | `describe:constraint.check` |
| `constraint.optimize` | dynamic | stable bounded optimization affordance | stable dynamic | registry-declared; live-unverified | `describe:constraint.optimize` |
| `describe` | flat_mcp | read dynamic schema | stable | source-advertised; live-unverified | `tools/list:describe` |
| `invoke` | flat_mcp | invoke selected affordance | stable | source-advertised; live-unverified | `tools/list:invoke` |
| `tool_search` | flat_mcp | discover dynamic affordances | stable | source-advertised; live-unverified | `tools/list:tool_search` |

Behavioral contract: `references/SOLVER_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
