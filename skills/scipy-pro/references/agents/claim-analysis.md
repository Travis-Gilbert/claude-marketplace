# claim-analysis

## Discipline Focus
Convert text into atomic claims and reason over support/contradiction.

## Core Concepts
- Use claim decomposition to create falsifiable propositions.
- Use NLI (`entailment`, `contradiction`, `neutral`) for claim-pair reasoning.
- Use claim-level scoring to catch disagreements masked at document level.
- Use epistemic status to keep uncertainty visible.

## research_api Touchpoints
- `apps/notebook/claim_decomposition.py`
- `apps/research/advanced_nlp.py`
- `apps/notebook/engine.py` pass 6
- `apps/notebook/compose_engine.py` NLI refinement pass

## Implementation Guidance
- Keep claim extraction bounded (dedupe + max-claim controls).
- Keep reason fields source-backed and human-readable.
- Keep contradiction and support as explicit edge semantics.

## Guardrails
- Do not auto-accept extracted claims into canonical knowledge.
- Do not flatten uncertain outputs into binary truth labels.
- Do not skip provenance for claim-pair evidence.
