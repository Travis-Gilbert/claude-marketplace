---
name: orchestrate
description: Use this skill when the user asks to plan, implement, debug, review, research, validate, route across plugins, compile context, execute a checklist, reconcile product harness work, or produce a production-grade report. Orchestrate is the default Production-Theorem command and delegates internally to planning, theorizing, execution, Redis harness agents, context, action rail, validation, and specialist agents.
---

# Orchestrate

One command that turns intent into grounded work.

Orchestrate plans the task, compiles the right context, delegates to hidden
specialists, exposes an action rail, validates the outcome, and records learning
candidates. It is the public upgrade path for Planning-Theorem: planning remains
an internal phase, while Orchestrate owns the whole run from observation through
report.

## User-Facing Role

- Primary command: `/orchestrate`
- Compatibility aliases in prose:
  - `/plan` -> `/orchestrate mode=plan`
  - `/planning-theorem handoff=spark` -> `/orchestrate mode=plan handoff=spark`
  - `/planning-theorem` -> `/orchestrate mode=plan`
  - `/theorize` -> `/orchestrate mode=theorize`
  - `/brainstorm` -> `/orchestrate mode=theorize`
  - `/execute` -> `/orchestrate mode=execute`
- Deliverables:
  - `Orchestrate Brief`
  - `Orchestrate Plan`
  - `Orchestrate Report`

## Checklist Manifesto

Every Orchestrate run is checklist-first.

- Build stable checklist IDs before execution when a checklist does not already
  exist.
- Keep the same IDs from plan to report.
- Attach public behavior, validation, risk, owner/agent route, and status to
  every item.
- Mark status as `planned`, `done`, `partial`, `blocked`, `skipped`, or
  `failed`.
- Never rename or merge checklist items to hide unfinished work.
- Treat failed validation as evidence, not as prose to soften.
- Do not report done unless every required checklist item reconciles to `done`
  or a non-done item is explicitly accepted as a deferral.

Load `../../references/CHECKLIST_MANIFESTO.md` when the task is complex,
multi-file, high-risk, or user-facing.

## UI Visual Project Milestone

When work touches a visible UI surface, visual design, renderer, graph/canvas,
dashboard, diagram, animation, or screenshot-sensitive user flow, load
`../../references/UI_VISUAL_PROJECT_GATES.md` and add a UI Visual Milestone to
the plan, execution checklist, and report.

The milestone separates three labels that must not be collapsed:

- Runtime complete: the code path works and passes focused checks.
- Product complete: the enabled user experience is equal-or-better than the
  baseline and passes visual gates.
- Vision complete: the result reaches the stated ambition, not just a slice.

For UI visual projects, require before/after/target screenshot evidence when
possible, record a Vision Delta before implementation, run a Do Not Downgrade
gate before replacing a mature surface, and keep the product boundary reversible
until the new surface is equal-or-better.

## Mission

- Convert ambiguous user intent into a grounded operating model.
- Read the smallest code/doc/test surface that makes the task real.
- Choose the right internal mode: observe, theorize, plan, execute, validate,
  report, or remember.
- Select hidden plugins and agents appropriate to the task.
- Preserve Redis harness and SDK product boundaries instead of flattening them
  into generic backend work.
- Compile or request context before execution.
- Produce an action rail with validators and next actions.
- Execute when requested, using checklist-driven TDD and validation.
- Reconcile all work into a final report.
- Prepare learning/writeback/federation candidates without silently promoting
  them.

## Internal Modes

Treat these as internal phases, not separate public commands:

- observe
- theorize
- plan
- delegate
- compile_context
- action_rail
- execute
- validate
- report
- remember
- federation_signal

## Handoff Mode

Use `handoff=spark` when the user wants to keep planning and product intent in
the parent thread while delegating a bounded implementation slice to a fast
coding worker.

Default handoff shape:

1. write the plan or checklist artifact
2. choose the first bounded checklist items
3. define write scope and validation scope explicitly
4. delegate the implementation slice to Spark
5. keep the planner in-thread
6. review the returned implementation against the plan before declaring done

Good fit:

- multi-file implementation slices
- product/runtime migrations
- work where planner continuity matters
- slices that benefit from tight write ownership

Bad fit:

- trivial one-file edits
- tasks where planning overhead exceeds implementation cost
- work that cannot be scoped tightly enough for delegated coding

## Host Repo Opt-In

If the host repository includes an opt-in note in `AGENTS.md` or `CLAUDE.md`,
honor it as a preference signal for Orchestrate and harness usage.

Recommended behavior:

- prefer `prepare`, `preview`, `run`, or equivalent harness-backed surfaces for
  multi-file, high-risk, long-running, or context-heavy work
- prefer `/orchestrate mode=plan handoff=spark` when the repo explicitly opts
  into planner-plus-worker execution
- do not force harness or Orchestrate for trivial or clearly self-contained
  requests

Load `../../references/HOST_REPO_OPT_IN.md` when the user asks how to wire this
into `AGENTS.md` or `CLAUDE.md`.

## Redis And Harness Rules

Consult Redis and graph agents whenever work touches THG, Redis-backed harness
state, run/event/cache storage, tenant-scoped product graph routes, RESP/Valkey
facades, or SDK/database harness writeback. These specialists provide context,
guardrails, and validators; implementation remains owned by execute mode or by a
separate write-scoped task.

- Orchestrate Redis is operational state and references, not canonical Theseus
  truth.
- Tenant product state stays tenant-scoped and auth-scoped.
- Default harness SDK client behavior stays distinct from tenant-scoped
  `TheoremHotGraphClient` behavior.
- Harness memory patches are proposals unless a reviewed write path explicitly
  promotes them.
- If harness writeback is unavailable, preserve the same lifecycle facts in the
  report and mark writeback deferred.

## Orchestration Flow

1. **Observe**
   - Inspect git status when relevant.
   - Read current files, plans, tests, manifests, or docs.
   - Establish current condition before proposing changes.
   - For UI visual work, capture or identify baseline, target, and "do not
     change" screenshots or explain why they are unavailable.

2. **Resolve**
   - Classify task type.
   - Identify user-visible goal, system behavior, data/model changes,
     operational impact, and non-regression constraints.
   - For UI visual work, write the Vision Delta and name what must not visually
     downgrade before selecting the implementation path.

3. **Plan**
   - If ambiguity remains, run internal theorize mode.
   - Build a stable checklist with IDs.
   - Attach acceptance criteria, validation, risk, and owner/agent route.
   - For UI visual work, include the UI Visual Milestone gates as checklist
     items or an explicit gated plan section.

4. **Delegate**
   - Select hidden plugins/agents based on task type, language, repo surface,
     risk mode, prior outcomes, and Redis/harness impact.
   - Do not expose all plugin tools directly unless settings allow it.

5. **Compile Context**
   - If SDK/database harness is available, request or create a Context Artifact.
   - If unavailable, produce a local Context Stack section in the report.
   - Separate trusted context from external/advisory content.

6. **Action Rail**
   - Recommend next actions with label, risk, validator, expected outcome,
     approval requirement, and delegated plugin/agent.

7. **Execute**
   - If the user requested implementation, run a checklist loop:
     - choose one item
     - define validation
     - implement minimal change
     - run checks
     - simplify
     - update evidence

8. **Validate**
   - Prefer public behavior checks.
   - Run focused tests first.
   - If tests cannot run, state why and preserve available evidence.
   - For UI visual work, compare before/after/target screenshots and run the Do
     Not Downgrade gate before marking Product complete.

9. **Report**
   - Reconcile every checklist/action.
   - State final condition.
   - Identify incomplete or blocked work.
   - Recommend next action.
   - For UI visual work, report Runtime complete, Product complete, and Vision
     complete separately.

10. **Learn**
    - Record candidate graph/writeback items:
      - claims
      - tensions
      - methods
      - postmortems
      - plugin routing lessons
      - token/context waste signals
    - Do not promote canonical memory without review.

## Delegation Rules

Use these routes internally:

| Work type | Internal route |
|---|---|
| ambiguous design | theorize mode |
| production plan | planning mode |
| implementation | execute mode |
| SDK/database harness context | codex-sdk-harness-product |
| Redis harness/run/cache guardrails | redis-harness-operator |
| tenant THG product or RESP safety | redis-product-safety |
| context artifact work | context-artifact-specialist |
| plugin selection | plugin-router |
| GraphRAG / GNN-RAG evidence context | epistemic-graphrag-specialist |
| action recommendations | action-rail-specialist |
| tests and validation | validator-reporter |
| federation or learning | federation-learning-recorder |

## Output Contract: Orchestrate Brief

Use this when the user wants exploration or decision support.

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

## Output Contract: Orchestrate Plan

Use this when the user wants a plan/checklist.

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
- [ ] UI visual work has before/after/target evidence or an explicit validation gap.
- [ ] UI visual work passes the Do Not Downgrade gate before Product complete.
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

## Output Contract: Orchestrate Report

Use this when work was executed or validated.

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

## UI Visual Milestone
Include only for UI visual work.

| Gate | Status | Evidence | Notes |
|---|---|---|---|
| Runtime complete | yes/no/partial | | |
| Product complete | yes/no/partial | | |
| Vision complete | yes/no/partial | | |
| Baseline screenshots captured | yes/no/partial | | |
| Target references captured | yes/no/partial | | |
| Do Not Downgrade gate | pass/fail/not-run | | |
| Screenshot review | equal-or-better/mixed/worse/not-run | | |
| Reversible boundary | yes/no/partial | | |

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

## Required References

Load these when relevant:

- `../../references/ROUTING.md`
- `../../references/CHECKLIST_MANIFESTO.md`
- `../../references/SDK_DATABASE_HARNESS.md`
- `../../references/ORCHESTRATE_REPORTING.md`
- `../../references/SETTINGS.md`
- `../../references/PRODUCTION_GATES.md`
- `../../references/UI_VISUAL_PROJECT_GATES.md`
- `../../references/ARTIFACT_SCHEMAS.md`
- `../../references/EPISTEMIC_PRIMITIVES.md`
- `../../references/REPORTING.md`

## Guardrails

- Do not expose all internal plugins by default.
- Do not invent repo facts.
- Do not hide failed validation.
- Do not report done unless the checklist supports it.
- Do not promote memory patches automatically.
- Do not federate raw code, raw prompts, private files, or proprietary
  identifiers.
- Do not claim SDK/database harness writeback happened unless it actually
  happened.
