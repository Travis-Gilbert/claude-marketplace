# ADR (MADR format)

Sources: [Michael Nygard's ADR post](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions), [MADR template](https://adr.github.io/madr/), joelparkerhenderson/architecture-decision-record (cloned into `refs/adr-templates/`).

An ADR is a lightweight record of a non-trivial architectural choice.

## When to write one

Write an ADR when a choice:
- Had an alternative that was considered
- Is hard to reverse later
- Would confuse someone reading the code in six months
- Picks a framework, library, pattern, or data shape

Skip for:
- Style decisions (let the formatter decide)
- Decisions already encoded in CLAUDE.md
- Decisions with no alternative

## MADR format (minimal)

File: `docs/plans/<slug>/decisions/NNNN-<slug>.md`

```markdown
# NNNN. <decision title>

_Date: YYYY-MM-DD_
_Status: accepted_

## Context

<2-4 sentences on the forces that led to this decision: what constraints, what alternatives, what changed>

## Decision

<One sentence: what was decided>

## Consequences

- <positive consequence>
- <negative consequence / cost>
- <what this enables or blocks downstream>
```

## Example

```markdown
# 0003. Use Django Ninja instead of DRF for the public API

_Date: 2026-04-23_
_Status: accepted_

## Context

The public API needs OpenAPI schema generation, strong typing, and async support.
DRF's schema generation is fragile and async support is limited. The team already
uses Pydantic elsewhere in the project.

## Decision

Use Django Ninja for all new public API endpoints. Keep DRF for the admin-facing
internal API (already built, no migration needed).

## Consequences

- OpenAPI schema matches types automatically; no drift
- Team can reuse Pydantic schemas across API and worker code
- Two API frameworks in the codebase until the admin API is migrated (if ever)
- Django Ninja has a smaller community than DRF; fewer third-party integrations
```

## Statuses

- `proposed` — draft, not yet accepted
- `accepted` — current
- `superseded by NNNN` — another ADR replaced this one
- `deprecated` — no longer relevant

Only change status, never delete ADRs. The history is the value.

## Length

Under 30 lines. An ADR you can read in one breath is one you'll actually read later.

## Storage

ADRs live alongside the plan they informed: `docs/plans/<slug>/decisions/`. Not in a separate ADR repo. Distance from the decision makes the decision invisible.

## Template

Use `templates/adr.md` — fill in the blanks.
