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
| Local `Theorem/rustyredcore_THG` | RustyRed/THG GraphStore, native MCP, harness runtime, skill-pack serving. |

## Corpus Policy

- Refresh versions before a real ingest. Version pins above are seeds, not
  claims that the listed release is latest.
- Prefer representative slices over cloning every line of huge repos. Use
  Cargo metadata, public APIs, tests, docs, and high-signal modules first.
- Keep licenses and attribution in the pack metadata.
- Encode local Theorem/RustyRed work continuously: every reusable validator,
  dependency-boundary fix, GraphStore contract, and native MCP lesson can update
  the Rust skill.
- Separate examples by domain so future agents can retrieve the relevant
  pattern without loading the whole corpus.

## Candidate Pattern Tags

- `rust.workspace.manifest_edge`
- `rust.async.broadcast_sse`
- `rust.graphstore.persistence`
- `rust.proc_macro.ast`
- `rust.ffi.pyo3_export`
- `rust.validator.native_artifact`
- `rust.ml.tensor_fixture`
- `rust.systems.unsafe_boundary`
- `rust.code_search.structural_rewrite`
- `rust.git.storage_io`


## Encoded First-Party Run

This skill was run through the Theseus `code_corpus_v1` pipeline against a first-party Theorem/RustyRed slice. The generated `provenance.json` contains the full content-addressed pack record.

| Field | Value |
|---|---|
| `source_packet_id` | `source:rust-engineering-first-party-v1` |
| `source_content_hash` | `sha256:fda037bfe51f515d3cabfebf0e74524063eb4dee7750f0cfe0af82bce6938889` |
| `pack_content_hash` | `sha256:8508744bffca6d68d7bf8b42de9646903d1d87b945fc8fa0748f2dd0534a944e` |
| lowered views | `930` |
| compiled artifacts | `930` |

Encoded source files:
- `rustyredcore_THG/crates/theorem-harness-runtime/src/skill_pack.rs`
- `rustyredcore_THG/crates/rustyred-thg-mcp/src/lib.rs`
- `rustyredcore_THG/crates/theorem-harness-core/src/agent_binding.rs`
- `rustyredcore_THG/crates/rustyred-thg-core/src/graph_store.rs`
- `rustyredcore_THG/crates/rustyred-web/src/lib.rs`
- `apps/browser-substrate/src/lib.rs`

## Native Runtime Receipt

The full 930-artifact pack is materialized in this skill folder. A bounded
native MCP smoke projection was also published and applied through RustyRed so
the runtime has a live receipt without sending the entire generated crate over
one MCP request.

| Field | Value |
|---|---|
| full `pack_content_hash` | `sha256:8508744bffca6d68d7bf8b42de9646903d1d87b945fc8fa0748f2dd0534a944e` |
| smoke `pack_content_hash` | `sha256:ad4d29cd538986cc6d2a3a7e2fb3bd376cd3b217a4a90983069e036c354e386a` |
| `skill_apply` receipt | `7d3db727e4516e8d822a4fb79ab0a7f7790f935fbf4de2a7a9032f755f820789` |
| validator mode | `native_artifact_sandbox` |
| matched artifact | `coordination_member_node` |
