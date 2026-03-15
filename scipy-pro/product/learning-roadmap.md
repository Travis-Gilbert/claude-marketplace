# Learning Roadmap

Staged rollout for research_api's learning capabilities. Each stage builds on the previous one. They must be implemented in order because later stages depend on signals produced by earlier ones.

## Overview

```
Stage 1: Retrieval Learning     (improve search from engagement)
    |
    v
Stage 2: Knowledge Learning     (update world model from review events)
    |
    v
Stage 3: Model Training         (fine-tune ML models for extraction/classification)
```

---

## Stage 1: Retrieval Learning

**Goal:** Improve BM25 and SBERT ranking from user engagement signals.

### What It Does

When users interact with search results (click, cite, promote, ignore), those signals feed back into retrieval scoring. Objects that are frequently useful get ranked higher. Objects that are consistently ignored get ranked lower.

### Engagement Signals

| Signal | Source | Weight | Interpretation |
|--------|--------|--------|----------------|
| Click-through | User clicks a search result | +0.1 | Mild interest |
| Citation | User creates an Edge referencing the result | +0.5 | Strong relevance |
| Promotion | Result's claims get promoted to canonical | +1.0 | Confirmed value |
| Ignore | Result appears in top-10 but user doesn't interact | -0.05 | Possible irrelevance |
| Edit after finding | User modifies an Object after searching for it | +0.3 | Found and used |

### Implementation Plan

1. **Event tracking**: Log retrieval events with query, results, and user actions
2. **Score accumulation**: Maintain per-object relevance scores that accumulate from engagement
3. **BM25 boosting**: Multiply BM25 scores by a learned relevance factor
4. **SBERT re-ranking**: Use engagement-weighted re-ranking as a third fusion signal alongside BM25 and SBERT

### BM25 Adaptation

Adjust BM25 parameters per notebook based on engagement patterns:

```
k1_adjusted = k1_base + alpha * (avg_doc_length / median_doc_length - 1)
b_adjusted  = b_base + beta * term_length_sensitivity
```

Where `alpha` and `beta` are learned from click-through data. This adapts BM25 to the specific vocabulary characteristics of each notebook.

### Prerequisites

- Search event logging infrastructure (RQ task to record events)
- Engagement tracking on the UI (click, ignore, cite events)
- Per-notebook relevance score storage

### Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| MRR (Mean Reciprocal Rank) | 0.45 | 0.65 | Held-out query-result pairs |
| P@5 | 0.60 | 0.75 | Manual relevance judgments |
| Time to find | ~30s avg | ~15s avg | User session timing |
| Zero-result rate | 8% | 3% | Queries returning no results |

### Dependencies

- Built: BM25 index, SBERT embeddings, search API
- Needed: Event logging, engagement tracking UI, relevance score storage

---

## Stage 2: Knowledge Learning

**Goal:** Update the world model when review and revision events indicate that existing knowledge has changed.

### What It Does

When a human reviews a claim and modifies it, the system learns that the original extraction was wrong in a specific way. When a tension is resolved, the system learns which interpretation prevailed. These events update the epistemic model.

### Learning Events

| Event | Signal | Effect |
|-------|--------|--------|
| Claim modified during review | The extraction was partially wrong | Update extraction confidence; train on corrected version |
| Claim rejected during review | The extraction was entirely wrong | Negative training signal for the extractor |
| Tension resolved (A wins over B) | One claim supersedes another | Update Edge strengths; adjust model assumptions |
| Method compilation approved | Procedural knowledge correctly encoded | Positive signal for compilation rules |
| Entity merged | Two entities were actually the same | Update NER patterns; merge edges |
| Edge strength manually adjusted | Automated scoring was miscalibrated | Recalibrate scoring parameters |

### World Model Updates

The world model consists of:

1. **Canonical claims**: The set of promoted claims forms the ground truth
2. **Edge confidence**: Learned weights on how strong each connection is
3. **Entity resolution**: Which names refer to the same entity
4. **Model assumptions**: What each EpistemicModel assumes to be true

When learning events occur:

```
review_event(claim_modified) ->
  1. Record the original and modified versions
  2. Compare: what changed? (factual correction? scope narrowing? rephrasing?)
  3. If factual correction:
     - Update all edges involving this claim
     - Check for cascading tensions
     - Re-score related claims' confidence
  4. If scope narrowing:
     - Add condition to the claim
     - Create new edges reflecting the narrower scope
```

### Prerequisites

- Promotion pipeline fully operational (Stage 4-5 in promotion-pipeline.md)
- PromotionEvent audit trail capturing all review decisions
- EpistemicModel records with explicit assumptions
- Tension resolution workflow

### Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Extraction accuracy | 72% | 85% | Claims accepted without modification |
| Tension detection precision | 60% | 80% | Detected tensions confirmed by reviewers |
| Entity resolution accuracy | N/A | 90% | Merged entities validated by reviewers |
| Model assumption validity | N/A | 70% | Assumptions not contradicted within 30 days |

### Dependencies

- Stage 1 complete (retrieval learning provides engagement context)
- Built: Promotion pipeline, PromotionEvent audit trail
- Needed: Tension resolution workflow, EpistemicModel assumption tracking

---

## Stage 3: Model Training

**Goal:** Fine-tune ML models for extraction and classification using accumulated review data.

### What It Does

After Stages 1 and 2 accumulate enough reviewed examples, those examples become training data for the ML models that perform extraction, classification, and scoring.

### Models to Train

| Model | Purpose | Training Data Source | Dispatch |
|-------|---------|---------------------|----------|
| SBERT (domain) | Semantic similarity for retrieval | Triplets from graph edges | Modal GPU |
| CrossEncoder NLI | Claim contradiction detection | Reviewed tension pairs | Modal GPU |
| Claim extractor | Extract claims from text | Reviewed claim modifications | Modal GPU |
| Entity classifier | Classify entity types | Promoted entities with types | Local/Modal |
| Edge predictor | Predict likely edges | Confirmed edges + negatives | Modal GPU |

### Training Data Requirements

Minimum data thresholds before training is useful:

| Model | Min Examples | Min Reviewed | Estimated Time to Accumulate |
|-------|-------------|-------------|------------------------------|
| SBERT domain | 500 triplets | 200 positive pairs | 2-4 weeks of active use |
| CrossEncoder NLI | 200 tension pairs | 100 resolved tensions | 4-8 weeks |
| Claim extractor | 1000 claim examples | 500 reviewed claims | 2-4 weeks |
| Entity classifier | 300 entities | 200 promoted entities | 3-6 weeks |
| Edge predictor | 500 edge examples | 300 confirmed edges | 2-4 weeks |

### Training Pipeline

1. **Data collection**: Query PromotionEvents for reviewed/promoted items since last training
2. **Data preparation**: Convert to training format (triplets, pairs, sequences)
3. **Quality filter**: Remove ambiguous examples (reviewer disagreements, deferred items)
4. **Training dispatch**: Queue Modal GPU job with training data and model checkpoint
5. **Evaluation**: Run on held-out test set, compare to previous model version
6. **Deployment decision**: If metrics improve, update the active model. If not, discard.

### Modal GPU Dispatch

Training runs on Modal serverless GPUs:

```
modal_job = {
    "function": "train_sbert_domain",
    "gpu": "A10G",
    "timeout_minutes": 60,
    "inputs": {
        "base_model": "all-MiniLM-L6-v2",
        "triplets_path": "s3://research-api/training/triplets_v3.json",
        "checkpoint_path": "s3://research-api/models/sbert-domain-v2/",
        "config": {
            "epochs": 3,
            "batch_size": 32,
            "learning_rate": 2e-5
        }
    },
    "outputs": {
        "model_path": "s3://research-api/models/sbert-domain-v3/",
        "eval_results": "s3://research-api/eval/sbert-domain-v3.json"
    }
}
```

### Evaluation Protocol

Every trained model is evaluated before deployment:

1. **Held-out test set**: 20% of reviewed examples reserved for evaluation
2. **Metrics**: P@k, MRR for retrieval; F1 for classification; accuracy for NLI
3. **Regression check**: New model must not degrade on any metric by more than 2%
4. **A/B comparison**: When possible, show both old and new model results to reviewers

### Prerequisites

- Stage 1 complete (retrieval learning provides engagement data for SBERT training)
- Stage 2 complete (knowledge learning provides reviewed examples for all models)
- Modal GPU infrastructure configured
- Model versioning and checkpoint storage (S3 or equivalent)

### Success Metrics

| Metric | Baseline (generic model) | Target (domain-tuned) | Measurement |
|--------|------------------------|-----------------------|-------------|
| SBERT retrieval MRR | 0.65 (from Stage 1) | 0.80 | Held-out pairs |
| NLI contradiction F1 | 0.70 | 0.85 | Resolved tension pairs |
| Claim extraction accuracy | 85% (from Stage 2) | 92% | Reviewed claims |
| Entity classification F1 | N/A | 0.88 | Promoted entities |
| Edge prediction AUC | N/A | 0.85 | Confirmed edges |

### Dependencies

- Stages 1 and 2 complete
- Built: Modal integration, SBERT fine-tuning pipeline
- Needed: Model versioning, checkpoint storage, A/B evaluation framework

---

## Cross-Stage Dependencies

```
                    Event Logging
                         |
                         v
              +---------------------+
              | Stage 1: Retrieval  |  <- needs: search events, engagement tracking
              | Learning            |  -> produces: improved rankings, relevance scores
              +---------------------+
                         |
                         v
              +---------------------+
              | Stage 2: Knowledge  |  <- needs: promotion pipeline, audit trail
              | Learning            |  -> produces: corrected claims, resolved tensions
              +---------------------+
                         |
                         v
              +---------------------+
              | Stage 3: Model      |  <- needs: 500+ reviewed examples, Modal GPU
              | Training            |  -> produces: domain-tuned ML models
              +---------------------+
```

## Timeline Estimate

| Stage | Start Condition | Duration | Cumulative |
|-------|----------------|----------|------------|
| Stage 1 | Search events logged, engagement tracking live | 2-3 weeks dev + 2 weeks data | ~5 weeks |
| Stage 2 | Promotion pipeline live, 100+ reviewed items | 3-4 weeks dev + 4 weeks data | ~14 weeks |
| Stage 3 | 500+ reviewed examples, Modal configured | 2-3 weeks dev + ongoing | ~19 weeks |

Active usage accelerates data accumulation. A single researcher reviewing 20 items per day reaches Stage 3 data thresholds in approximately 5-6 weeks of active use.
