<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Learning and evolution capability catalog

Callable outcome evidence and proposal validation remain separate from source-only trainer, promotion, and rollback lifecycles.

Plugin version: `0.9.4`. Source server version: `0.5.0`.
Source catalog SHA-256: `feb39dae1c91bf89c5050323c4922f9fbbc5092b6ac5f85fffa34396a173701b`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source | Canonical descriptor |
|---|---|---|---|---|---|---|
| `programmable_graph` | flat_mcp | validate evolve proposals | beta | source-advertised; live-unverified | `tools/list:programmable_graph` | — |
| `programmable_graph_apply` | flat_mcp | write-gated graph materialization | beta | source-advertised; live-unverified | `tools/list:programmable_graph_apply` | — |
| `GEPA candidate lifecycle` | rust | repository-only training/evaluation | source-only | unmounted | `ensemble crate` | — |
| `ReasoningBank promotion lifecycle` | rust | repository-only promotion seam | source-only | unmounted | `ensemble crate` | — |
| `theorem-evolve lifecycle` | rust | repository-only train/promote/rollback | source-only | unmounted | `theorem-evolve` | — |

Behavioral contract: `references/LEARNING_EVOLUTION_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
