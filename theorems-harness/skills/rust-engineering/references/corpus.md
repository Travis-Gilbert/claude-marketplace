# Rust Skill Corpus

This skill is refreshed by `apps/notebook/encode/refresh_rust_skill.py`.
It combines local Theorem/RustyRed substrate files with bounded slices
from external Rust repositories so the skill remains broad rather than
a one-product RustyRed-only pack.

## Refresh Summary

| Field | Value |
|---|---|
| `source_packet_id` | `source:rust-engineering-external-corpus-v0.4` |
| `source_content_hash` | `sha256:683af3877bc763fb5202ed7c0d6303b47685214408973c468a77af87c1019f96` |
| `pack_content_hash` | `sha256:325ba9cbba248cadb5edc2c207f1b5071331d64e7e2191f8ebbfa3d2fa92cf43` |
| lowered views | `3325` |
| compiled artifacts | `2139` |
| selected source files | `115` |
| trust level | `scanned` |
| canonical ready | `False` |

## External Corpus

| Source | Commit | Files | Status | Why |
|---|---:|---:|---|---|
| `https://github.com/dtolnay/syn.git` | `353d20b9ee40` | `8` | `cached` | Rust AST parsing and proc-macro input modeling. |
| `https://github.com/dtolnay/quote.git` | `ba07807af385` | `8` | `cached` | Token generation and macro ergonomics. |
| `https://github.com/marshallpierce/rust-base64.git` | `13f4fe86e565` | `8` | `cached` | Small focused crate with API design, feature flags, and tests. |
| `https://github.com/huggingface/candle.git` | `b5a101a3b745` | `8` | `cached` | ML tensor and model-loading patterns. |
| `https://github.com/TheAlgorithms/Rust.git` | `7789289348bb` | `2` | `cached` | Broad algorithm implementations with small tests. |
| `https://github.com/tensorzero/tensorzero.git` | `62eb8f63e8ec` | `8` | `cached` | Production Rust AI gateway and evaluation architecture. |
| `https://github.com/servo/servo.git` | `92c8770e55d5` | `8` | `cached` | Browser and systems Rust with platform seams. |
| `https://github.com/git-ai-project/git-ai.git` | `5647ea559450` | `8` | `cached` | Git and AI workflow integration. |
| `https://github.com/DragonOS-Community/DragonOS.git` | `c57512cc5e7f` | `8` | `cached` | OS/kernel Rust and unsafe boundary patterns. |
| `https://github.com/ast-grep/ast-grep.git` | `796ccba08222` | `8` | `cached` | Parser-backed structural search and rewrite patterns. |
| `https://github.com/GitoxideLabs/gitoxide.git` | `eac50e1207e2` | `8` | `cached` | Large production Git implementation and IO/error design. |

## Selected Files

- `local/theorem/rustyredcore_THG/crates/ensemble/src/lib.rs`
- `local/theorem/rustyredcore_THG/crates/ensemble/src/registry.rs`
- `local/theorem/rustyredcore_THG/crates/ensemble/src/selector.rs`
- `local/theorem/rustyredcore_THG/crates/ensemble/src/decision.rs`
- `local/theorem/rustyredcore_THG/crates/ensemble/src/trust.rs`
- `local/theorem/rustyredcore_THG/crates/theorem-harness-runtime/src/lib.rs`
- `local/theorem/rustyredcore_THG/crates/theorem-harness-runtime/src/skill_pack.rs`
- `local/theorem/rustyredcore_THG/crates/theorem-harness-runtime/src/coordination.rs`
- `local/theorem/rustyredcore_THG/crates/theorem-harness-runtime/src/memory.rs`
- `local/theorem/rustyredcore_THG/crates/theorem-harness-runtime/src/event_log.rs`
- `local/theorem/rustyredcore_THG/crates/theorem-harness-runtime/src/binding_store.rs`
- `local/theorem/rustyredcore_THG/crates/theorem-harness-core/src/agent_binding.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-core/src/graph_store.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-core/src/symbolic.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-core/src/lib.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-mcp/src/lib.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-affordances/src/lib.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-affordances/src/types.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-affordances/src/registry.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-affordances/src/selection.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-affordances/src/charter.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-affordances/src/outcomes.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-affordances/src/training.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-affordances/src/tests/registry_test.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-affordances/src/tests/selection_test.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-affordances/src/tests/charter_test.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-affordances/src/tests/outcomes_test.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-thg-affordances/src/tests/training_test.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-web/src/lib.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-web/src/fetch_cascade.rs`
- `local/theorem/rustyredcore_THG/crates/rustyred-web/src/robots.rs`
- `local/theorem/apps/browser-substrate/src/lib.rs`
- `local/theorem/apps/browser-substrate/tests/persistence.rs`
- `external/syn/Cargo.toml`
- `external/syn/src/lib.rs`
- `external/syn/tests/test_token_trees.rs`
- `external/syn/tests/test_parse_quote.rs`
- `external/syn/tests/test_asyncness.rs`
- `external/syn/tests/regression.rs`
- `external/syn/tests/test_attribute.rs`
- `external/syn/tests/test_derive_input.rs`
- `external/quote/Cargo.toml`
- `external/quote/src/lib.rs`
- `external/quote/tests/compiletest.rs`
- `external/quote/tests/test.rs`
- `external/quote/benches/lib.rs`
- `external/quote/benches/main.rs`
- `external/quote/src/to_tokens.rs`
- `external/quote/src/runtime.rs`
- `external/base64/Cargo.toml`
- `external/base64/src/lib.rs`
- `external/base64/tests/encode.rs`
- `external/base64/tests/tests.rs`
- `external/base64/src/tests.rs`
- `external/base64/benches/benchmarks.rs`
- `external/base64/examples/base64.rs`
- `external/base64/src/alphabet.rs`
- `external/candle/Cargo.toml`
- `external/candle/candle-core/src/lib.rs`
- `external/candle/candle-core/src/cuda_backend/error.rs`
- `external/candle/candle-core/src/error.rs`
- `external/candle/candle-core/src/quantized/tokenizer.rs`
- `external/candle/candle-core/src/test_utils.rs`
- `external/candle/candle-core/Cargo.toml`
- `external/candle/candle-core/src/accelerate.rs`
- `external/the-algorithms-rust/Cargo.toml`
- `external/the-algorithms-rust/src/lib.rs`
- `external/tensorzero/crates/gateway/tests/error_json.rs`
- `external/tensorzero/crates/tensorzero-derive/tests/deserialize.rs`
- `external/tensorzero/crates/tensorzero-client/tests/test_stored_inferences.rs`
- `external/tensorzero/crates/autopilot-tools/tests/config_tools.rs`
- `external/tensorzero/crates/autopilot-tools/tests/datapoint_tools.rs`
- `external/tensorzero/crates/autopilot-tools/tests/episode_tools.rs`
- `external/tensorzero/crates/autopilot-tools/tests/feedback_tools.rs`
- `external/tensorzero/crates/autopilot-tools/tests/inference_tool.rs`
- `external/servo/Cargo.toml`
- `external/servo/components/net/tests/main.rs`
- `external/servo/components/storage/tests/main.rs`
- `external/servo/components/url/tests/main.rs`
- `external/servo/components/hyper_serde/tests/tokens.rs`
- `external/servo/components/background_hang_monitor/tests/hang_monitor_tests.rs`
- `external/servo/components/fonts/tests/font.rs`
- `external/servo/components/fonts/tests/font_context.rs`
- `external/git-ai/Cargo.toml`
- `external/git-ai/src/lib.rs`
- `external/git-ai/src/main.rs`
- `external/git-ai/tests/async_mode.rs`
- `external/git-ai/tests/commit_hunks.rs`
- `external/git-ai/tests/commit_tree_update_ref.rs`
- `external/git-ai/tests/config_fresh_test.rs`
- `external/git-ai/tests/notes_sync_regression.rs`
- `external/dragonos/kernel/crates/bitmap/tests/alloc-bitmap.rs`
- `external/dragonos/kernel/crates/bitmap/tests/static-bitmap.rs`
- `external/dragonos/kernel/crates/intertrait/tests/castable_to.rs`
- `external/dragonos/kernel/crates/intertrait/tests/on-enum.rs`
- `external/dragonos/kernel/crates/intertrait/tests/on-struct.rs`
- `external/dragonos/kernel/crates/intertrait/tests/on-trait-impl-assoc-type1.rs`
- `external/dragonos/kernel/crates/intertrait/tests/on-trait-impl-assoc-type2.rs`
- `external/dragonos/kernel/crates/intertrait/tests/on-trait-impl-assoc-type3.rs`
- `external/ast-grep/Cargo.toml`
- `external/ast-grep/crates/cli/tests/help_test.rs`
- `external/ast-grep/crates/cli/tests/run_test.rs`
- `external/ast-grep/crates/cli/tests/scan_test.rs`
- `external/ast-grep/crates/cli/tests/verify_test.rs`
- `external/ast-grep/crates/lsp/tests/basic.rs`
- `external/ast-grep/crates/wasm/tests/web.rs`
- `external/ast-grep/crates/cli/src/lib.rs`
- `external/gitoxide/Cargo.toml`
- `external/gitoxide/src/lib.rs`
- `external/gitoxide/examples/log.rs`
- `external/gitoxide/examples/ls-tree.rs`
- `external/gitoxide/src/ein.rs`
- `external/gitoxide/src/gix.rs`
- `external/gitoxide/src/shared.rs`
- `external/gitoxide/src/uni.rs`

## Held-Out Gate

- `canonical_ready`: `False`
- `benchmark_treatment_beats_baseline`: `False`
- `regression_signals`: `held_out_treatment_task_floor_not_met, held_out_baseline_task_floor_not_met, treatment_does_not_beat_baseline, treatment_validator_pass_rate_below_policy`

The gate requires real baseline and treatment receipts across the full
20-task Rust held-out set. Missing receipts keep this pack at scanned
confidence even when the corpus compiles successfully.
