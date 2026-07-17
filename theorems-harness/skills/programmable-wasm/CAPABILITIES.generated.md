<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Programmable WASM capability catalog

Installed app exports may be dynamic affordances while the durable publish/promote/rollback registry remains source-only.

Plugin version: `0.9.4`. Source server version: `0.5.0`.
Source catalog SHA-256: `feb39dae1c91bf89c5050323c4922f9fbbc5092b6ac5f85fffa34396a173701b`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source | Canonical descriptor |
|---|---|---|---|---|---|---|
| `wasm_plugin:<plugin_id>.<export>` | dynamic | installed app export pattern | beta dynamic | manifest-dependent; live-unverified | `describe:wasm export` | — |
| `programmable WASM registry lifecycle` | rust | repository-only publish/promote/rollback | source-only | unmounted | `programmable WASM kernel` | — |

Behavioral contract: `references/PROGRAMMABLE_WASM_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
