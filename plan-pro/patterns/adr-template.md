# Pattern: ADR (Lightweight MADR)

See also: `references/methodologies/adr-madr.md` for the full methodology. Template file: `templates/adr.md`.

## Concrete example (as filled-in pattern)

```markdown
# 0003. Use Django Ninja for the public API

_Date: 2026-04-23_
_Status: accepted_

## Context

The public API needs OpenAPI schema generation, strong typing, and async support.
DRF's schema generation is fragile and async support is limited. The team uses
Pydantic elsewhere.

## Decision

Use Django Ninja for new public API endpoints. Keep DRF for the existing
admin-facing internal API.

## Consequences

- OpenAPI schema matches types automatically
- Pydantic reusable across API + worker code
- Two frameworks in the codebase until / unless admin API migrates
- Smaller community; fewer third-party packages
```

## Rules

- One decision per file. Compose by linking, not by cramming.
- Under 30 lines. The ADR you'll re-read is short.
- Present tense for Decision. Past tense for Context (it led here). Future for Consequences (what this means).
- No prose padding. If the section is one sentence, one sentence.
- No preamble. The title is the lede.

## Filenames

`docs/plans/<slug>/decisions/NNNN-<decision-slug>.md` — NNNN zero-padded (0001, 0002, 0003, …).

## Status values

- `proposed`
- `accepted`
- `superseded by NNNN`
- `deprecated`

Change status, don't delete. History is the point.

## Anti-pattern

- Long "Alternatives considered" section. If alternatives matter, they're each their own ADR or a one-line note in Consequences. Don't reopen the debate inside the ADR.
- ADRs for trivial decisions. The formatter's output is a decision; it doesn't get an ADR.
- ADRs written after the fact as justification. They're for in-the-moment reasoning, not retrospective rationalization.
