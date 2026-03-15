# Pattern: Self-Organization Feedback Loop

Self-organization loops let the graph restructure itself based on emergent
patterns. They run periodically (via RQ scheduler or post-engine) and
mutate the graph only when quality thresholds are met.

## The 5-Step Loop Structure

Every self-org loop follows the same structure:

```
Detection -> Proposal -> Threshold -> Mutation -> Cascade
```

### 1. Detection
Identify a pattern in the graph that warrants structural change.

```python
def _detect_<pattern>(notebook, config):
    """
    Scan the graph for <pattern>.

    Returns:
        list[dict]: Detected patterns with metadata.
        Each dict has: 'objects', 'evidence', 'confidence', 'description'
    """
    # Query graph structure
    # Compute pattern metrics
    # Return detected patterns above minimum confidence
```

### 2. Proposal
Generate a concrete structural change from the detected pattern.

```python
def _propose_<action>(detection, notebook, config):
    """
    Propose a structural change based on detected pattern.

    Returns:
        dict: Proposal with 'action', 'target', 'rationale', 'impact_estimate'
        or None if no action warranted.
    """
    # Determine what structural change makes sense
    # Estimate impact (how many objects/edges affected)
    # Return proposal dict or None
```

### 3. Threshold
Apply a minimum quality gate. This prevents noisy mutations.

```python
def _meets_threshold(proposal, config):
    """Check if proposal meets minimum quality for mutation."""
    min_confidence = config.get('<pattern>_min_confidence', 0.7)
    min_members = config.get('<pattern>_min_members', 3)

    return (
        proposal['confidence'] >= min_confidence
        and len(proposal['objects']) >= min_members
    )
```

### 4. Mutation
Apply the structural change. Only reached if threshold is met.

```python
def _apply_<mutation>(proposal, notebook, config, dry_run=False):
    """
    Apply structural change to graph.

    Args:
        dry_run: If True, return what would change without mutating.

    Returns:
        dict: Result with 'created', 'modified', 'description'
    """
    if dry_run:
        return {'would_create': ..., 'would_modify': ..., 'description': ...}

    # Create/modify objects, edges, notebooks
    # Record provenance
    # Return what changed
```

### 5. Cascade
The mutation changes what the engine sees on the next pass. This is
implicit -- not coded separately -- but must be understood:

- New edges change BM25/SBERT candidate pools
- New notebooks change scope boundaries
- Promoted entities change NER patterns
- Type changes affect engine pass filtering

## The 5 Existing Loops

### Auto-Classify (type assignment)
- **Detection**: Object has type='note' but content matches a known type pattern
- **Proposal**: Change type to detected type (e.g., 'source', 'concept')
- **Threshold**: Classification confidence >= 0.8
- **Mutation**: Update Object.type
- **Cascade**: Engine passes filter by type; reclassification changes which passes apply

### Cluster -> Notebook (community detection)
- **Detection**: Louvain community detection finds dense subgraphs
- **Proposal**: Create a new Notebook grouping the community's Objects
- **Threshold**: Modularity score >= 0.3, community size >= 3
- **Mutation**: Create Notebook, move Objects into it
- **Cascade**: Per-notebook engine_config now applies; scope boundary changes candidate pools

### Entity Promotion (mention -> Object)
- **Detection**: An entity name appears in N+ Object bodies without being its own Object
- **Proposal**: Create a new Object of type='concept' for the entity, link to mentioning Objects
- **Threshold**: Mention count >= 3 across distinct Objects
- **Mutation**: Create Object, create 'mentions' Edges from each referring Object
- **Cascade**: New Object enters engine passes, gets its own edges; NER PhraseMatcher updated

### Edge Decay (staleness)
- **Detection**: Edges whose source Objects haven't been updated in N days
- **Proposal**: Reduce edge strength by decay factor
- **Threshold**: Age > config decay_after_days (default 90)
- **Mutation**: Multiply Edge.strength by decay_factor (default 0.9)
- **Cascade**: Weaker edges rank lower in compose results; may drop below thresholds

### Emergent Type Detection (pattern recognition)
- **Detection**: Multiple Objects share edge patterns, property distributions, or structural roles but have different types
- **Proposal**: Suggest a new type label for the cluster
- **Threshold**: Cluster homogeneity >= 0.7 (shared properties / total properties)
- **Mutation**: Add suggested_type field; does NOT auto-reclassify (human review required)
- **Cascade**: UI surfaces suggested types for review; human approval triggers reclassification

## Adding a New Loop

### Step 1: Implement the 5 functions

```python
# In apps/research/self_organize.py

def run_<name>_loop(notebook, config, dry_run=False):
    """
    <Name> self-organization loop.

    Detects <pattern>, proposes <action>, applies if threshold met.
    """
    detections = _detect_<pattern>(notebook, config)

    results = []
    for detection in detections:
        proposal = _propose_<action>(detection, notebook, config)
        if proposal is None:
            continue

        if not _meets_threshold(proposal, config):
            logger.debug(
                "Loop %s: proposal below threshold (%.2f < %.2f)",
                '<name>', proposal['confidence'],
                config.get('<name>_min_confidence', 0.7),
            )
            continue

        result = _apply_<mutation>(proposal, notebook, config, dry_run=dry_run)
        results.append(result)

    return results
```

### Step 2: Register in the loop runner

```python
SELF_ORG_LOOPS = [
    'auto_classify',
    'cluster_notebook',
    'entity_promotion',
    'edge_decay',
    'emergent_type',
    '<name>',  # New loop
]
```

### Step 3: Add preview endpoint

Every loop must support `dry_run=True` for the UI preview:

```python
# In apps/research/views.py or api/views.py
@api_view(['POST'])
def preview_self_org(request, notebook_id):
    notebook = get_object_or_404(Notebook, pk=notebook_id)
    config = notebook.engine_config or {}
    loop_name = request.data.get('loop')

    results = run_loop(loop_name, notebook, config, dry_run=True)
    return Response({'preview': results})
```

### Step 4: Add config defaults

In the notebook's `engine_config`:

```python
DEFAULT_ENGINE_CONFIG = {
    # ... existing ...
    '<name>_enabled': True,
    '<name>_min_confidence': 0.7,
    '<name>_min_members': 3,
    '<name>_run_interval_hours': 24,
}
```

## Invariants

1. **LLMs propose, humans review.** Loops that change Object types or
   create Objects should use `suggested_*` fields, not direct mutation,
   unless the action is clearly mechanical (edge decay).

2. **dry_run is mandatory.** Every loop must support preview mode.

3. **Provenance.** Every mutation records what loop created/modified it
   and why (the detection evidence).

4. **Thresholds are configurable.** Per-notebook engine_config controls
   all thresholds. Hardcoded thresholds are bugs.

5. **Cascade awareness.** Document what your loop's mutations affect
   downstream. Other loops and engine passes read the same graph.
