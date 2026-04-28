# PATTERNS-self-org-loop.md

How to add a feedback loop to self_organize.py using the 5-stage pipeline.

## Build Sequence

### Step 1: Define the 5-Stage Pipeline

Every loop in self_organize.py follows this structure:

```
detect -> propose -> threshold -> mutate -> timeline
```

1. **Detect**: Query the graph for a structural signal (e.g., entity frequency, community modularity)
2. **Propose**: Generate candidate mutations (new edges, notebooks, promotions)
3. **Threshold**: Apply dampening and minimum-confidence gates
4. **Mutate**: Execute the approved changes (create objects, edges, notebooks)
5. **Timeline**: Record the mutation as a Node on the master Timeline

### Step 2: Write the Loop Function

```python
# In self_organize.py

MY_LOOP_THRESHOLD = 0.6  # Module-level constant, tunable per notebook

def my_new_loop(notebook=None, process_record=None):
    """
    Loop N: <description of what the loop does>.
    """
    from .models import Edge, Node, Object, Timeline

    # 1. Detect
    candidates = _detect_my_signal(notebook)
    if not candidates:
        return []

    # 2. Propose
    proposals = _propose_mutations(candidates)

    # 3. Threshold (respect engine_config dampening)
    config = notebook.engine_config if notebook else {}
    loop_config = config.get('loops', {}).get('my_loop', {})
    if not loop_config.get('active', False):
        return []
    dampening = loop_config.get('dampening', 0.5)
    approved = [p for p in proposals if p['score'] * dampening >= MY_LOOP_THRESHOLD]

    # 4. Mutate
    results = _execute_mutations(approved)

    # 5. Timeline
    timeline = Timeline.objects.filter(is_master=True).first()
    for result in results:
        Node.objects.create(
            node_type='self_organization',
            title=f'Loop: {result["description"]}',
            timeline=timeline,
        )

    return results
```

### Step 3: Write a Preview Function

Every loop must have a dry-run preview that shows what it *would* do:

```python
def preview_my_loop(max_samples: int = 20) -> dict:
    """Preview what my_loop would do without executing mutations."""
    candidates = _detect_my_signal(notebook=None)
    proposals = _propose_mutations(candidates)
    return {
        'loop': 'my_loop',
        'candidates_detected': len(candidates),
        'proposals': [
            {'description': p['description'], 'score': p['score']}
            for p in proposals[:max_samples]
        ],
    }
```

### Step 4: Register in Orchestration

Add the loop to the periodic reorganization task in tasks.py:

```python
@django_rq.job('default', timeout=300)
def periodic_reorganize_task():
    from .self_organize import my_new_loop
    # Loops run sequentially, never in parallel
    results = my_new_loop()
    logger.info('my_loop produced %d mutations', len(results))
```

### Step 5: Add engine_config Entry

Register the kill switch and dampening coefficient:

```python
# Default engine_config template
"loops": {
    "my_loop": {"active": false, "dampening": 0.5}
}
```

### Step 6: Threshold Tuning

1. Start with `dampening: 0.5` and `active: false`
2. Run `preview_my_loop()` to inspect proposals
3. Enable for one notebook, monitor IQ variance for one week
4. If daily IQ variance exceeds 5%, reduce dampening by 0.1
5. Follow the protocol in PATTERNS-feedback-loop-control.md

## Critical Constraints

- Every loop must have a kill switch (`active` flag in engine_config)
- Every loop must have a dampening coefficient (0.0 to 1.0, never above 0.8)
- Every loop must have a preview function (dry-run, no side effects)
- Never enable two positive feedback loops simultaneously
- Mutations are recorded as Timeline Nodes (immutable audit trail)
- Use module-level constants for thresholds (not magic numbers inline)
- The 5-stage pipeline is not optional: detect/propose/threshold/mutate/timeline
