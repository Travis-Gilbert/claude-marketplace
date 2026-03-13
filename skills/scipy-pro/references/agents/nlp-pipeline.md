# nlp-pipeline

## Discipline Focus
Extract structure from text (entities, claims, embeddings) with two-mode-safe NLP.

## Core Concepts
- Use spaCy for deterministic tokenization/NER.
- Use adaptive NER (PhraseMatcher) for graph-learned entity recall.
- Use SBERT for semantic embeddings.
- Use cross-encoders for NLI and high-fidelity pair scoring.

## research_api Touchpoints
- `apps/research/advanced_nlp.py`
- `apps/notebook/adaptive_ner.py`
- `apps/notebook/claim_decomposition.py`
- `apps/notebook/engine.py` passes 1, 5, and 6

## Implementation Guidance
- Keep every advanced feature behind availability checks.
- Keep extraction deterministic where possible before LLM fallback.
- Keep pass-level degraded status exposed to callers.

## Guardrails
- Do not couple production paths to PyTorch-only features.
- Do not hide fallback behavior from API responses.
- Do not mix ingestion parsing errors with extraction logic.
