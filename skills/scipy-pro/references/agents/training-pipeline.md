# training-pipeline

## Discipline Focus
Improve retrieval and extraction quality from accumulated interaction data.

## Core Concepts
- Build triplets from support/contradiction and cluster separation.
- Use active learning on uncertain NLI boundaries.
- Fine-tune embeddings after retrieval and knowledge loops are stable.
- Evaluate with ranking metrics and human judgment, not anecdote.

## research_api Touchpoints
- `apps/notebook/engine.py` outputs (claim and edge signals)
- `apps/notebook/vector_store.py` (embedding indexes)
- `scripts/train_kge.py` (structural learning)

## Learning Order (from transition plan)
1. Retrieval learning.
2. Knowledge learning.
3. Model training.

## Guardrails
- Do not train on unreviewed noisy labels without filtering.
- Do not deploy tuned models without offline/online quality checks.
- Do not hide model version and dataset lineage.
