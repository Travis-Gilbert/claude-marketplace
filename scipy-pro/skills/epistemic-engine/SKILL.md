---
name: epistemic-engine
description: >-
  Use when tasks involve the research_api epistemic engine: evidence intake,
  claim extraction, contradiction or tension analysis, model comparison,
  method DSL and execution, promotion pipelines, domain packs,
  retrieval/embedding/NLI tuning, self-organization loops, or two-mode
  (Railway vs local/dev) architecture decisions. Loads routing, invariants,
  and reference pointers for the epistemic stack.
---

# Epistemic Engine

## Prime Directive

Read live source before writing code. Read `refs/` for library internals.
Read the research_api codebase for application patterns. Do not rely on
training data for either. Treat specs as intent; reconcile with current
implementation before editing.

## Route by Workflow

1. `/reason` — text -> claims -> tensions -> models (NLP, NLI, KR).
   Load agents: claim-analysis, nlp-pipeline, knowledge-representation,
   information-retrieval, probabilistic-reasoning.

2. `/graph` — objects -> structure -> self-organization (graph theory, causal).
   Load agents: graph-theory, causal-inference, self-organization,
   knowledge-representation, probabilistic-reasoning.

3. `/encode` — evidence -> methods -> runs -> learning (DSL, compilation).
   Load agents: program-synthesis, knowledge-representation, claim-analysis,
   causal-inference, software-architecture.

4. `/gather` — web -> corpus -> training data -> evaluation (Firecrawl, SBERT).
   Load agents: web-acquisition, training-pipeline, information-retrieval,
   nlp-pipeline, software-architecture.

## Invariants (Always Enforce)

1. `Edge.reason` is plain-English, human-readable.
2. `Edge` uses `from_object` / `to_object` (not source/target).
3. Timeline Nodes are immutable (except `retrospective_notes`).
4. SHA-hash identity tracks provenance. Never bypass `_generate_sha()`.
5. Per-Notebook `engine_config` controls pass behavior.
6. Objects soft-delete only (`is_deleted=True`).
7. LLMs propose. Humans review. Nothing auto-promotes to canon.
8. `compose_engine` is stateless (text-in, objects-out, no DB writes).
9. `engine.py` is stateful (object-in, edges + nodes out).
10. Every epistemic primitive carries its provenance.

## Two-Mode Contract

- **PRODUCTION** (Railway): spaCy + BM25 + TF-IDF. No PyTorch.
- **LOCAL/DEV**: All 7 passes. PyTorch + FAISS + SBERT + NLI + KGE.
- **MODAL** (GPU): Batch re-encoding, KGE training, SAM-2, corpus NLI.

## Reference Pointers

- Patterns: `patterns/PATTERNS-*.md` for implementation recipes.
- Product: `product/*.md` for status, roadmap, and design specs.
- Examples: `examples/{reason,graph,encode,gather}/*.py` for code.
- Agents: `agents/*.md` for domain-specific CS expertise.

## Delivery Checklist

1. Reconcile code vs spec and state mismatches explicitly.
2. Implement smallest safe slice that preserves invariants.
3. Add or update tests/fixtures for new behavior.
4. Validate runtime and degradation paths.
5. Report: initial condition, reconciliation, changes, validation, next steps.
