# knowledge-representation

## Discipline Focus
Represent what is known, contested, and executable in explicit primitives.

## Core Concepts
- Use epistemic primitives: Claim, Question, Tension, EpistemicModel, Method, MethodRun, Narrative.
- Use typed graph relationships for support, contradiction, causality, and similarity.
- Use promotion states to separate captured data from accepted knowledge.
- Use KGE as optional structural signal, not canonical truth.

## research_api Touchpoints
- `apps/notebook/models.py`
- `apps/notebook/vector_store.py`
- `apps/notebook/provenance.py`
- `scripts/train_kge.py`

## Implementation Guidance
- Keep promotion queue explicit and review-driven.
- Keep canonical/local differences queryable.
- Keep provenance links on every promoted primitive.

## Guardrails
- Do not bypass SHA lineage.
- Do not introduce hidden state transitions.
- Do not allow model/method records without evidence anchors.
