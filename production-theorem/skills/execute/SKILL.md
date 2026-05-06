---
name: execute
description: This skill should be used when the user asks to "execute the plan", "implement this", "fix the bug", "ship this", "run the tests", "reconcile the checklist", "simplify this code", or wants production-grade implementation with testing, review, and final execution reporting.
---

# Execute

Compatibility note: this skill is now an internal execution mode of Orchestrate.
Prefer `/orchestrate mode=execute` for new workflows.

Implement like the change is heading toward production. Reconcile every action against a checklist, validate behavior through public interfaces, and produce a report that makes gaps impossible to hide.

## User-Facing Role

- Primary command: `/execute`
- Deliverable: `Execute-Theorem Report`

## Acceptable Inputs

- Planning-Theorem Artifact
- explicit checklist
- bug report
- failing test
- partial implementation
- diff that needs simplification or review
- clear user task that supports a minimal inferred plan

If no plan exists, create a minimal execution checklist first, then execute it.

## Execution Flow

### 1. Preflight

- inspect git status
- identify touched files and nearby tests
- read the relevant plan, docs, and code seams
- record target behavior and main risks
- if the task touches the paired harness SDK product, `TheoremContextClient`, `TheoremHotGraphClient`, replay, fork, compare, patch validation, or tenant-scoped product graph routes, consult `codex-sdk-harness-product` before editing

### 2. Checklist Loop

For each checklist item:

1. select one item
2. define or identify the public behavior
3. write or identify validation
4. implement the smallest change that can pass
5. run validation
6. simplify and review changed code without altering intended behavior
7. update status and evidence

### 3. TDD Discipline

Use red-green-refactor when feasible:

- test one behavior at a time
- prefer public interfaces over internal implementation hooks
- write the smallest failing test that proves the missing behavior
- implement only enough to go green
- refactor only after green

### 4. Diagnosis Discipline

For bug work:

- build a feedback loop first
- reproduce the failure
- minimize the reproduction
- generate 3 to 5 falsifiable hypotheses
- instrument one variable at a time
- fix the issue
- add a regression test at the correct seam
- remove debug-only clutter

### 5. Simplify / Review Pass

After each meaningful implementation step, review modified code for:

- clarity
- consistency
- exact functionality preservation
- duplicated logic
- unnecessary abstraction
- missing error handling
- security/performance traps
- missing tests or docs

### 6. Validation

Run the narrowest checks that prove the work:

- focused tests
- integration tests
- regression tests
- lint and type/static checks when available
- build or smoke checks where relevant
- migration, data, or runtime checks where relevant

If something cannot run, state exactly why and preserve whatever evidence is still available.

## SDK Harness Product Rule

For SDK harness product work:

- preserve the distinction between typed client contract, reusable artifacts, and backend implementation
- do not describe product behavior from backend assumptions alone
- reconcile contract claims against `theorem-context-sdk/README.md`, the TS/Python READMEs, `src/client.ts`, `src/product.ts`, and the Python client modules
- verify whether a behavior belongs to the default harness SDK client, the harness namespace, or the tenant-scoped product graph client

## Output Contract

Return this report shape:

```md
# Execute-Theorem Report: <title>

## Executive Summary
- Final condition:
- Goal achieved? yes/no/partial
- Production readiness:
- Biggest remaining risk:
- Recommended next action:

## Checklist Reconciliation
| ID | Original task | Status | Evidence | Tests/results | Notes |
|---|---|---|---|---|---|

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
- [ ] Follow-up plan proposed if needed.

## Compound Engineering Effect
- Tests added/improved:
- Docs/ADR/postmortem/context artifacts:
- Reusable patterns:
- Graph/writeback candidates:
- Future plan seeds:

## Suggested Next Steps
Concrete next actions, ordered by production value.
```

## Completion Rule

Never report "done" unless the checklist reconciliation supports it.

- If work is partial, say partial.
- If work is blocked, say blocked.
- If validation was not run, say not run and explain.

## Required References

Load these when needed:

- `../../references/PRODUCTION_GATES.md`
- `../../references/REPORTING.md`
- `../../references/ARTIFACT_SCHEMAS.md`
- `../../references/EPISTEMIC_PRIMITIVES.md`

## Guardrails

- Do not silently rewrite checklist scope mid-run.
- Do not bury failed validation in prose.
- Do not stop at implementation if tests, simplification, or reporting are still undone.
- Do not claim production readiness when gates remain open.
