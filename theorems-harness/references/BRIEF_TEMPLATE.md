# Theorem Brief Template

Optional template for resolving a fuzzy ask into a production-shaped problem
model. Use only the sections the work needs. A small clarification should not
adopt this whole shape.

## When This Full Shape Helps

- contested design decisions with real tradeoffs
- multi-option PRDs that need a recommendation
- overloaded terminology that needs naming and resolution
- repo evidence that contradicts an assumption and forces a re-frame
- decisions worth preserving across sessions as durable rationale

For small clarifications, 2-4 sentences inline is enough. Do not adopt this
template just to look rigorous.

## Template

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
Explain the recommended path and why it dominates the alternatives. Name
what would falsify the recommendation.

## Decisions Resolved
- Decision:
  - Rationale:
  - Evidence:
  - Reversible? yes/no
  - Should become ADR? yes/no

## Open Questions
Only include questions that cannot be answered from code/docs. Include a
recommended answer with each.

## Planning Inputs
Concrete inputs to feed into /harness mode=plan (or /planning-theorem):
- Goal:
- Constraints:
- Decisions locked:
- Decisions still open:
- Suggested starting slice:
```

## Epistemic Labels

Use these where the distinction matters:

- `Claim`
- `Evidence`
- `Tension`
- `Assumption`
- `Gap`
- `Decision`
- `Method`
- `Outcome`
- `Revision`

See `EPISTEMIC_PRIMITIVES.md` for the full set and when to reach for each.

## Rules That Travel With This Template

- Prefer live code over historical plans. When docs and code disagree, say
  so plainly.
- Two real options beats five fake ones.
- Ask at most one human-judgment question at a time, and only when the
  answer cannot be discovered locally.
- Include a recommended answer with every user-facing question.
- Hidden conflict in "recommended direction" is the failure mode this brief
  exists to prevent. Name tensions explicitly.
- After the brief, route to plan or execute. Theorize is not a permanent
  loop.
