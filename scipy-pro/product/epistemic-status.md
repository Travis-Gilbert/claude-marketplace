# Epistemic Status: What's Built vs. Planned

Current state of every capability in research_api, organized by workflow.

## Status Definitions

| Status | Meaning |
|--------|---------|
| **Built** | In production. Tested. Used daily. |
| **Scaffolded** | Code exists, models defined, but incomplete or untested. |
| **Designed** | Specification written. No code yet. |
| **Unstarted** | Identified as needed. No spec or code. |

## /reason -- Text to Claims to Tensions to Models

| Capability | Status | Notes |
|------------|--------|-------|
| spaCy sentence splitting | Built | Production + dev. en_core_web_sm. |
| Assertion detection | Built | Rule-based filter. Removes questions, commands, fragments. |
| LLM claim decomposition | Built | Dev only. Splits compound sentences into atomic claims. |
| Rule-based claim decomposition | Built | Production fallback. Coordinating conjunction splitting. |
| Claim model + SHA identity | Built | Full provenance. `_generate_sha()` on every claim. |
| CrossEncoder NLI scoring | Built | Dev only. cross-encoder/nli-deberta-v3-base. |
| Tension detection | Scaffolded | Similarity + contradiction filter exists. Threshold tuning needed. |
| Epistemic status transitions | Scaffolded | extracted/reviewed/canonical states defined. Transition logic partial. |
| EpistemicModel formation | Designed | Cluster claims -> form model with assumptions + scope. |
| Model revision from tensions | Designed | Tensions trigger re-evaluation of affected models. |
| Confidence calibration | Unstarted | Bayesian updates on claim confidence from new evidence. |

## /graph -- Objects to Structure to Self-Organization

| Capability | Status | Notes |
|------------|--------|-------|
| Object model (10 types) | Built | Production. Full CRUD with soft-delete. |
| Edge model (14 types) | Built | Production. from_object/to_object. Plain-English reason. |
| 7-pass engine (engine.py) | Built | Stateful. Per-notebook engine_config controls passes. |
| 6-pass compose engine | Built | Stateless. Text-in, objects-out. No DB writes. |
| TF-IDF similarity (Pass 3) | Built | Production fallback. sklearn TfidfVectorizer. |
| FAISS vector similarity (Pass 4) | Built | Dev only. IndexFlatIP for < 10K objects. |
| SBERT semantic similarity (Pass 5) | Built | Dev only. all-MiniLM-L6-v2. |
| BM25 lexical index | Built | Production + dev. rank-bm25. |
| Louvain community detection | Built | NetworkX. Resolution configurable per notebook. |
| Causal influence DAG | Scaffolded | Temporal precedence filter exists. Transitive reduction partial. |
| Structural hole detection | Scaffolded | Burt's constraint computed. Gap suggestions not wired to UI. |
| Temporal evolution | Scaffolded | Sliding-window snapshots. Trend detection incomplete. |
| Self-organization: classify | Built | Re-classify object types based on cluster context. |
| Self-organization: cluster -> notebook | Scaffolded | Suggests splits. No UI for approval. |
| Self-organization: entity promotion | Built | PhraseMatcher-based. Promotion threshold configurable. |
| Self-organization: edge decay | Designed | Reduce stale edge strength over time. |
| Self-organization: emergent types | Designed | Detect new object/edge types from usage patterns. |
| Knowledge graph embeddings (KGE) | Scaffolded | PyKEEN integration exists. Training pipeline not wired. |
| Adaptive NER | Built | Graph-learned PhraseMatcher. Updates from entity promotion. |
| Canvas/visualization engine | Built | Altair/Vega-Lite spec generation. |

## /encode -- Evidence to Methods to Runs to Learning

| Capability | Status | Notes |
|------------|--------|-------|
| Method model | Built | Versioned. JSON definition. Source Object links. |
| MethodRun model | Built | Records execution, inputs, outputs, duration. |
| Method DSL (JSON structure) | Designed | Sequential steps with conditions. Not Turing-complete. |
| Rule extraction (normative) | Scaffolded | Detects shall/must/should statements. Classification partial. |
| Method compilation | Designed | Text rules -> structured JSON. Domain pack integration planned. |
| Promotion pipeline | Designed | captured -> parsed -> extracted -> reviewed -> promoted -> compiled. |
| Review queue | Designed | Items await human approval. Queue UI not built. |
| Provenance tracking | Built | SHA-hash identity. Auditable history via provenance.py. |
| MethodRun evaluation | Designed | Compare run outputs against expected results. |
| Domain packs | Designed | Type mappings, compilation rules, evaluation criteria per domain. |

## /gather -- Web to Corpus to Training Data to Evaluation

| Capability | Status | Notes |
|------------|--------|-------|
| Firecrawl scraping | Scaffolded | API integration exists. Rate limiting implemented. Content cleaning partial. |
| File ingestion (PDF, DOCX, images) | Built | Production. tree-sitter AST for code files. |
| Content cleaning | Scaffolded | Boilerplate removal. Markdown normalization. Needs more patterns. |
| SHA deduplication | Built | Production. Prevents duplicate ingestion. |
| Triplet construction | Designed | Positive pairs from strong edges. Hard negative mining from clusters. |
| Hard negative mining | Designed | SBERT similarity ranking for selecting informative negatives. |
| SBERT fine-tuning | Designed | Domain adaptation via triplet loss. Modal GPU dispatch. |
| BM25 index tuning | Unstarted | Adjust k1/b parameters from engagement signals. |
| Evaluation (P@k, MRR) | Designed | Held-out pairs for retrieval quality measurement. |
| Corpus NLI (batch) | Designed | Run NLI scoring across full corpus on Modal. |
| Training data review | Unstarted | Human review of generated triplets before training. |

## Operational Interpretation

**What this means for day-to-day work:**

- **Built** capabilities are reliable. Write code that depends on them.
- **Scaffolded** capabilities have partial implementations. Read the existing code before extending. Expect incomplete edge cases.
- **Designed** capabilities have specifications (in this product/ directory or in patterns/). Implementation can start from the spec.
- **Unstarted** capabilities need design work before implementation. Use `/reason` or `/encode` workflows to design them.

**Priority sequence:** The epistemic stack builds bottom-up. /reason (claim extraction) feeds /graph (structure detection), which feeds /encode (method compilation), which feeds /gather (training data). Upstream capabilities must be solid before downstream ones work well.
