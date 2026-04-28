# Engine Transition Plan: Level 1 to Level 2

> Additive migration strategy that introduces learned scoring without breaking existing behavior.

## Current State (Level 1)

Seven engine passes combine via fixed weights to score candidate connections.
All passes run in both `engine.py` (stateful, post-capture) and
`compose_engine.py` (stateless, write-time). Production (Railway) uses
spaCy + BM25 + TF-IDF only. Local/Dev uses all seven passes with PyTorch.

IQ composite: ~31/100. Discovery axis limited by domain-blind fixed weights.

## Target State (Level 2)

Same seven passes, but the combination formula is learned from user feedback.
A GradientBoostingClassifier replaces fixed weights when sufficient training
data exists. The system gets smarter as users interact with it.

## Migration Strategy

**Principle: additive, no breaking changes.**

No existing model fields change. No existing API contracts change. No existing
engine passes are removed or reordered. The learned scorer is added as a new
layer on top of the existing pipeline.

### Step 1: New model (no engine changes)

Add `ConnectionFeedback` model to `apps/notebook/models.py`. Run migration.
Register in admin. The model captures feedback events but nothing consumes
them yet. Zero risk to existing behavior.

### Step 2: Feedback capture (no scoring changes)

Wire signal handlers for edge clicks, dismissals, manual edge creation.
Add web validation background task. Feature vectors are computed and stored
but not used for scoring. Engine behavior unchanged.

### Step 3: Scorer training (offline only)

`train_scorer` management command trains the model offline. Produces a
joblib-serialized model file. RQ task for periodic retraining. No engine
integration yet. Evaluate via cross-validation metrics only.

### Step 4: Engine integration (with graceful degradation)

Modify `engine.py` to call the learned scorer after all passes complete.
Graceful degradation ensures zero behavior change when no trained model
exists. Three thresholds: <50 labels (fixed only), 50-200 (blend), 200+ (model).

## ConnectionFeedback Model

<!-- Finalize field names during implementation -->

```
ConnectionFeedback:
    edge           FK -> Edge (nullable for dismissed candidates)
    from_object    FK -> Object
    to_object      FK -> Object
    label          enum: clicked | dismissed | manual | web_validated
    feature_vector JSONField (snapshot at feedback time)
    notebook       FK -> Notebook
    created_at     DateTimeField
    metadata       JSONField (optional: session context, query context)
```

## Feature Vector Construction

Constructed at feedback time (not retroactively) to capture the state of
the engine when the feedback occurred. Two-mode aware: features from
unavailable passes are set to null/default, not omitted.

See `level2-spec.md` for the full feature table.

## Scorer Integration Points

**`engine.py`** (stateful): After pass 7 completes, construct feature vectors
for all candidate pairs. If trained model exists and label count exceeds
threshold, replace fixed-weight combination with model prediction. Fall back
to fixed weights on any error.

**`compose_engine.py`** (stateless): Same pattern. Load model from disk at
startup. Inference only, no training. Feature vectors constructed from
available passes (may be fewer than in engine.py).

## Rollback Plan

- Model file is versioned (timestamped filename)
- `engine_config` flag: `use_learned_scorer: true/false`
- Setting to false immediately reverts to fixed weights
- No data migration needed for rollback (ConnectionFeedback persists regardless)
- Previous model versions retained for comparison

## A/B Testing Strategy

<!-- Design when approaching L2-4 -->

- Per-Notebook `engine_config` allows different Notebooks to use different scoring
- Compare IQ scores between learned-scorer Notebooks and fixed-weight Notebooks
- Minimum test duration: 2 weeks with active usage
- Success: Discovery axis improvement with no regression on other axes

## Two-Mode Considerations

| Mode | Scorer Behavior |
|------|----------------|
| PRODUCTION (Railway) | Fixed weights only. No PyTorch, no model inference. |
| LOCAL/DEV | Learned scorer active if trained model exists. Full feature vector. |
| MODAL (GPU) | Batch retraining. Export model for LOCAL/DEV consumption. |

The learned scorer uses scikit-learn (GradientBoostingClassifier) or LightGBM,
not PyTorch. This means it *could* run in production mode, but deployment
should wait until the model is validated in LOCAL/DEV.
