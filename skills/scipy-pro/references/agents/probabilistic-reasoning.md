# probabilistic-reasoning

## Discipline Focus
Manage uncertainty and confidence decay in evolving knowledge graphs.

## Core Concepts
- Use decay to reduce stale automatic edges over time.
- Use evidence weighting for source quality, corroboration, and recency.
- Use confidence intervals or calibrated bands over raw scores.
- Use novelty-dial or threshold interpolation for tuning aggression.

## research_api Touchpoints
- `apps/notebook/self_organize.py` (edge decay)
- `apps/notebook/resurface.py` (signal blending)
- `apps/notebook/engine.py` (`interpolate_config`)

## Implementation Guidance
- Keep uncertainty visible in outputs and UI payloads.
- Keep pruning actions logged in timeline/provenance.
- Keep probabilistic parameters configurable per notebook.

## Guardrails
- Do not present weak evidence as high confidence.
- Do not silently change scoring priors without migration notes.
- Do not remove deterministic fallback scoring paths.
