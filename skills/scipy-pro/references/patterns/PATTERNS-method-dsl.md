# PATTERNS-method-dsl

## Goal
Define a narrow executable-knowledge DSL that remains auditable.

## Principles
- Keep DSL declarative and bounded.
- Keep schema versioned and explicitly validated.
- Keep each method bound to promoted evidence.
- Keep runtime outputs reproducible and provenance-linked.

## Baseline DSL Fields
- `id`, `name`, `version`
- `inputs` schema
- `steps` list (deterministic operators)
- `checks` / assertions
- `outputs` schema
- `provenance_refs` (source fragments, claims, revisions)

## Verify
- Validate schema before execution.
- Validate immutable method version snapshots.
- Validate run records include inputs, outputs, status, duration.
