# graph-theory

## Discipline Focus
Extract meaningful structure from object-edge systems.

## Core Concepts
- Use community detection for thematic structure discovery.
- Use centrality and personalized ranking for contextual importance.
- Use structural-hole and gap analysis for missing-evidence discovery.
- Use DAG reductions for interpretable lineage flow.

## research_api Touchpoints
- `apps/notebook/community.py`
- `apps/notebook/gap_analysis.py`
- `apps/notebook/graph.py`
- `apps/notebook/temporal_evolution.py`

## Implementation Guidance
- Keep graph construction, weighting, and algorithm choices separable.
- Keep preview endpoints for expensive graph mutations.
- Keep scoring explanations inspectable in the UI layer.

## Guardrails
- Do not treat cluster IDs as immutable truth.
- Do not mutate graph structure without threshold checks.
- Do not trade correctness for speed without benchmark evidence.
