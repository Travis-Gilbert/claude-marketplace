# PATTERNS-active-learning-loop.md

## Validate -> Train -> Evaluate -> Repeat

### What This Pattern Covers

The critical path from purged scorer to operational learned scoring.
Every step is an active learning decision.

### Phase 1: Cold Start (No Labels)

```bash
# Step 1: Select diverse initial batch
python manage.py validate_edges --strategy cold_start --limit 100

# cold_start strategy:
# - Stratify by edge_type (ensure all 23 types represented)
# - Stratify by RRF score tier (bottom/middle/top thirds)
# - Stratify by object_type pair (source-source, note-source, etc.)
# - Exclude entity-mediated edges (referential noise)
# - Target: 60% substantive-to-substantive, 40% cross-type
```

```bash
# Step 2: Run web validation on the batch
python manage.py validate_edges --execute --limit 100
# Each edge gets: web_validated, web_unvalidated, or web_inconclusive
# Expected yield: ~60% validated, ~25% unvalidated, ~15% inconclusive
```

### Phase 2: First Scorer Training

```bash
# Step 3: Rebuild feature vectors excluding poisoned features
python manage.py rebuild_feature_vectors --exclude word_count,edge_count,source_edge_count,target_edge_count

# Step 4: Train scorer on clean data
python manage.py train_scorer --cross-validate 5

# Step 5: Verify feature importances shifted
python manage.py scorer_report --include-evaluation
# CHECK: sbert_cosine should be > 0.10 (was 0.030)
# CHECK: word_count should be absent or < 0.05
```

### Phase 3: Warm Start (Uncertainty Sampling)

```bash
# Step 6: Select next batch using scorer uncertainty
python manage.py validate_edges --strategy uncertainty --limit 100 --diversity 0.3

# uncertainty strategy with diversity:
# - Score each unlabeled edge by scorer confidence distance from 0.5
# - Apply diversity constraint: k-medoids on feature vectors
# - lambda_diversity=0.3 balances informativeness and coverage
```

```bash
# Step 7: Validate and retrain
python manage.py validate_edges --execute --limit 100
python manage.py rebuild_feature_vectors --exclude word_count,edge_count
python manage.py train_scorer --cross-validate 5
```

### Phase 4: Stopping Criteria

```python
# After each retrain, check feature importance stability
importance_history = load_importance_history()  # list of numpy arrays
if len(importance_history) >= 3:
    prev = importance_history[-2]
    curr = importance_history[-1]
    cos_sim = np.dot(prev, curr) / (np.linalg.norm(prev) * np.linalg.norm(curr))
    if cos_sim > 0.95:
        print("STOP: Feature importances stabilized")
    else:
        print(f"CONTINUE: Cosine similarity = {cos_sim:.3f}")
```

Hard cap: 500 total validations. Start checking at batch 3 (150 labels).

### Expected Progression

| Batch | Labels | Expected F1 | Key Feature Changes |
|-------|--------|-------------|---------------------|
| 1 (cold) | 100 | 0.55-0.65 | sbert_cosine rises, word_count absent |
| 2 (uncertainty) | 200 | 0.65-0.72 | graph features rise |
| 3 (uncertainty) | 300 | 0.70-0.78 | stabilization begins |
| 4 (uncertainty) | 400 | 0.75-0.82 | near convergence |
| 5 (if needed) | 500 | 0.78-0.85 | hard cap |

### IQ Impact Tracking

```bash
# After each retrain cycle:
python manage.py iq_report --label "post-retrain-batch-N"
# Track: Discovery and Learning axes should improve
```

### Agents Involved

1. active-learning: selection strategy, batch diversity, stopping criteria
2. learned-scoring: feature vectors, training, evaluation
3. web-acquisition: SearXNG search execution
4. information-theory: feature redundancy analysis between batches
5. control-theory: retraining loop stability monitoring
