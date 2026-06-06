# Rust Skill Corpus

Use this reference when selecting Rust sources to encode into a general Rust
skill pack. The corpus should cover language mechanics, real production
frameworks, systems code, ML/data code, parser/macro code, and the local
Theorem/RustyRed substrate.

## Seed Corpus

| Source | Why it belongs |
|---|---|
| `pkg:cargo/syn@2.0.117` | AST parsing, proc-macro input modeling, robust syntax handling. |
| `pkg:cargo/base64@0.22.1` | Small focused crate with API design, feature flags, and tests. |
| `https://github.com/dtolnay/quote.git` | Token generation, macro ergonomics, minimal API surface. |
| `https://github.com/huggingface/candle.git` | ML tensors, model loading, deterministic numerical fixtures. |
| `https://github.com/TheAlgorithms/Rust.git` | Broad algorithm patterns and many small testable examples. |
| `https://github.com/tensorzero/tensorzero.git` | Production Rust + AI system architecture, gateways, evals, data flows. |
| `https://github.com/servo/servo.git` | Browser/systems Rust, async/resource loading, platform seams. |
| `https://github.com/git-ai-project/git-ai.git` | Git/AI workflow integration and repository-agent patterns. |
| `https://github.com/DragonOS-Community/DragonOS.git` | OS/kernel Rust, unsafe boundaries, hardware/platform constraints. |
| `https://github.com/ast-grep/ast-grep.git` | Structural code search, parser-backed rewriting, tree-sitter patterns. |
| `https://github.com/GitoxideLabs/gitoxide.git` | Large production Git implementation, no-libgit2 architecture, IO/error design. |

## Additions Worth Encoding

| Source | Why it belongs |
|---|---|
| `https://github.com/tokio-rs/tokio.git` | Async runtime, tasks, channels, cancellation, time, test utilities. |
| `https://github.com/tokio-rs/axum.git` | Router/handler/extractor patterns and HTTP service testing. |
| `https://github.com/hyperium/tonic.git` | gRPC service contracts, prost integration, streaming RPCs. |
| `https://github.com/serde-rs/serde.git` | Serialization contracts, derive behavior, compatibility concerns. |
| `https://github.com/PyO3/pyo3.git` | Python bridge patterns, exported module names, error conversion. |
| `https://github.com/rust-lang/cargo.git` | Cargo workspace, feature resolution, package metadata, lockfile behavior. |
| `https://github.com/rust-lang/rust-analyzer.git` | IDE-grade syntax/semantic analysis and incremental query architecture. |
| `https://github.com/rayon-rs/rayon.git` | Data parallelism, work stealing, safe concurrency patterns. |
| `https://github.com/astral-sh/ruff.git` | Large high-performance Rust application with parser/linter architecture. |
| Local `Theorem/rustyredcore_THG` | RustyRed/THG GraphStore, native MCP, harness runtime, skill-pack serving, affordance charters, and Ensemble pack selection. |

## Corpus Policy

- Refresh versions before a real ingest. Version pins above are seeds, not claims that the listed release is latest.
- Prefer representative slices over cloning every line of huge repos. Use Cargo metadata, public APIs, tests, docs, and high-signal modules first.
- Keep licenses and attribution in the pack metadata.
- Encode local Theorem/RustyRed work continuously: every reusable validator, dependency-boundary fix, GraphStore contract, Ensemble selector rule, affordance charter lesson, and native MCP lesson can update the Rust skill.
- Separate examples by domain so future agents can retrieve the relevant pattern without loading the whole corpus.

## Candidate Pattern Tags

- `rust.workspace.manifest_edge`
- `rust.async.broadcast_sse`
- `rust.graphstore.persistence`
- `rust.proc_macro.ast`
- `rust.ffi.pyo3_export`
- `rust.validator.native_artifact`
- `rust.ensemble.pack_selector`
- `rust.affordance.charter`
- `rust.ml.tensor_fixture`
- `rust.systems.unsafe_boundary`
- `rust.code_search.structural_rewrite`
- `rust.git.storage_io`


## Encoded Upgraded System Run

This skill was rerun through Theseus `code_corpus_v1` after the Ensemble crate and IL/exporter updates landed. The generated `provenance.json` contains the full content-addressed pack record.

| Field | Value |
|---|---|
| `source_packet_id` | `source:rust-engineering-upgraded-system-v1` |
| `source_content_hash` | `sha256:4c8f06571b49170d725a11897df6d45ca6af088ef15fea216ca6100960033a8e` |
| `pack_content_hash` | `sha256:180a04297e7040edb2716a5fe2d336593634cd55c5905c2b035fea63ae135de2` |
| lowered views | `1408` |
| compiled artifacts | `869` |
| rendered validator scripts | `514` |
| compiler path | `Index-API/apps/notebook/encode` (`code_corpus.py`, `codegen/rust.py`, `skill_export.py`) |

Encoded source files:
- `rustyredcore_THG/crates/ensemble/src/lib.rs`
- `rustyredcore_THG/crates/ensemble/src/registry.rs`
- `rustyredcore_THG/crates/ensemble/src/selector.rs`
- `rustyredcore_THG/crates/ensemble/src/decision.rs`
- `rustyredcore_THG/crates/ensemble/src/trust.rs`
- `rustyredcore_THG/crates/rustyred-thg-affordances/src/lib.rs`
- `rustyredcore_THG/crates/rustyred-thg-affordances/src/types.rs`
- `rustyredcore_THG/crates/rustyred-thg-affordances/src/registry.rs`
- `rustyredcore_THG/crates/rustyred-thg-affordances/src/selection.rs`
- `rustyredcore_THG/crates/rustyred-thg-affordances/src/charter.rs`
- `rustyredcore_THG/crates/rustyred-thg-affordances/src/outcomes.rs`
- `rustyredcore_THG/crates/rustyred-thg-affordances/src/training.rs`
- `rustyredcore_THG/crates/rustyred-thg-affordances/src/tests/registry_test.rs`
- `rustyredcore_THG/crates/rustyred-thg-affordances/src/tests/selection_test.rs`
- `rustyredcore_THG/crates/rustyred-thg-affordances/src/tests/charter_test.rs`
- `rustyredcore_THG/crates/rustyred-thg-affordances/src/tests/outcomes_test.rs`
- `rustyredcore_THG/crates/rustyred-thg-affordances/src/tests/training_test.rs`
- `rustyredcore_THG/crates/theorem-harness-runtime/src/lib.rs`
- `rustyredcore_THG/crates/theorem-harness-runtime/src/skill_pack.rs`
- `rustyredcore_THG/crates/theorem-harness-core/src/agent_binding.rs`
- `rustyredcore_THG/crates/rustyred-thg-core/src/graph_store.rs`
- `rustyredcore_THG/crates/rustyred-thg-core/src/lib.rs`
- `rustyredcore_THG/crates/rustyred-thg-mcp/src/lib.rs`
- `rustyredcore_THG/crates/rustyred-web/src/lib.rs`
- `apps/browser-substrate/src/lib.rs`

## Native Runtime Receipt

The full 869-artifact pack is materialized in this skill folder. A bounded native MCP smoke projection was also published and applied through RustyRed so the runtime has a live receipt without sending the entire generated crate over one MCP request.

| Field | Value |
|---|---|
| full `pack_content_hash` | `sha256:180a04297e7040edb2716a5fe2d336593634cd55c5905c2b035fea63ae135de2` |
| smoke `pack_content_hash` | `sha256:5f48f570441f2109c02e597a721038bc546e9d7c243ab54bf919fc667aa1b3a6` |
| `source_content_hash` | `sha256:4c8f06571b49170d725a11897df6d45ca6af088ef15fea216ca6100960033a8e` |
| `skill_apply` receipt | `86e3b9d95ccc0e6f9e7a3e88b894b191085a8f2f08d2292e2e21c529441bd6df` |
| validator mode | `native_artifact_sandbox` |
| matched artifact | `pack_get_node` |
| artifact hash | `sha256:573be0cf113766e272bf65cb422a79ad46a3dd444697d5e44df3226cb4acb966` |
| native route | `native-mcp`, `fallbackUsed=false` |
