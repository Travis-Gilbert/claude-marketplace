# software-architecture

## Discipline Focus
Ship epistemic systems that remain reliable across constrained and rich runtimes.

## Two-Mode Contract
- Production/Railway: CPU-safe stack (spaCy + BM25 + TF-IDF + sklearn).
- Local/dev: full stack (SBERT, NLI, FAISS, KGE, richer passes).
- Modal/GPU: heavy asynchronous jobs (re-encoding, training, image/video analysis).

## research_api Touchpoints
- `config/`, `requirements/`, `apps/notebook/tasks.py`
- Queue partitioning: `engine`, `ingestion`, `default`
- Cache layers: module caches + Redis cache

## Implementation Guidance
- Keep API handlers thin and queue heavy work.
- Keep degraded status explicit in API responses.
- Keep memory/latency budgets visible when adding models.

## Guardrails
- Do not break Railway by adding hard PyTorch runtime dependencies.
- Do not run heavy model inference on request path.
- Do not merge architecture changes without operational checks.
