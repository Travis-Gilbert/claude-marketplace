<!-- GENERATED: scripts/generate_harness_capability_projections.py -->
# Programmable WASM capability catalog

Installed app exports may be dynamic affordances while the durable publish/promote/rollback registry remains source-only.

Plugin version: `0.9.2`. Source server version: `0.5.0`.
Source catalog SHA-256: `4953f49fcabb220c82489dc5ac8b488ce3566b1f7b9b4639a732358bab7b9a66`.

| Capability | Surface | Guidance | Maturity | Live status | Schema/source |
|---|---|---|---|---|---|
| `wasm_plugin:<plugin_id>.<export>` | dynamic | installed app export pattern | beta dynamic | manifest-dependent; live-unverified | `describe:wasm export` |
| `programmable WASM registry lifecycle` | rust | repository-only publish/promote/rollback | source-only | unmounted | `programmable WASM kernel` |

Behavioral contract: `references/PROGRAMMABLE_WASM_CAPABILITY.md` in the source plugin.
Live status is an explicit claim, not an inference from implementation presence.
