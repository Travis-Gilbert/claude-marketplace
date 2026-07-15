<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Constraint solvers capability catalog

Stable solver affordances are discovered and invoked dynamically with provider, bound, cancellation, and proof receipts.

Plugin version: `0.9.3`. Source server version: `0.5.0`.
Source catalog SHA-256: `feb39dae1c91bf89c5050323c4922f9fbbc5092b6ac5f85fffa34396a173701b`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source | Canonical descriptor |
|---|---|---|---|---|---|---|
| `constraint.check` | dynamic | stable satisfiability affordance | stable dynamic | registry-declared; live-unverified | `describe:constraint.check` | — |
| `constraint.optimize` | dynamic | stable bounded optimization affordance | stable dynamic | registry-declared; live-unverified | `describe:constraint.optimize` | — |
| `describe` | flat_mcp | read dynamic schema | stable | source-advertised; live-unverified | `tools/list:describe` | — |
| `invoke` | flat_mcp | invoke selected affordance | stable | source-advertised; live-unverified | `tools/list:invoke` | — |
| `tool_search` | flat_mcp | discover dynamic affordances | stable | source-advertised; live-unverified | `tools/list:tool_search` | — |

Behavioral contract: `references/SOLVER_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
