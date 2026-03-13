---
name: scipy-pro
description: Epistemic engineering skill for building, debugging, and evolving Index/CommonPlace/research_api from a graph-centered notebook into an epistemic engine. Use when tasks involve evidence intake, claim extraction, contradiction or tension analysis, model comparison, method DSL and execution, promotion pipelines, domain packs, retrieval/embedding/NLI tuning, self-organization loops, or two-mode (Railway vs local/dev) architecture decisions.
---

# SciPy Pro v4

## Prime Directive
- Read live source before writing code.
- Read `refs/` or local framework source before trusting memory for library behavior.
- Treat specs as intent; reconcile with current implementation before editing.

## Route by Workflow
1. Run `/reason` for text-to-claim reasoning work.
- Use for claim decomposition, NLI, contradiction detection, epistemic status, and question/model evidence graphs.
- Read `references/routing.md`, then `references/agents/claim-analysis.md`, `references/agents/nlp-pipeline.md`, and `references/agents/knowledge-representation.md`.

2. Run `/graph` for structure and lineage work.
- Use for community detection, gap analysis, influence DAGs, resurfacing, and self-organization loops.
- Read `references/routing.md`, then `references/agents/graph-theory.md`, `references/agents/causal-inference.md`, and `references/agents/self-organization.md`.

3. Run `/encode` for executable-knowledge work.
- Use for promotion queue, method DSL, method compilation, method runs, and provenance-safe automation.
- Read `references/routing.md`, then `references/agents/program-synthesis.md`, `references/agents/knowledge-representation.md`, and `references/patterns/PATTERNS-promotion.md`.

4. Run `/gather` for corpus and learning work.
- Use for Firecrawl/web ingestion, training corpus construction, triplet generation, SBERT/KGE training, and retrieval evaluation.
- Read `references/routing.md`, then `references/agents/web-acquisition.md`, `references/agents/training-pipeline.md`, and `references/patterns/PATTERNS-firecrawl-corpus.md`.

## Always Enforce These Invariants
- Keep `Edge.reason` plain English.
- Use `Edge.from_object` and `Edge.to_object`.
- Keep timeline history append-only.
- Keep objects soft-deleted (`is_deleted=True`) instead of hard delete.
- Keep SHA lineage and provenance intact.
- Keep `compose_engine.py` stateless.
- Keep `engine.py` stateful for persisted graph mutations.
- Keep LLM output reviewable; do not auto-promote machine suggestions to canon.

## Keep Two-Mode Deployment Safe
- Keep production/Railway operational without PyTorch-only features.
- Keep local/dev free to use full NLP stack (SBERT, NLI, FAISS, KGE).
- Dispatch heavy batch jobs to workers or Modal.
- Degrade gracefully instead of failing a full pipeline when advanced features are unavailable.

## Use Transition-Plan References
- Read `references/product/epistemic-status.md` for built vs planned capabilities.
- Read `references/product/promotion-pipeline.md` for `captured -> learned_from` flow.
- Read `references/product/method-dsl-design.md` for executable-knowledge boundaries.
- Read `references/product/domain-pack-spec.md` for pack-level architecture.
- Read `references/product/learning-roadmap.md` for staged learning rollout.

## Delivery Checklist
1. Reconcile code vs spec and state mismatches explicitly.
2. Implement smallest safe slice that preserves invariants.
3. Add or update tests/fixtures for new behavior.
4. Validate runtime and degradation paths.
5. Report using:
- Initial condition
- Reconciliation findings
- Changes made
- Validation performed
- Remaining issues / next steps
