# self-organization

## Discipline Focus
Design safe feedback loops that improve structure without losing control.

## Implemented Loops (research_api)
1. Auto-classify new objects.
2. Cluster to notebook creation for under-assigned communities.
3. Entity promotion from repeated mentions.
4. Edge decay and pruning of stale auto-edges.
5. Emergent type suggestion from homogeneous clusters.

## research_api Touchpoints
- `apps/notebook/self_organize.py`
- `apps/notebook/auto_classify.py`
- `apps/notebook/community.py`

## Implementation Guidance
- Keep each loop: detection -> proposal -> threshold -> mutation -> timeline event.
- Keep preview endpoints for every mutating loop.
- Keep loop thresholds and switches configurable.

## Guardrails
- Do not auto-promote to canonical knowledge without review.
- Do not mutate many objects without dry-run visibility.
- Do not collapse user-created structure during reorg.
