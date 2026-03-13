# Learning Roadmap

## Principle
Improve behavior in staged order to avoid brittle model-heavy jumps.

## Stage 1: Retrieval Learning
- Collect ranking feedback and engagement signals.
- Tune lexical/semantic blending and rerank thresholds.
- Track Precision@k, MRR, and latency impact.

## Stage 2: Knowledge Learning
- Learn from accepted/rejected promotion items.
- Update model confidence and contradiction weighting.
- Track review agreement and revision stability.

## Stage 3: Model Training
- Fine-tune extraction/classification/embedding models from curated data.
- Version datasets and model artifacts.
- Run offline and limited online evaluations before rollout.

## Guardrails
- Do not skip straight to training before retrieval and review loops stabilize.
- Do not train on unreviewed noisy labels by default.
- Do not deploy models without fallback behavior.
