<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Plans and execution capability catalog

Durable Plan creation and the proof-bound transition lifecycle remain separate from work graphs and jobs.

Plugin version: `0.9.4`. Source server version: `0.5.0`.
Source catalog SHA-256: `feb39dae1c91bf89c5050323c4922f9fbbc5092b6ac5f85fffa34396a173701b`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source | Canonical descriptor |
|---|---|---|---|---|---|---|
| `Plan transition lifecycle` | behavior | claim through done with patch generation | stable contract | behavioral; runtime proof required | `skills/execute/SKILL.md` | — |
| `harness_replay` | flat_mcp | bounded Plan event replay | stable | source-advertised; live-unverified | `tools/list:harness_replay` | — |
| `plan` | flat_mcp | canonical flat Plan membrane | stable | source-advertised; live-unverified | `tools/list:plan` | — |
| `Mutation.createPlan` | graphql | preferred typed creation | stable | source-advertised; live-unverified | `graphql_introspect:Mutation.createPlan` | — |
| `Mutation.provePlanTask` | graphql | proof receipt transition | stable | source-advertised; live-unverified | `graphql_introspect:Mutation.provePlanTask` | — |
| `Mutation.spawnPlanVerify` | graphql | independent verify sibling | stable | source-advertised; live-unverified | `graphql_introspect:Mutation.spawnPlanVerify` | — |

Behavioral contract: `references/PLAN_TEMPLATE.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
