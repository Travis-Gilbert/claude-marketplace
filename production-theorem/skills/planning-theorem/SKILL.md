---
name: planning-theorem
description: This skill should be used when the user asks to "make a plan", "write an implementation plan", "spec this", "plan a migration", "retrofit this", "create a checklist", "research before implementing", or wants work routed across skills and agents before execution.
---

# Planning-Theorem

Create a production-grade planning artifact that can be executed directly. Ground every task in the live codebase. Do not hide deferred work behind elegant prose.

## User-Facing Role

- Primary command: `/planning-theorem`
- Compatibility alias to document and honor in prose: `/plan`
- Deliverable: `Planning-Theorem Artifact`

## Mission

- Establish the current condition from source code, tests, docs, and runtime seams.
- Translate user intent into a production definition of done.
- Build an auditable checklist with stable IDs.
- Route ambiguous or specialized work to the right skill or agent.
- Make validation, rollback, observability, and migration risk explicit.
- Leave no silent deferrals.

## Internal Modes

Treat these as internal phases, not separate commands:

- research
- retrofit
- review-plan
- spec-to-checklist
- context compilation
- docs update planning
- SDK harness product context pass

## Planning Flow

1. Reconcile specs or user instructions against the live repo.
2. Read the smallest set of files that makes the plan real.
3. If the work touches the paired harness SDK product, `TheoremContextClient`, `TheoremHotGraphClient`, replay, fork, compare, patch validation, tenant-scoped product graph routes, or TypeScript/Python SDK parity, consult `codex-sdk-harness-product` before finalizing checklist items.
4. Define the production goal in user-visible, system, data, and operational terms.
5. Build a codebase-grounded checklist with stable IDs like `PT-001`.
6. Attach acceptance criteria, validation, risk, and ownership/route for every item.
7. Record explicit non-goals and deferrals.
8. Define how `/execute` must reconcile against the plan.

## Checklist Rules

Every checklist item must include:

- stable ID
- concrete task
- codebase grounding
- owner, agent, or skill route
- acceptance criteria
- validation method
- risk
- status

Every item must be independently auditable. If an item matters but is not being done now, place it in `Explicit Non-Goals and Deferrals`.

## Orchestration Rules

Use these routes by default:

- ambiguity or option pressure -> `/theorize`
- SDK harness product questions -> `codex-sdk-harness-product`
- implementation and TDD -> `/execute`
- docs or ADR persistence -> local docs update step inside the plan
- review, simplification, diagnosis, and test hardening -> phases inside `/execute`

## SDK Harness Product Rule

For SDK harness product plans:

- preserve the framing as a Codex-facing database/SDK harness product, not a generic backend implementation task
- distinguish client contract from server/runtime implementation
- treat harness patch validation as a proposal/review flow, not automatic promotion
- treat the tenant-scoped product graph client as a distinct surface from the default harness SDK client
- require explicit evidence for claims about replay, fork, compare, patch, SDK parity, or product-route behavior

## Output Contract

Return the plan in this shape:

```md
# Planning-Theorem Artifact: <title>

## Executive Summary
- Goal:
- Intent:
- Summary of work:

## Current Condition
Describe what exists now, with file/test/doc/runtime grounding.

## Intent
Explain what the user is trying to make true.

## Goal
- User-visible outcome:
- System behavior:
- Data/model changes:
- Operational impact:
- What must not regress:

## Codebase Grounding
| Area | Evidence | Notes |
|---|---|---|

## Orchestration Map
| Work type | Route to | Why |
|---|---|---|

## Checklist
| ID | Task | Codebase grounding | Agent/skill route | Acceptance criteria | Validation | Risk | Status |
|---|---|---|---|---|---|---|---|

## Test Strategy
- Preflight checks:
- Focused tests:
- Integration tests:
- Regression tests:
- Type/lint/static checks:
- Manual smoke checks:
- Performance/security checks:

## Production Gates
- [ ] Tests pass or failures are explained.
- [ ] No unchecked migration or data risk.
- [ ] No secrets or destructive commands introduced.
- [ ] Error paths considered.
- [ ] Observability/logging considered.
- [ ] Rollback/revert path exists.
- [ ] Docs/ADR updated or explicitly deferred.
- [ ] Execution report can reconcile every checklist item.

## Epistemic Ledger
| Primitive | Entry | Evidence | Confidence | Action |
|---|---|---|---|---|

## Explicit Non-Goals and Deferrals
| Item | Why deferred | Risk of deferral | Follow-up |
|---|---|---|---|

## Execution Instructions
- Start with checklist item:
- Preserve these invariants:
- Run these commands:
- Report using the Execute-Theorem Report format.
```

## Required References

Load these on demand:

- `../../references/ROUTING.md`
- `../../references/PRODUCTION_GATES.md`
- `../../references/ARTIFACT_SCHEMAS.md`
- `../../references/EPISTEMIC_PRIMITIVES.md`
- `../../references/REPORTING.md`

## Guardrails

- Prefer vertical slices over horizontal staging.
- Prefer one real path over a buffet of maybe-paths.
- Do not leave validation as "to be figured out later".
- Do not let the executive summary become fluff; keep it concise.
- Do not claim SDK harness or product graph behavior without code evidence.
