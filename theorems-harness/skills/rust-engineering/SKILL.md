---
name: rust-engineering
description: "Use when writing, reviewing, debugging, explaining, encoding, or improving Rust code, Cargo workspaces, Rust MCP/server crates, Rust validators, PyO3/FFI bridges, async Rust services, parsers/macros, systems code, Ensemble pack selection, affordance charters, or Rust skill-pack corpus work."
---

# Rust Engineering

This skill makes the agent better at Rust work by combining ordinary source
inspection with the Harness skill-pack loop. It is not a one-off trace skill:
reasoning traces, review notes, and postmortems are evidence for updating the
Rust skill, not the skill's public interface.

Use this for Rust implementation, Rust review, Rust debugging, Rust codebase
orientation, Rust validator work, and the Rust corpus/encoding pipeline.

## Core Posture

- Start from the live crate/workspace shape. Rust repos often have nested
  workspaces, standalone crates, examples, generated bindings, and target-dir
  constraints; do not assume a root `Cargo.toml` owns everything.
- Prefer local crate patterns over generic Rust advice. Match error types,
  async runtime choices, serialization style, feature gates, tracing, and test
  organization already present.
- Keep ownership explicit. For shared Codex/Claude work, write a
  `coordination_intent` before editing hot Rust files and close it with the
  validation receipts.
- Treat compiler errors as design feedback. If the third workaround appears in
  the same module, stop and ask whether the dependency edge, trait boundary, or
  runtime layer is wrong.
- Validate narrowly first, then widen. A focused `cargo test -p crate test_name`
  often proves the slice better than a broad build that fails on unrelated
  workspace debt.

## Standard Rust Workflow

1. **Observe the workspace.** Run `rg --files`, inspect `Cargo.toml`,
   `Cargo.lock`, crate-local `README`/`AGENTS`, and nearby tests. Identify
   whether the target is a workspace member, standalone crate, generated crate,
   or host-language bridge.
2. **Classify the Rust domain.** Use the domain map below to choose patterns,
   references, and validation gates.
3. **Edit in the local style.** Prefer existing traits, newtypes, serde shapes,
   error enums, feature flags, and module organization. Add abstractions only
   when they remove real repeated complexity.
4. **Validate the real seam.** Compile or test the smallest crate that owns the
   behavior. Add targeted tests for behavior changes, graph contracts,
   validators, parser outputs, protocol schemas, and persistence edges.
5. **Feed the skill loop.** When a Rust pattern, bug, validator, or postmortem
   is reusable, encode it as a skill-pack signal with outcome metadata rather
   than letting it remain buried in chat.

## Domain Map

| Domain | Look for | Good default |
|---|---|---|
| Crate/workspace plumbing | `Cargo.toml`, feature gates, path deps | Make the dependency edge explicit; avoid hidden cross-crate imports. |
| Async/server Rust | `tokio`, `axum`, `tonic`, `hyper`, streams | Test the handler/stream contract and auth/tenant scoping, not just parse. |
| Graph/storage substrate | `GraphStore`, AOF/snapshot, indexes | Verify durable reopen or trait-vs-inherent method behavior. |
| Parsers/macros | `syn`, `quote`, `proc_macro2`, tree-sitter | Prefer AST APIs over string parsing; test representative syntax. |
| FFI/bridges | `pyo3`, `maturin`, UniFFI, C ABI | Preserve exported names and byte/parity contracts. |
| Validators/skills | `SkillPack`, artifacts, receipts | Keep raw source execution out of request paths; record validator mode. |
| Systems/browser | Servo, OS kernels, low-level IO | Isolate unsafe/platform assumptions and keep reproducible fixtures. |
| ML/Rust data | Candle, tensor runtimes, vector search | Pin shapes/dimensions and test small deterministic fixtures. |

Read `references/corpus.md` when choosing what to encode, extending the corpus,
or deciding which external Rust repos should teach the skill.

## Encoding And Update Loop

The Rust skill improves through repeated encoded evidence:

- **Corpus inputs:** Rust repo snapshots, crate metadata, selected source files,
  tests, docs, review notes, and compact reasoning traces.
- **Candidate extraction:** recurring implementation patterns, failure modes,
  validation idioms, framework-specific contracts, and "do not repeat" lessons.
- **Pack build:** compile a `CapabilityPackSpec` with content-addressed source
  and artifact hashes. Include validators that prove behavior, not just prose.
- **Held-out gate:** evaluate against the Rust held-out task set. Promotion
  requires task coverage, high validator pass rate, and treatment beating the
  baseline.
- **Runtime use:** publish/apply via native `skill_*` verbs when available,
  then persist `UseReceipt`s so future runs can promote, revise, or retire the
  pack.

Reasoning traces are useful when they generalize: include traces that explain a
debugging turn, a dependency-boundary mistake, a borrow-checker repair, or a
validation choice. Do not create a narrow skill for a trace that will not recur.

## Validation Defaults

Use the narrowest high-signal proof:

- `cargo test -p <crate> <test_name>` for behavior or runtime contracts.
- `cargo test --manifest-path <path>` for standalone crates.
- `cargo check -p <crate>` when tests are too heavy but type contracts matter.
- `cargo clippy -p <crate> --all-targets --no-deps -- -D warnings` when the
  crate is expected to be warning-clean and disk/time allow it.
- `git diff --check` before reporting or committing.

If disk is tight, set `CARGO_INCREMENTAL=0`, reuse an existing
`CARGO_TARGET_DIR`, or run one crate at a time. Report skipped broad gates
honestly.

## Output Shape

For Rust implementation work, report:

- what crate/module changed
- which Rust domain pattern was applied
- which validation ran and what passed
- what remains unvalidated or deliberately deferred

For Rust skill-pack work, report:

- corpus inputs used
- candidate capability or pattern learned
- validators attached
- held-out gate result or why it was not run
- whether a runtime `skill_publish` / `skill_apply` receipt exists

## Anti-Patterns

- Assuming a repo-level Cargo workspace when the project has standalone crates.
- Adding a dependency to code without adding the manifest edge that makes it
  compile outside the current editor session.
- Replacing typed Rust APIs with ad hoc string parsing.
- Treating `node --check`, `cargo fmt`, or a successful grep as runtime proof.
- Turning one-off reasoning traces into public skills instead of encoding them
  as evidence for a broader Rust capability.

## Capabilities
- checker_rule
- context_atom_template
- dependency_context_hint
- fallback_text_context
- native_validator_candidate
- source_file_context
- structure_decision_hint
- validator_contract

## Scripts
- `scripts/Cargo.toml`
- `scripts/src/lib.rs`
- `scripts/src/validators/validates_acquire_redcore_directory_lock.rs`
- `scripts/src/validators/validates_add_receipt_node.rs`
- `scripts/src/validators/validates_admin_tool_requires_read_write_mcp_mode_and_admin_scope.rs`
- `scripts/src/validators/validates_affordance_substrate_survives_redcore_reopen_and_exports.rs`
- `scripts/src/validators/validates_algo_communities.rs`
- `scripts/src/validators/validates_algo_components.rs`
- `scripts/src/validators/validates_algorithm_communities_inline_payload.rs`
- `scripts/src/validators/validates_algorithm_communities_inline_returns_labels_and_modularity.rs`
- `scripts/src/validators/validates_algorithm_components_inline_partitions_disconnected_inline_graph.rs`
- `scripts/src/validators/validates_algorithm_components_inline_payload.rs`
- `scripts/src/validators/validates_algorithm_inline_tools_listed_in_tools_response.rs`
- `scripts/src/validators/validates_algorithm_pagerank_inline_payload.rs`
- `scripts/src/validators/validates_algorithm_pagerank_inline_returns_scores.rs`
- `scripts/src/validators/validates_algorithm_ppr_inline_alias_routes_to_same_handler.rs`
- `scripts/src/validators/validates_algorithm_ppr_inline_payload.rs`
- `scripts/src/validators/validates_algorithm_ppr_inline_returns_scores_against_inline_adjacency.rs`
- `scripts/src/validators/validates_algorithm_ppr_tenant_backed_response_shape_unchanged.rs`
- `scripts/src/validators/validates_algorithm_tool_calls_run_over_graph_edges.rs`
- `scripts/src/validators/validates_append_binding_transition_persists_binding_event_and_edges.rs`
- `scripts/src/validators/validates_append_rejects_conflicting_event_at_same_sequence.rs`
- `scripts/src/validators/validates_append_requires_contiguous_events.rs`
- `scripts/src/validators/validates_append_transition_persists_run_event_and_edges.rs`
- 989 more generated script files; inspect `scripts/` as needed.

## Provenance
Distilled from source:rust-engineering-external-corpus-v0.4 (code_corpus_v1) at confidence "scanned (compiled, not yet held-out validated)". Full record in provenance.json.
- pack_content_hash: sha256:325ba9cbba248cadb5edc2c207f1b5071331d64e7e2191f8ebbfa3d2fa92cf43
- source_content_hash: sha256:683af3877bc763fb5202ed7c0d6303b47685214408973c468a77af87c1019f96
