<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Learning and evolution capability catalog

Callable outcome evidence and proposal validation remain separate from source-only trainer, promotion, and rollback lifecycles.

Plugin version: `0.9.2`. Source server version: `0.5.0`.
Source catalog SHA-256: `4953f49fcabb220c82489dc5ac8b488ce3566b1f7b9b4639a732358bab7b9a66`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source |
|---|---|---|---|---|---|
| `programmable_graph` | flat_mcp | validate evolve proposals | beta | source-advertised; live-unverified | `tools/list:programmable_graph` |
| `programmable_graph_apply` | flat_mcp | write-gated graph materialization | beta | source-advertised; live-unverified | `tools/list:programmable_graph_apply` |
| `GEPA candidate lifecycle` | rust | repository-only training/evaluation | source-only | unmounted | `ensemble crate` |
| `ReasoningBank promotion lifecycle` | rust | repository-only promotion seam | source-only | unmounted | `ensemble crate` |
| `theorem-evolve lifecycle` | rust | repository-only train/promote/rollback | source-only | unmounted | `theorem-evolve` |

Behavioral contract: `references/LEARNING_EVOLUTION_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
