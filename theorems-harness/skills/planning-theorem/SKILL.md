---
name: planning-theorem
description: This skill should be used when the user asks to "make a plan", "write an implementation plan", "spec this", "plan a migration", "retrofit this", "create a checklist", "research before implementing", or wants work routed across skills and agents before execution.
---

# Planning-Theorem

Compatibility note: this skill is now an internal planning mode of Orchestrate.
Prefer `/harness mode=plan` for new workflows.

Create a production-grade planning artifact that can be executed directly. Ground every task in the live codebase. Do not hide deferred work behind elegant prose.

## User-Facing Role

- Primary command: `/planning-theorem`
- Compatibility alias to document and honor in prose: `/plan`
- Deliverable: `Planning-Theorem Artifact`

When the user requests a handoff workflow, support:

- `/planning-theorem handoff=spark`
- `/harness mode=plan handoff=spark`

## Mission

- Establish the current condition from source code, tests, docs, and runtime seams.
- Translate user intent into a production definition of done.
- Build an auditable checklist with stable IDs.
- Route ambiguous or specialized work to the right skill or agent.
- Make validation, rollback, observability, and migration risk explicit.
- Leave no silent deferrals.

## UI Visual Project Rule

For plans that touch visible UI, renderer architecture, graph/canvas surfaces,
dashboards, diagrams, animation, visual design, or screenshot-sensitive flows,
load `../../references/UI_VISUAL_PROJECT_GATES.md` and include a UI Visual
Milestone. The plan must split Runtime complete, Product complete, and Vision
complete; capture or identify before/after/target screenshot evidence; define
the Vision Delta; require a Do Not Downgrade gate; and preserve a reversible
product boundary until the new visible surface is equal-or-better.

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
5. For UI visual work, define the visual baseline, target references, Vision
   Delta, and Do Not Downgrade criteria before the checklist is locked.
6. Build a codebase-grounded checklist with stable IDs like `PT-001`.
7. Attach acceptance criteria, validation, risk, and ownership/route for every item.
8. Record explicit non-goals and deferrals.
9. Define how `/execute` must reconcile against the plan.
10. If `handoff=spark` is requested, select the first bounded checklist items,
   define write scope and validation scope, delegate the slice, and remain in
   the parent thread to review the result against the artifact.

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

## Host Repo Opt-In

If `AGENTS.md` or `CLAUDE.md` contains a repository opt-in note preferring
Orchestrate or harness usage, treat it as a host policy for complex work.

Honor the opt-in for:

- multi-file implementation
- architecture or migration work
- runs that benefit from harness-backed context preparation
- delegated plan-plus-worker execution

Do not over-apply the opt-in to trivial asks.

Load `../../references/HOST_REPO_OPT_IN.md` when the user wants a copyable repo
snippet.

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

## UI Visual Milestone
Include only for UI visual work.

| Gate | Requirement | Evidence/validator | Status |
|---|---|---|---|
| Runtime complete | Code path works. | Tests/smoke/build. | planned |
| Product complete | Enabled surface is equal-or-better than baseline. | Before/after/target review. | planned |
| Vision complete | Stated ambition is reached or delta is named. | Vision Delta. | planned |
| Baseline capture | Current and target visuals are captured or unavailable with reason. | Screenshots/references. | planned |
| Do Not Downgrade | Mature surface is preserved or replaced only by equal-or-better UX. | Visual gate review. | planned |
| Reversible boundary | Rollback/baseline path exists. | Route/mode/commit boundary. | planned |

## Vision Delta
Include only for UI visual work.

- Target vision:
- Current visual condition:
- This plan makes true:
- This plan does not make true:
- Visual downgrade risks:
- Remaining renderer/data/interaction/design gaps:

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
- [ ] UI visual work has before/after/target evidence or an explicit validation gap.
- [ ] UI visual work passes the Do Not Downgrade gate before Product complete.
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
- `../../references/UI_VISUAL_PROJECT_GATES.md`
- `../../references/ARTIFACT_SCHEMAS.md`
- `../../references/EPISTEMIC_PRIMITIVES.md`
- `../../references/REPORTING.md`

## Guardrails

- Prefer vertical slices over horizontal staging.
- Prefer one real path over a buffet of maybe-paths.
- Do not leave validation as "to be figured out later".
- Do not let the executive summary become fluff; keep it concise.
- Do not claim SDK harness or product graph behavior without code evidence.
- Do not call a UI visual plan complete when only the runtime slice is defined.
