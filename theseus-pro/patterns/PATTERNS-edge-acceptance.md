# PATTERNS-edge-acceptance.md

## PA1-PA4 Edge Acceptance Lifecycle

### What This Pattern Covers

Moving edges from proposed to accepted/contested/retracted. How
acceptance_status integrates with epistemic_weight in retrieval and
reasoning.

### The Lifecycle

```
Engine proposes edge (acceptance_status = 'proposed', weight = 0.5)
  |
  v
Acceptance criteria evaluated:
  Multi-signal: 2+ independent signals confirm -> 'accepted' (1.0)
  High confidence: scorer confidence > 0.85 -> 'accepted' (1.0)
  Web validated: web evidence confirms -> 'accepted' (1.0)
  Human review: user confirms -> 'accepted' (1.0)
  |
  v
If tension detected between edges:
  Both -> 'contested' (0.3)
  |
  v
If contradicted by stronger evidence:
  -> 'retracted' (0.0)
```

### Backfilling Existing Edges

```bash
# Step 1: Classify existing 100K edges
python manage.py backfill_edge_acceptance --dry-run
# Reports: how many would be accepted, remain proposed, etc.

# Step 2: Apply
python manage.py backfill_edge_acceptance
# Criteria:
# - Multi-signal edges (signal_groups >= 2): accepted
# - Single-signal + high RRF: proposed (needs validation)
# - Single-signal + low RRF: proposed (low priority)
```

### Auto-Accept Qualifying Edges

```bash
# Run periodically to accept edges that meet criteria
python manage.py accept_edges --limit 500
# Checks: signal count, scorer confidence, web validation status
# Only promotes edges that meet ALL criteria
```

### Integration with Retrieval

```python
# In unified_retrieval.py, weight by acceptance status:
def get_epistemic_weight(edge):
    weights = {
        'accepted': 1.0,
        'proposed': 0.5,
        'contested': 0.3,
        'retracted': 0.0,
    }
    return weights.get(edge.acceptance_status, 0.5)
```

### Integration with Evidence Assembly

```python
# In evidence_assembly.py, source quality incorporates edge acceptance:
def edge_quality_contribution(edge):
    return edge.epistemic_weight * edge.rrf_score
# Accepted edges contribute full signal. Proposed edges contribute half.
# Contested edges contribute 30%. Retracted edges are invisible.
```

### Agents Involved

1. formal-epistemology: acceptance criteria justification
2. learned-scoring: confidence thresholds
3. active-learning: which edges to prioritize for validation
4. web-acquisition: web validation for acceptance promotion
