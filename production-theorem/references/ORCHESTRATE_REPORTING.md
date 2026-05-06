# Orchestrate Reporting

Orchestrate reports are reconciliation artifacts. They show what was proven,
what changed, what failed, and what should happen next.

## Orchestrate Brief

Use for exploration and decision support.

```md
# Orchestrate Brief: <title>

## Executive Summary
- Current condition:
- Intent:
- Recommended direction:
- Main risk:
- Next action:

## Problem Shape
- Known facts:
- Unknowns:
- Constraints:
- Assumptions:
- Tensions:
- Failure modes:

## Options
| Option | Description | Upside | Risk | Validation | Recommendation |
|---|---|---|---|---|---|

## Delegation Map
| Concern | Agent/plugin | Why |
|---|---|---|

## Planning Inputs
Concrete inputs for Orchestrate Plan.
```

## Orchestrate Plan

Use for a plan or checklist.

```md
# Orchestrate Plan: <title>

## Executive Summary
- Goal:
- Intent:
- Summary of work:

## Current Condition
Describe what exists now, with file/test/doc/runtime grounding.

## Goal
- User-visible outcome:
- System behavior:
- Data/model changes:
- Operational impact:
- What must not regress:

## Context Stack
| Context | Source | Trust | Why it matters |
|---|---|---|---|

## Delegation Map
| Work type | Route to | Why |
|---|---|---|

## Action Rail
| Action | Risk | Validator | Approval | Route |
|---|---|---|---|---|

## Checklist
| ID | Task | Grounding | Route | Acceptance criteria | Validation | Risk | Status |
|---|---|---|---|---|---|---|---|

## Test Strategy
- Preflight:
- Focused:
- Integration:
- Regression:
- Static/type/lint:
- Manual smoke:
- Performance/security:

## Production Gates
- [ ] Tests pass or failures are explained.
- [ ] No unchecked migration or data risk.
- [ ] No secrets or destructive commands introduced.
- [ ] Error paths considered.
- [ ] Observability/logging considered.
- [ ] Rollback/revert path exists.
- [ ] Docs/ADR updated or explicitly deferred.
- [ ] Redis/harness writeback is proven or explicitly deferred.
- [ ] Final report can reconcile every checklist item.

## Epistemic Ledger
| Primitive | Entry | Evidence | Confidence | Action |
|---|---|---|---|---|

## Explicit Non-Goals and Deferrals
| Item | Why deferred | Risk | Follow-up |
|---|---|---|---|

## Execution Instructions
- Start with:
- Preserve:
- Run:
- Report using Orchestrate Report.
```

## Orchestrate Report

Use after execution or validation.

```md
# Orchestrate Report: <title>

## Executive Summary
- Final condition:
- Goal achieved? yes/no/partial
- Production readiness:
- Biggest remaining risk:
- Recommended next action:

## Checklist Reconciliation
| ID | Original task | Status | Evidence | Tests/results | Notes |
|---|---|---|---|---|---|

## Delegation Reconciliation
| Agent/plugin | Used? | Result | Notes |
|---|---|---|---|

## Context and Action Rail
- Context used:
- Actions selected:
- Actions deferred:

## Changes Made
| Area | Files | Summary | Why |
|---|---|---|---|

## Tests and Validation
| Command/check | Result | Notes |
|---|---|---|

## Incomplete or Blocked Work
- What was not done:
- Why:
- Evidence:
- Risk:
- Next action:
- Suggested owner/skill:

## New Findings
- New tensions:
- New assumptions:
- New gaps:
- New refactor opportunities:
- New research needed:
- New tests needed:

## Production Gate Review
- [ ] Tests pass or failure is explained.
- [ ] Behavior preserved where required.
- [ ] Rollback/revert path considered.
- [ ] Docs/ADR updated or explicitly deferred.
- [ ] No hidden TODOs or silent deferrals.
- [ ] Security/performance risks considered.
- [ ] Redis/harness writeback proven or explicitly deferred.
- [ ] Follow-up plan proposed if needed.

## Learning Candidates
- Claims:
- Tensions:
- Methods:
- Postmortems:
- Plugin routing lessons:
- Federation structural signal candidate:

## Suggested Next Steps
Concrete next actions, ordered by production value.
```
