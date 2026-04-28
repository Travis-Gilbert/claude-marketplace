# PATTERNS-learned-scorer.md

How to build and integrate the Level 2 learned connection scorer.

## Build Sequence

### Batch L2-1: Feedback Capture (no engine changes)

```
1. Add ConnectionFeedback model to apps/notebook/models.py
   - from_object, to_object, feature_vector (JSON), label, label_strength
   - unique_together on (from_object, to_object, label)

2. Create and run migration

3. Register in admin.py
   - List display: from_object, to_object, label, label_strength, created_at
   - Filters: label, created_at

4. Add signal handlers in signals.py
   - post_save on Edge (if user-created): create 'manual' feedback
   - Custom signal for UI click events: create 'engaged' feedback
   - post_delete on Edge (if auto): create 'dismissed' feedback
   - Feature vector snapshot at event time (not reconstructed later)

5. Add web validation background task in tasks.py
   - For top 200 candidate connections, search web for co-occurrence
   - Create 'web_validated' or 'web_unvalidated' feedback
   - Run as RQ job, scheduled after each engine run
```

### Batch L2-2: Feature Vectors

```
1. New function: build_feature_vector(obj_a, obj_b) -> dict
   - Extract features from each pass:
     sbert_cosine, bm25_score, jaccard, shared_entity_count,
     shared_entity_types, nli_entailment, nli_contradiction,
     kge_prediction, same_type, same_notebook, time_gap_days,
     word_counts, edge_counts, shared_cluster, web_validation
   - Handle missing features (two-mode: some passes unavailable in prod)
     Use None/NaN for unavailable features, let the model handle it

2. Attach feature vector to every ConnectionFeedback record
   - Must be captured at the moment the connection is shown
   - Not reconstructed later (model parameters may have changed)

3. Verify feature completeness across different deployment modes
   - Production: ~7 features available (no SBERT, NLI, KGE)
   - Local: all ~17 features available
   - Train separate models for each mode, or train on the union
```

### Batch L2-3: Training Pipeline

```
1. New file: apps/notebook/learned_scorer.py

2. Training function: train_scorer()
   - Load all ConnectionFeedback records
   - Convert to feature matrix X, label vector y
   - Map labels: engaged/manual/web_validated -> 1.0
                  dismissed/ignored/web_unvalidated -> 0.0
   - Weight samples by label_strength
   - GradientBoostingClassifier with 5-fold cross-validation
   - Save model via joblib to LEARNED_SCORER_PATH
   - Log: accuracy, precision, recall, feature importances
   - Run IQ Tracker before/after

3. Management command: python3 manage.py train_scorer
   - Calls train_scorer() directly
   - Reports results to stdout

4. RQ task: periodic_train_scorer
   - Schedule weekly via scheduling.py
   - Only trains if feedback_count > last_training_count + 20
```

### Batch L2-4: Inference Integration

```
1. Inference function: score_connection(feature_vector) -> float
   - Load cached model (memory-cached with file mtime check)
   - Graceful degradation:
     count < 50:  return fixed_weight_score(feature_vector)
     count < 200: return 0.5 * model.predict_proba() + 0.5 * fixed
     count >= 200: return model.predict_proba()

2. Integrate into engine.py
   - After all passes complete, before edge creation
   - Replace the fixed-weight combination with score_connection()
   - Log both learned and fixed scores for debugging

3. Integrate into compose_engine.py
   - Same pattern, stateless inference only
   - No model training or feedback capture in compose path

4. A/B comparison
   - For first 2 weeks, run both fixed and learned in parallel
   - Log both scores for every connection
   - Compare engagement rates: learned vs fixed
   - Only switch to learned-only after proven improvement
```

## Critical Constraints

- Scikit-learn must work in Railway production (it does)
- Feature vectors are snapshots, not reconstructions
- Graceful fallback is non-negotiable
- Every training run triggers IQ Tracker before/after
- Two separate models may be needed: production (7 features) and local (17 features)
