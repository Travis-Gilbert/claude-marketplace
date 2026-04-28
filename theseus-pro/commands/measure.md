---
description: "Intelligence measurement -- IQ tracking across 7 axes, benchmarking, trend analysis, sensitivity analysis, leverage identification."
argument-hint: "describe the measurement task"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Agent
---

# /measure — Intelligence Measurement Command

IQ tracking, axis scoring, benchmarking, trend analysis, and
identifying the highest-leverage improvement opportunities.

## Agents Loaded

- information-retrieval (Precision@10, MRR metrics for Retrieval axis)
- graph-theory (modularity, community quality for Organization axis)
- self-organization (loop activity metrics for Learning axis)
- learned-scoring (scorer accuracy, feature importance for Learning axis)
- reinforcement-learning (reward trends, policy improvement for Learning axis)
- systems-theory (sensitivity analysis, bottleneck identification)
- domain-specialization (per-domain IQ breakdown, domain pack evaluation)

## The Seven IQ Axes

| Axis | Weight | What It Measures |
|------|--------|-----------------|
| Discovery (0.20) | Precision@10, novel discovery rate, cross-notebook connections, web validation rate |
| Organization (0.15) | Auto-cluster accuracy, entity promotion precision, type inference accuracy |
| Tension (0.15) | Tension precision and recall, NLI accuracy on domain-specific pairs |
| Lineage (0.10) | Provenance completeness, SHA chain integrity, claim lifecycle coverage |
| Retrieval (0.15) | Search MRR@10, compose engine relevance, query response time |
| Ingestion (0.10) | Format coverage, extraction quality, batch throughput, web crawl success |
| Learning (0.15) | Scorer improvement, edge evolution rate, feedback volume, self-labeling rate |

Current composite: ~31/100

## Typical Workflows

### Run a full IQ assessment
1. Execute `python3 manage.py iq_report`
2. Review per-axis scores
3. systems-theory: identify bottleneck axis (lowest score)
4. domain-specialization: break down per cluster if relevant

### Before/after comparison for a feature launch
1. Run IQ Tracker (baseline)
2. Ship the feature
3. Run IQ Tracker again
4. Compare: which axes improved? Which degraded?
5. systems-theory: was the tradeoff worthwhile?

### Sensitivity analysis of a parameter change
1. systems-theory: vary the parameter by +/- 10%
2. Run IQ Tracker at each setting
3. Graph: IQ vs parameter value
4. Identify: is the relationship linear, threshold, or nonexistent?

### Identify highest-leverage improvement
1. Run IQ Tracker for current state
2. For each axis: what is the gap to target?
3. For each gap: what feature or fix would close it?
4. Rank by: (gap_size * axis_weight) / estimated_effort
5. The top item is the highest-leverage improvement

### Track IQ over time
1. Weekly automated IQ runs via RQ cron
2. Store as IQSnapshot time series
3. Visualize as radar chart (7 axes) with historical overlay
4. Annotate with feature launch dates
5. Watch for: sustained uptrends (good), sudden drops (investigate), plateau (new bottleneck)

## Key Files

- `apps/notebook/management/commands/iq_report.py` (to build)
- `apps/notebook/models.py IQSnapshot` (to build)
- `apps/notebook/scheduling.py` (weekly cron)
- `apps/notebook/tasks.py` (IQ measurement RQ task)

## The IQ Model

```python
class IQSnapshot(models.Model):
    measured_at = models.DateTimeField(auto_now_add=True)
    discovery = models.FloatField()
    organization = models.FloatField()
    tension = models.FloatField()
    lineage = models.FloatField()
    retrieval = models.FloatField()
    ingestion = models.FloatField()
    learning = models.FloatField()
    composite = models.FloatField()
    raw_metrics = models.JSONField()
    object_count = models.IntegerField()
    edge_count = models.IntegerField()
    notebook_count = models.IntegerField()
    feedback_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-measured_at']
```
