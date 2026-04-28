# IQ Tracker: Intelligence Measurement

> Quantify how smart the engine is across seven axes, track changes over time, and connect every engineering decision to measured intelligence.

## Purpose

The IQ Tracker is the fitness function for the entire Theseus roadmap. Every
level, every feedback loop, every parameter change is measured against these
seven axes. Without measurement, "the system got smarter" is a feeling.
With the IQ Tracker, it is a number.

Current composite score: ~31/100.

## Seven Axes

| Axis | Weight | Question It Answers |
|------|--------|-------------------|
| Discovery | 0.20 | Can it find real connections? |
| Organization | 0.15 | Can it structure knowledge without being told? |
| Tension | 0.15 | Can it find contradictions? |
| Lineage | 0.10 | Can it trace how knowledge evolved? |
| Retrieval | 0.15 | Can it find the right thing when asked? |
| Ingestion | 0.10 | Can it handle diverse inputs? |
| Learning | 0.15 | Does it get smarter over time? |

Weights sum to 1.00. Discovery is weighted highest because connection quality
is the engine's core value proposition.

## Measurement Methods

<!-- Detail the specific metrics and measurement procedures per axis -->

**Discovery (0.20)**
- Precision of surfaced connections vs human judgment
- Recall of connections humans create manually that the engine missed
- Web validation confirmation rate for top candidates

**Organization (0.15)**
- Community detection stability (do clusters make sense over time?)
- Auto-classification accuracy (Loop 1) vs human labels
- Cluster coherence score (intra-cluster similarity vs inter-cluster)

**Tension (0.15)**
- NLI contradiction detection precision
- Tensions surfaced that humans confirm vs false positives
- Coverage: what fraction of actual contradictions are caught?

**Lineage (0.10)**
- Provenance chain completeness (every object traces to origin)
- Temporal DAG accuracy (causal ordering matches reality)
- SHA-hash integrity (no orphaned or broken chains)

**Retrieval (0.15)**
- MRR (Mean Reciprocal Rank) for user queries
- Recall@k for known-relevant objects
- Response latency under two-mode constraints

**Ingestion (0.10)**
- File type coverage (PDF, DOCX, images, code, web)
- Extraction quality per modality
- Error rate on malformed inputs

**Learning (0.15)**
- IQ composite trend over time (is it going up?)
- Learned scorer improvement over fixed weights (after L2)
- Feedback loop closure rate (are loops producing measurable gains?)

## Composite Score Formula

```
IQ = sum(axis_score * axis_weight for each axis)
```

Each axis_score is 0-100. Composite is 0-100.

## Current Baseline

<!-- Update after each major measurement run -->

| Axis | Current Score | Notes |
|------|--------------|-------|
| Discovery | TBD | Fixed weights, no learned scoring |
| Organization | TBD | Louvain communities, basic auto-classify |
| Tension | TBD | NLI contradiction detection active |
| Lineage | TBD | Provenance + causal engine active |
| Retrieval | TBD | BM25 + SBERT (two-mode) |
| Ingestion | TBD | PDF, DOCX, images, code, web |
| Learning | TBD | No feedback loops closed yet |
| **Composite** | **~31** | **Estimated** |

## Reporting Format

Each IQ measurement produces a report with:
- Per-axis scores (0-100)
- Composite score
- Delta from previous measurement
- Per-axis breakdown of what improved/degraded and why
- Recommended next action (which axis has most opportunity?)

## Integration with Engine Changes

Invariant 14: "The IQ Tracker measures every change."

Before any engine change: run IQ measurement (baseline).
After any engine change: run IQ measurement (comparison).
Report: delta per axis, composite delta, and whether any axis regressed.

The IQ Tracker is the acceptance test for every level transition.
