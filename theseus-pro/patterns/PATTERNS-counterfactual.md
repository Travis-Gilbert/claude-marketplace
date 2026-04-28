# PATTERNS-counterfactual.md

How to implement counterfactual simulation via Truth Maintenance.

## Prerequisites

Claims must have dependency records:
```python
class ClaimDependency(models.Model):
    claim = models.ForeignKey('Claim', related_name='dependencies',
                              on_delete=models.CASCADE)
    depends_on = models.ForeignKey('Object', on_delete=models.CASCADE,
                                    help_text='Source or Claim this depends on')
    via_edge = models.ForeignKey('Edge', null=True, on_delete=models.SET_NULL)
    strength = models.FloatField(default=1.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['claim', 'depends_on']
```

## Implementation

### Step 1: Build Dependency Graph

When Claims are created (via claim_decomposition.py), record dependencies:
```python
def record_claim_dependencies(claim, source_object):
    """Record that this Claim depends on this Source."""
    ClaimDependency.objects.get_or_create(
        claim=claim,
        depends_on=source_object,
        defaults={'strength': 1.0}
    )

    # Also record cross-claim dependencies from NLI
    supporting_claims = find_supporting_claims(claim)
    for sc in supporting_claims:
        ClaimDependency.objects.get_or_create(
            claim=claim,
            depends_on=sc.object,  # the Object containing the claim
            via_edge=sc.edge,
            defaults={'strength': sc.nli_entailment_score}
        )
```

### Step 2: Retraction Simulation

```python
def simulate_retraction(retract_ids: set[int], notebook_id: int = None):
    """
    Simulate removing a set of Sources or Claims.
    Returns the cascading effect on all dependent Claims.
    Does NOT modify the database.
    """
    qs = ClaimDependency.objects.select_related('claim', 'depends_on')
    if notebook_id:
        qs = qs.filter(claim__object__notebooks=notebook_id)

    # Build adjacency: depends_on_id -> list of (claim, strength)
    dependents = defaultdict(list)
    for dep in qs:
        dependents[dep.depends_on_id].append((dep.claim, dep.strength))

    # BFS from retracted nodes
    affected = []
    retracted = set(retract_ids)
    queue = list(retract_ids)
    visited = set()

    while queue:
        node_id = queue.pop(0)
        if node_id in visited:
            continue
        visited.add(node_id)

        for claim, strength in dependents.get(node_id, []):
            # Check all support paths for this Claim
            all_deps = ClaimDependency.objects.filter(claim=claim)
            surviving = [d for d in all_deps
                        if d.depends_on_id not in retracted]

            if not surviving:
                affected.append({
                    'claim_id': claim.id,
                    'claim_text': claim.text[:200],
                    'old_status': claim.epistemic_status,
                    'new_status': 'unsupported',
                    'depth': len([a for a in affected
                                 if a['new_status'] == 'unsupported']),
                })
                retracted.add(claim.object_id)
                queue.append(claim.object_id)
            elif len(surviving) < len(all_deps):
                old_conf = sum(d.strength for d in all_deps) / len(all_deps)
                new_conf = sum(d.strength for d in surviving) / len(surviving)
                affected.append({
                    'claim_id': claim.id,
                    'claim_text': claim.text[:200],
                    'old_status': claim.epistemic_status,
                    'new_status': 'weakened',
                    'confidence_delta': new_conf - old_conf,
                })

    total_claims = Claim.objects.filter(
        object__notebooks=notebook_id
    ).count() if notebook_id else Claim.objects.count()

    unsupported = [a for a in affected if a['new_status'] == 'unsupported']

    return {
        'fragility': len(unsupported) / max(total_claims, 1),
        'total_affected': len(affected),
        'unsupported_count': len(unsupported),
        'weakened_count': len(affected) - len(unsupported),
        'cascade_depth': max((a.get('depth', 0) for a in affected), default=0),
        'affected_claims': affected,
        'load_bearing': len(unsupported) > total_claims * 0.05,
    }
```

### Step 3: API Endpoint

```python
# In views.py
@api_view(['POST'])
def simulate_counterfactual(request):
    retract_ids = set(request.data.get('retract', []))
    accept_ids = set(request.data.get('accept', []))
    notebook_id = request.data.get('notebook')

    if not retract_ids and not accept_ids:
        return Response({'error': 'Provide retract or accept IDs'}, status=400)

    result = simulate_retraction(retract_ids, notebook_id)
    return Response(result)
```

### Step 4: Fragility Dashboard

For each Source, precompute: "if this Source were removed, how many Claims
become unsupported?" This is the Source's load-bearing score.

```python
def compute_load_bearing_scores(notebook_id=None):
    sources = Object.objects.filter(object_type='source', is_deleted=False)
    if notebook_id:
        sources = sources.filter(notebooks=notebook_id)

    scores = {}
    for source in sources:
        result = simulate_retraction({source.id}, notebook_id)
        scores[source.id] = {
            'title': source.title,
            'fragility_impact': result['fragility'],
            'claims_lost': result['unsupported_count'],
            'cascade_depth': result['cascade_depth'],
        }

    return sorted(scores.values(), key=lambda x: -x['fragility_impact'])
```
