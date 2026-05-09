# Checklist Manifesto

Orchestrate is checklist-first. The checklist is the control surface for
planning, execution, validation, and reporting.

## Principles

- A task that matters gets a stable ID.
- A stable ID survives from plan to execution report.
- Every ID has a public behavior or artifact it proves.
- Every ID has validation, even when the validation is "not run because...".
- Every non-done item is visible in the final report.
- A checklist can grow when new facts appear, but additions must be named as new
  scope rather than hidden inside old IDs.
- Failed validation is evidence.
- Deferral is allowed only when named, risked, and assigned a next action.

## Required Fields

Every checklist item must include:

| Field | Requirement |
|---|---|
| ID | Stable, unique, never reused for a different task. |
| Task | Concrete action or behavior. |
| Grounding | File, route, doc, test, runtime surface, or user instruction. |
| Route | Skill, agent, or owner responsible for the item. |
| Acceptance | Observable condition that proves completion. |
| Validation | Command, test, review, smoke, or explicit not-run reason. |
| Risk | Main failure mode if the item is wrong. |
| Status | `planned`, `done`, `partial`, `blocked`, `skipped`, or `failed`. |

## Status Meanings

- `planned`: accepted scope, not executed yet.
- `done`: implemented or answered, validated, and reconciled.
- `partial`: some behavior landed, but acceptance criteria are incomplete.
- `blocked`: cannot proceed until an external condition changes.
- `skipped`: intentionally out of scope with a named reason.
- `failed`: attempted validation or implementation did not pass.

## Checklist Loop

1. Select one item.
2. Restate the public behavior.
3. Identify or write validation.
4. Implement or answer the smallest useful slice.
5. Run validation.
6. Simplify/review.
7. Update evidence and status.

## Redis Harness Addendum

Redis and THG work gets explicit checklist coverage for:

- tenant key isolation
- auth and scope behavior
- default SDK client vs tenant product client boundaries
- cache/run/event storage vs canonical graph storage
- replay/fork/compare behavior
- patch proposal vs patch promotion
- observability and rollback
- local fallback when Redis is unavailable
