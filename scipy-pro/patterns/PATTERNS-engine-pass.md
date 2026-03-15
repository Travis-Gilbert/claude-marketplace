# Pattern: Adding an Engine Pass

Two engines, two patterns. engine.py is stateful (writes edges to DB).
compose_engine.py is stateless (returns ranked candidates, no DB writes).

## Stateful Engine Pass (engine.py)

engine.py runs post-capture: an Object is saved, then the engine enriches
the graph by creating Edges to related Objects.

### Template

```python
def _run_<name>_engine(obj, config):
    """
    <Name> pass: <one-line description of what this pass discovers>.

    Args:
        obj: The Object to find connections for.
        config: Notebook-level engine_config dict.

    Returns:
        list[Edge]: Newly created edges.
    """
    if not _FEATURE_AVAILABLE:
        return []

    threshold = config.get('<name>_threshold', 0.5)
    candidates = _get_candidates(obj, config)

    new_edges = []
    for match in candidates:
        score = _compute_score(obj, match)
        if score < threshold:
            continue

        reason = _llm_explanation(obj, match, strength=score) or (
            f"<Name> similarity ({score:.2f}) between "
            f"'{obj.title}' and '{match.title}'"
        )

        edge, created = Edge.objects.get_or_create(
            from_object=obj,
            to_object=match,
            edge_type='<type>',
            defaults={
                'reason': reason,
                'strength': round(score, 4),
                'is_auto': True,
                'engine': '<name>',
            },
        )
        if created:
            new_edges.append(edge)

    return new_edges
```

### Key Semantics

- `get_or_create` prevents duplicate edges for the same pair+type
- `reason` is always a human-readable sentence (Invariant #1)
- `is_auto=True` marks engine-created edges (vs human-created)
- `engine='<name>'` records which pass created the edge
- `from_object`/`to_object`, never source/target (Invariant #2)
- `strength` is rounded to 4 decimal places for consistency
- Always try `_llm_explanation()` first, fall back to template string

### Wiring Into engine.py

In the main `run_engine()` function, add your pass to the ordered pass list:

```python
PASS_ORDER = [
    'bm25',
    'tfidf',
    'semantic',      # SBERT cosine similarity
    'nli',           # CrossEncoder NLI
    'kge',           # Knowledge Graph Embedding
    'causal',        # Temporal causal inference
    '<name>',        # Your new pass
]
```

Then in the pass dispatch:

```python
if '<name>' in active_passes:
    edges = _run_<name>_engine(obj, config)
    all_new_edges.extend(edges)
    stats['<name>'] = len(edges)
```

## Stateless Compose Engine Pass (compose_engine.py)

compose_engine.py runs at write-time: the user is typing, and the engine
suggests related Objects in real-time. No database writes.

### Template

```python
if '<name>' in pass_order:
    matched_ids: set[int] = set()

    if not <feature>_available:
        _append_pass_state(pass_states, '<name>',
            status='degraded',
            match_count=0,
            degraded_reason='<name>_unavailable')
    else:
        try:
            candidates = _get_<name>_candidates(text, notebook_id, config)
            for match in candidates:
                score = match['score']
                if score < threshold:
                    continue
                _merge_candidate(
                    results_map,
                    pk=match['pk'],
                    score=score,
                    signal='<name>',
                    explanation=match.get('reason', ''),
                )
                matched_ids.add(match['pk'])
        except Exception as exc:
            logger.debug('Compose <name> pass skipped: %s', exc)

        _append_pass_state(pass_states, '<name>',
            status='complete',
            match_count=len(matched_ids))
```

### Key Differences from engine.py

| Aspect | engine.py | compose_engine.py |
|--------|-----------|-------------------|
| DB writes | Yes (Edge.objects.get_or_create) | Never |
| Return type | list[Edge] | Merged into results_map |
| Failure mode | return [] | status='degraded' with reason |
| When it runs | Post-capture (background) | Write-time (synchronous) |
| Candidate merging | N/A (creates edges) | _merge_candidate() |
| Pass tracking | stats dict | pass_states list |

### _merge_candidate Semantics

```python
def _merge_candidate(results_map, pk, score, signal, explanation):
    """Merge a candidate into the results map, keeping the best score per signal."""
    if pk not in results_map:
        results_map[pk] = {'pk': pk, 'signals': {}}
    results_map[pk]['signals'][signal] = {
        'score': score,
        'explanation': explanation,
    }
```

Multiple passes can find the same Object. Each pass's score is stored
under its signal name. The final ranking combines signals.

## Verification Checklist

- [ ] Feature guard: pass is skipped cleanly when dependency missing
- [ ] No DB writes in compose_engine path
- [ ] Edge.reason is human-readable in engine.py path
- [ ] get_or_create prevents duplicate edges
- [ ] Threshold is configurable via engine_config
- [ ] Pass appears in PASS_ORDER at the right position
- [ ] pass_states tracks status for compose engine
- [ ] Test with feature enabled: correct edges/candidates produced
- [ ] Test with feature disabled: clean skip, no errors
