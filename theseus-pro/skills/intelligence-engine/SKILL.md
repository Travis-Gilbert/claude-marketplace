---
name: intelligence-engine
description: >-
  Use when tasks involve the Theseus/Index-API intelligence stack:
  evidence intake, claim extraction, contradiction and tension analysis,
  learned scoring, GNN and temporal graph memory, KGE RotatE, SBERT
  enrichment, GL-Fusion, model-swarm routing, compound learning, IQ
  measurement, self-organization, symbolic/counterfactual reasoning, or
  two-mode Railway vs local deployment decisions. Loads command routing,
  invariants, and source-first execution rules for the full engine.
---

# Intelligence Engine

## Prime Directives

Read live source before writing code. Read `refs/` for library internals.
Read the Index-API codebase for application patterns. Do not rely on
training data for either. Treat specs as intent; reconcile with current
implementation before editing.

## Route by Workflow

1. `/reason` — text -> claims -> tensions -> models (NLP, NLI, KR).
   Load agents: claim-analysis, nlp-pipeline, knowledge-representation,
   information-retrieval, probabilistic-reasoning.

2. `/graph` — objects -> structure -> self-organization (graph, causal,
   GNN, temporal memory).
   Load agents: graph-theory, causal-inference, self-organization,
   knowledge-representation, probabilistic-reasoning, graph-neural-networks,
   temporal-graph-memory, systems-theory.

3. `/train` — features -> models -> evaluation -> adaptation (ML, RL,
   evolution, enrichment pipeline).
   Load agents: learned-scoring, training-pipeline, graph-neural-networks,
   temporal-graph-memory, language-model-training, multimodal-networks,
   reinforcement-learning, evolutionary-optimization, domain-specialization.

4. `/architect` — system design, feedback loops, pipeline optimization.
   Load agents: software-architecture, self-organization, program-synthesis,
   systems-theory, evolutionary-optimization, domain-specialization.

5. `/simulate` — hypotheses, debate, counterfactuals, belief revision.
   Load agents: claim-analysis, causal-inference, probabilistic-reasoning,
   multi-agent-reasoning, symbolic-reasoning, counterfactual-simulation,
   language-model-training, systems-theory, temporal-graph-memory.

6. `/measure` — IQ tracking across 7 axes, benchmarking, leverage analysis.
   Load agents: information-retrieval, graph-theory, self-organization,
   learned-scoring, reinforcement-learning, systems-theory, domain-specialization.

7. `/learn` — compound learning lifecycle.
   Save session log, run confidence updates, review auto-captured claims,
   resolve tensions, and process stale/low-confidence attention items.

## Compound Learning Rules

1. Treat `knowledge/claims.jsonl` as live operational memory for reusable
   practices.
2. Keep claim extraction imperative and actionable.
3. Use SHA-based deduplication for claim IDs.
4. Log sessions in `knowledge/session_log/` and run `/learn` after
   meaningful implementation or debugging sessions.
5. Apply claim confidence thresholds before overriding static guidance.

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
- **LOCAL/DEV**: All 7+ passes. PyTorch + FAISS + SBERT + NLI + KGE.
- **MODAL** (GPU batch): GNN training, KGE training, LoRA fine-tuning,
  corpus NLI, SAM-2, evolutionary optimization.

## Enrichment Pipeline Focus Areas

- EpiGNN extensions: HeterophilyAwareConv, ORC-weighted aggregation,
  two-state outputs.
- KGE RotatE: triple export, training, runtime scoring features,
  structural token generation.
- SBERT enrichment: triplet pipelines, fine-tuning, multi-view
  embeddings, graph-text alignment.
- GL-Fusion three-stream architecture: Stream A/B/C integration and
  gate variance checks by query type.
- Model swarm constraints: GPU-only hard fusion, CPU GGUF soft-fusion
  fallback, and internet mediation via validated Object ingestion.
- Network effects: private/shared/federated graph behavior and
  promotion-risk controls.

Use these pattern files when implementing the above:
- `patterns/PATTERNS-epignn.md`
- `patterns/PATTERNS-kge-rotate.md`
- `patterns/PATTERNS-sbert-enrichment.md`
- `patterns/PATTERNS-gl-fusion-three-stream.md`
- `patterns/PATTERNS-compound-learning.md`
- `patterns/PATTERNS-model-swarm.md`
- `patterns/PATTERNS-network-effects.md`

## Theseus Roadmap

| Level | Name | Status |
|-------|------|--------|
| 1 | Tool-Based Intelligence | Shipped |
| 2 | Learned Connection Scoring | Building |
| 3 | Hypothesis Generation | Designed |
| 4 | Emergent Ontology | Designed |
| 5 | Self-Modifying Pipeline | Designed |
| 6 | Multi-Agent Epistemic Reasoning | Designed |
| 7 | Counterfactual Simulation | Designed |
| 8 | Creative Hypothesis Generation | Designed |

## IQ Tracker (7 Axes)

Discovery (0.20), Organization (0.15), Tension (0.15), Lineage (0.10),
Retrieval (0.15), Ingestion (0.10), Learning (0.15).
Current composite: check live via `theseus_measure_iq` MCP tool.

## Reference Pointers

- Patterns: `patterns/PATTERNS-*.md` for implementation recipes.
- Product: `product/*.md` for specs, roadmap, and design docs.
- Examples: `examples/{train,simulate,measure,reason,graph}/*.py` for code.
- Agents: `agents/*.md` for domain-specific expertise (24 agents, 3 tiers).
- Knowledge memory: `knowledge/*.jsonl` and `knowledge/manifest.json`.

## Delivery Checklist

1. Reconcile code vs spec and state mismatches explicitly.
2. Implement smallest safe slice that preserves invariants.
3. Add or update tests/fixtures for new behavior.
4. Validate runtime and degradation paths.
5. Report: initial condition, reconciliation, changes, validation, next steps.
