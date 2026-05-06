---
name: theorize
description: This skill should be used when the user asks to "theorize", "brainstorm", "stress-test this", "grill me", "explore options", "interrogate a design", or wants a fuzzy implementation idea turned into a grounded problem model before planning or execution.
---

# Theorize

Turn fuzzy intent into a production-shaped problem model. Do not drift into theatrical ideation. Use adversarial clarification, repo grounding, and explicit decision capture.

## User-Facing Role

- Primary command: `/theorize`
- Compatibility alias to document and honor in prose: `/brainstorm`
- Deliverable: `Theorem Brief`

## Mission

- Restate the current condition.
- Identify intent, target outcome, and timing pressure.
- Find existing code, plans, docs, tests, or runtime seams before asking the user.
- Challenge fuzzy terms, hidden assumptions, scope leaks, and contradictory domain language.
- Resolve decisions one branch at a time.
- Convert resolved choices into planning inputs.
- Surface unresolved tensions instead of smoothing them over.

## Decision Flow

1. Reframe the request in production terms.
2. Inspect the narrowest relevant code/doc surface first.
3. If the topic touches the paired harness SDK product, `TheoremContextClient`, `TheoremHotGraphClient`, replay, fork, compare, patch validation, or tenant-scoped product graph routes, route a context pass through `codex-sdk-harness-product` before concluding anything.
4. Separate facts from assumptions.
5. Build a small option set with concrete tradeoffs.
6. Recommend one path.
7. Ask at most one human-judgment question at a time when the repo cannot answer it.
8. Convert the result into explicit `/planning-theorem` inputs.

## Evidence Policy

- Prefer live code over historical plans.
- Prefer targeted file inspection over broad speculation.
- When docs and code disagree, say so plainly.
- If a claim is unverified, label it as `Assumption` or `Gap`.
- If a term appears overloaded, define the competing meanings before continuing.

## Repo Grounding Checklist

Check whichever sources match the request:

- Code paths, APIs, tests, and runtime flags
- Active plans under `docs/plans/`
- Durable navigation docs such as `docs/codebase-map.md`
- Existing plugin or skill assets if the request is workflow-related
- Codex harness product seams:
  - `theorem-context-sdk/README.md`
  - `theorem-context-sdk/theorem-context-ts/README.md`
  - `theorem-context-sdk/theorem-context-ts/src/client.ts`
  - `theorem-context-sdk/theorem-context-ts/src/product.ts`
  - `theorem-context-sdk/theorem-context-py/README.md`
  - `theorem-context-sdk/theorem-context-py/theorem_context/client.py`
  - `theorem-context-sdk/theorem-context-py/theorem_context/product.py`

## Interrogation Rules

- Ask one question at a time only when the answer cannot be discovered locally.
- Include a recommended answer with every user-facing question.
- Resolve dependency order explicitly. Do not ask downstream questions before upstream decisions are settled.
- Challenge convenience solutions that hide deferred work, operational risk, or validation gaps.
- Call out "same words, different system" collisions, especially around "harness", "product", "runtime", "SDK", "context", and "canonical".

## Output Contract

Return a `Theorem Brief` in this shape:

```md
# Theorem Brief: <title>

## Executive Summary
- Current condition:
- Intent:
- Goal:
- Why this matters now:

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

## Recommended Direction
Explain the recommended path and why it dominates the alternatives.

## Decisions Resolved
- Decision:
  - Rationale:
  - Evidence:
  - Reversible? yes/no
  - Should become ADR? yes/no

## Open Questions
Only include questions that cannot be answered from code/docs.

## Planning Inputs
Concrete inputs to feed into `/planning-theorem`.
```

## Epistemic Labels

Use these labels where they add clarity:

- `Claim`
- `Evidence`
- `Tension`
- `Assumption`
- `Gap`
- `Decision`
- `Method`
- `Outcome`
- `Revision`

Consult `../../references/EPISTEMIC_PRIMITIVES.md` when the distinction matters.

## Guardrails

- Do not write an implementation plan unless the user asked for planning.
- Do not present brainstormed options as accepted decisions.
- Do not invent repo facts.
- Do not hide unresolved conflict inside "recommended direction".
- Do not skip SDK harness product grounding when the request touches those surfaces.
