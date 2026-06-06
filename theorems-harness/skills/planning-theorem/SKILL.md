---
name: planning-theorem
description: The Harness planning capability. Use when the task needs stable acceptance criteria, a multi-session checklist, a migration shape, or a plan worth handing to another agent. Reachable as /harness mode=plan or, for users who explicitly want planning, the /planning-theorem compatibility command.
---

# Planning-Theorem

Planning is the Harness capability for turning a fuzzy ask into a checklist
another agent could execute against. It is not a license to defer real work; it
is the discipline of making acceptance criteria honest before code runs.

Prefer `/harness` (which routes to planning when the task signals warrant it).
`/planning-theorem` remains a compatibility entrypoint for users who explicitly
want a plan as the deliverable.

## When To Plan

Use this capability when at least one is true:

- the task spans more than one bounded slice
- acceptance criteria are not yet locked
- the work crosses multiple files, modules, or systems and a checklist will
  reduce risk
- a future session will pick up where this one stops
- a UI visual surface needs Vision Delta + Do Not Downgrade gating before code
- the user asked for a plan, spec, migration, retrofit, or handoff artifact

Do not plan when the work is a clear one-file fix, a typo, a renamed variable,
or anything the user obviously meant to be executed now. Right-size: a small
plan is a few lines; a launch plan is a stable-ID checklist with validation.

## Inputs

Any of these are valid inputs:

- a user task in plain language
- an existing SPEC, ADR, or design doc
- a prior planning artifact that needs revision
- a failed execution that needs a re-plan
- a research brief or theorem brief that resolved the open questions

## Operating Posture

- Ground every checklist row in a real file path, test seam, or runtime
  surface. No abstract verbs.
- Prefer vertical slices over horizontal staging. One real path beats a buffet
  of maybe-paths.
- Make validation, rollback, observability, and migration risk explicit per
  row.
- Surface unresolved decisions instead of smoothing them over.
- Never produce wall-clock, compute, or cost estimates ("~2 hours", "~$5",
  "Effort: S/M/L"). Predictions about future work are not part of a plan.
- If the user said "MVP," honor it. Do NOT introduce "MVP" framing yourself.
- If a spec is the source, every spec section must have at least one checklist
  row pointing at it. Zero coverage of a spec section is a planning bug, not a
  scope decision.
- Deferrals require explicit user consent. Surface candidate deferrals one at a
  time with a one-sentence justification; do not batch them into a quiet
  "non-goals" table at the end.

## Workflow

1. Reconcile the request against the live repo: read the smallest relevant
   source surface, not a pile of historical specs.
2. Define the production goal in user-visible, system, data, and operational
   terms.
3. For UI visual work, define visual baseline, target references, Vision
   Delta, and Do Not Downgrade criteria before locking the checklist.
4. Build a codebase-grounded checklist with stable IDs (`PT-001`, etc.).
5. Attach acceptance criteria, validation, risk, and route per row.
6. Record explicit non-goals and deferrals only with surfaced consent.
7. Define how `/harness mode=execute` reconciles against the plan.
8. If `handoff=spark` is requested, select the first bounded slice, define
   write/validation scope, delegate it, and stay in-thread to review.

## Checklist Contract

When planning from a handoff, spec, migration note, or enumerated deliverable
list, emit a machine-readable checklist before implementation starts:

- Write `.harness/checklist.json` in the working directory.
- Create one item per handoff deliverable, preserving the deliverable title and
  acceptance criterion.
- Initialize each item with `status: "open"`, no verification evidence, and no
  deferral reason.
- Mirror the same checklist to the harness coordination substrate as a
  room-visible coordination record so other agents inherit the contract.
- Keep stable IDs from this checklist through execution and final reporting.

Completion is reconciled against this checklist. An item is complete only when
it is verified against its acceptance criterion, or when it carries an honest
non-forbidden deferral reason.

## Output

Right-size the deliverable:

- Small plans: a checklist table + an Executive Summary line, nothing more.
- Production plans: use the full template in
  `../../references/PLAN_TEMPLATE.md`.
- UI visual plans: include the UI Visual Milestone gates from
  `../../references/UI_VISUAL_PROJECT_GATES.md`.

The template is a tool, not a contract. Use only the sections the work needs.

## Routing

- Ambiguity or option pressure → `/harness mode=theorize` briefly, then back.
- SDK harness product questions → `codex-sdk-harness-product`.
- Redis/THG/product-state questions → `redis-harness-operator` /
  `redis-product-safety`.
- Implementation → `/harness mode=execute`, with the plan as input.

## Anti-Patterns

- Pre-writing a 13-section plan template for a one-file fix.
- Hiding deferred work behind elegant prose.
- Calling validation "TBD" or "to be determined later."
- Producing a plan that the executing agent cannot reconcile row-by-row.
- Treating `handoff=spark` as permission to disappear: stay in-thread to
  review what the executor built.
- Adding time/compute/cost estimates to a row. Plans describe what; observed
  runtimes describe how long.
