# causal-inference

## Discipline Focus
Trace influence and lineage across time with auditable constraints.

## Core Concepts
- Enforce temporal precedence before influence edges.
- Build influence DAGs from support/entailment transfer.
- Trace ancestors and descendants for object lineage.
- Preserve transitive clarity through pruning/reduction.

## research_api Touchpoints
- `apps/notebook/causal_engine.py`
- `apps/notebook/provenance.py`
- `apps/notebook/engine.py` pass 7

## Implementation Guidance
- Keep event-time assumptions explicit.
- Keep lineage traversal deterministic and bounded.
- Keep causal edges distinguishable from similarity edges.

## Guardrails
- Do not imply causation from correlation alone.
- Do not create backward-in-time influence links.
- Do not suppress contradiction context in lineage reports.
