# PATTERNS-iq-measurement.md

How to run, interpret, and act on IQ Tracker measurements.

## The Management Command

```bash
# Full IQ assessment
python3 manage.py iq_report

# Output format:
# ==========================================
# INDEX INTELLIGENCE REPORT - 2026-03-15
# ==========================================
#
# Discovery:     45/100  ████████████████████░░░░░░░░░░░░
# Organization:  15/100  ██████░░░░░░░░░░░░░░░░░░░░░░░░░
# Tension:       20/100  ████████░░░░░░░░░░░░░░░░░░░░░░░
# Lineage:       35/100  ██████████████░░░░░░░░░░░░░░░░░
# Retrieval:     50/100  ████████████████████░░░░░░░░░░░
# Ingestion:     55/100  ██████████████████████░░░░░░░░░
# Learning:       0/100  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
#
# COMPOSITE IQ:  31/100
#
# Top opportunity: Learning axis (0 -> 40 by shipping Level 2)
# Bottleneck: Organization axis (needs self-organizing layer)
```

## When to Run

- **Weekly**: automated via RQ cron (scheduling.py)
- **Before/after**: any feature launch
- **On demand**: after engine config changes
- **During optimization**: as fitness function for evolutionary search

## How Each Axis Is Scored

### Discovery (weight 0.20)
```python
precision_at_10 = evaluate_search_precision(test_queries, k=10)
novel_rate = edges_crossing_notebooks / total_auto_edges
web_validation_rate = web_validated_edges / total_auto_edges
score = 0.4 * precision_at_10 + 0.3 * novel_rate + 0.3 * web_validation_rate
```

### Organization (weight 0.15)
```python
cluster_accuracy = compare_auto_clusters_to_manual_notebooks()
promotion_precision = promoted_entities_confirmed / promoted_entities_total
type_accuracy = auto_classified_correct / auto_classified_total
score = 0.4 * cluster_accuracy + 0.3 * promotion_precision + 0.3 * type_accuracy
```

### Tension (weight 0.15)
```python
tension_precision = confirmed_tensions / detected_tensions
tension_recall = detected_tensions / known_contradictions
nli_accuracy = nli_correct_on_test_pairs / nli_total_test_pairs
score = 0.4 * tension_precision + 0.3 * tension_recall + 0.3 * nli_accuracy
```

### Lineage (weight 0.10)
```python
provenance_completeness = claims_with_source_chains / total_claims
sha_integrity = 1.0 if all_sha_chains_valid else 0.0
lifecycle_coverage = claims_with_status_changes / total_claims
score = 0.4 * provenance_completeness + 0.3 * sha_integrity + 0.3 * lifecycle_coverage
```

### Retrieval (weight 0.15)
```python
mrr_at_10 = mean_reciprocal_rank(test_queries, k=10)
compose_relevance = compose_clicks / compose_impressions
latency_score = max(0, 1 - (p95_latency_ms - 200) / 1800)  # 200ms=1.0, 2000ms=0.0
score = 0.4 * mrr_at_10 + 0.3 * compose_relevance + 0.3 * latency_score
```

### Ingestion (weight 0.10)
```python
format_coverage = supported_formats / total_formats
extraction_quality = avg_entities_per_doc + avg_claims_per_doc  # normalized
batch_throughput = docs_per_minute / target_docs_per_minute
score = 0.4 * format_coverage + 0.3 * extraction_quality + 0.3 * batch_throughput
```

### Learning (weight 0.15)
```python
scorer_improvement = (current_accuracy - last_accuracy) * 10  # scaled
edge_evolution = reinforced_edges / decayed_edges  # ratio, capped at 1.0
feedback_volume = log(feedback_count + 1) / log(target_count + 1)
score = 0.4 * scorer_improvement + 0.3 * edge_evolution + 0.3 * feedback_volume
```

## Interpreting Results

### Finding the Bottleneck
The lowest-scoring axis with the highest weight is the bottleneck:
```python
bottleneck = min(axes, key=lambda a: scores[a] * weights[a])
```

### Prioritizing Improvements
```python
priority = (target_score - current_score) * weight / estimated_effort
```
Highest priority = largest gap, highest weight, lowest effort.

## Storing Results

Every IQ run creates an IQSnapshot record for trend analysis:
```python
IQSnapshot.objects.create(
    discovery=scores['discovery'],
    organization=scores['organization'],
    # ... all axes ...
    composite=composite,
    raw_metrics=detailed_metrics,
    object_count=Object.objects.filter(is_deleted=False).count(),
    edge_count=Edge.objects.count(),
    notebook_count=Notebook.objects.count(),
    feedback_count=ConnectionFeedback.objects.count(),
)
```
