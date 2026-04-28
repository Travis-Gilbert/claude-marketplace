# Level 2: Learned Connection Scoring

> Replace fixed combination weights with a trained model that learns which signal combinations indicate real connections.

## Problem Statement

Level 1 combines seven engine passes using hand-tuned weights. These weights
are domain-blind: the same formula scores philosophy connections and legal
connections identically. SBERT similarity might matter 3x more for legal
reasoning; NLI entailment might matter 3x more for philosophy. Fixed weights
cannot adapt.

## Solution: Gradient Boosted Tree Scorer

A GradientBoostingClassifier (scikit-learn) or LightGBM model that takes a
14-20 feature vector constructed from all seven engine passes and predicts
connection quality. The scorer replaces the *combination formula*, not the
individual passes. All seven passes still run.

Key architectural constraint: the scorer produces a signal alongside (not
instead of) the fixed-weight formula until sufficient training data exists.

## Build Sequence

**L2-1: ConnectionFeedback model + feedback capture**
- Add `ConnectionFeedback` to `apps/notebook/models.py`
- Fields: edge FK, label (clicked/dismissed/manual/web_validated), feature_vector (JSON), timestamp
- Signal handlers for user interactions
- Web validation background task for cold-start labels
- No engine changes yet

**L2-2: Feature vector construction**
- For each object pair, extract features from all passes
- Normalize and handle missing features (two-mode: some passes unavailable in production)
- Store as JSON in `ConnectionFeedback.feature_vector`

**L2-3: Training pipeline**
- `train_scorer` management command
- 5-fold cross-validation
- Log feature importances to engine metrics
- Save model via joblib
- RQ task for weekly retraining (`scheduling.py`)

**L2-4: Engine integration**
- `engine.py`: after all passes, construct feature vector, call scorer if trained
- `compose_engine.py`: same pattern, stateless inference only
- Graceful degradation (see below)

## Feature Vector

<!-- Finalize during L2-2 implementation. Target: 14-20 features. -->

| # | Feature | Source Pass | Type |
|---|---------|------------|------|
| 1 | SBERT cosine similarity | Semantic | float |
| 2 | BM25 score | Lexical | float |
| 3 | TF-IDF cosine | Lexical | float |
| 4 | NLI entailment score | NLI | float |
| 5 | NLI contradiction score | NLI | float |
| 6 | KGE triple score | KGE | float |
| 7 | Shared entity count | NER | int |
| 8 | Community co-membership | Community | bool |
| 9 | Structural hole bridge | Gap Analysis | bool |
| 10 | Temporal proximity (days) | Temporal | float |
| 11 | Object type pair | Metadata | categorical |
| 12 | Edge count (from_object) | Graph | int |
| 13 | Edge count (to_object) | Graph | int |
| 14 | Centrality difference | Graph | float |
| 15-20 | TBD (GNN embedding distance, temporal memory, etc.) | Future passes | -- |

## Training Labels

| Source | Label | Quality | Availability |
|--------|-------|---------|--------------|
| User clicks on surfaced edge | positive | High | Sparse early |
| User dismissals | negative | High | Sparse early |
| Manually created edges | strong positive | Highest | Very sparse |
| Web validation (Firecrawl) | positive/negative | Medium | Available at cold start |

## Graceful Degradation

| Label Count | Behavior |
|-------------|----------|
| < 50 | Fixed weights only. Scorer inactive. |
| 50 - 200 | 50/50 blend of fixed weights and model score. |
| 200+ | Model score only. Fixed weights as fallback on error. |

Invariant 11: "Learned models fall back gracefully to fixed weights when untrained."

## Cold Start Strategy

Before any user feedback exists, use web validation to bootstrap labels:
1. Engine identifies top-N candidate connections
2. Background RQ task sends each to Firecrawl for web validation
3. Web results scored as confirming/denying the connection
4. These become initial training labels

Target: 50+ web-validated labels before first model training.

## Success Criteria

- IQ Discovery axis improves measurably after L2 deployment
- Feature importances are interpretable and vary by cluster/domain
- Graceful degradation verified: system works identically with 0 labels
- No regression on any other IQ axis
- Two-mode contract preserved: scorer runs in LOCAL/DEV only (production uses fixed weights until model is validated)
