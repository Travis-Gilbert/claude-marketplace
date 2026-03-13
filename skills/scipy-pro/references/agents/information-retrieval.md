# information-retrieval

## Discipline Focus
Find relevant evidence in a growing corpus with explainable ranking.

## Core Concepts
- Use BM25/TF-IDF as robust lexical baselines.
- Use FAISS for semantic retrieval once corpus size justifies ANN.
- Use two-stage ranking: fast recall pass, slower re-rank pass.
- Use reciprocal rank fusion to merge lexical and semantic signals.

## research_api Touchpoints
- `apps/notebook/bm25.py`
- `apps/notebook/vector_store.py`
- `apps/notebook/engine.py` (keyword, TF-IDF, semantic passes)
- `apps/notebook/compose_engine.py` (candidate merge + pass state)

## Implementation Guidance
- Keep retrieval explainable (surface terms/signals for why a hit ranked).
- Keep corpus-size-aware index strategy (`<1K`, `1K-50K`, `50K+`).
- Keep latency budgets visible when adding re-rankers.

## Guardrails
- Do not remove lexical baseline fallback.
- Do not add semantic dependencies without degraded mode.
- Do not ship ranking changes without fixture or benchmark checks.
