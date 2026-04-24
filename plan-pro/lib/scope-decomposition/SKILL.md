---
name: scope-decomposition
description: "Detect multi-subsystem requests. If the input describes independent subsystems, split them into sub-projects and plan one. Heuristics: 3+ surfaces, 2+ data stores, 2+ user roles."
---

# Scope Decomposition

A plan that tries to cover three independent subsystems is three plans wearing a trench coat. Detect, decompose, defer.

## Detection heuristics

Flag multi-subsystem if ANY hold:

- **Three or more top-level surfaces**: "auth + billing + admin + analytics"
- **Two or more independent data stores**: "user DB + event store + analytics warehouse"
- **Two or more user roles with independent flows**: "customers can X, and admins can Y, and vendors can Z"
- **"And" conjunction between noun phrases that aren't features of one thing**: not "dark mode and keyboard shortcuts" (both belong to settings) — yes "dark mode and billing" (two unrelated axes)
- **Timeline spans multiple quarters** when said aloud: if you'd say "we'll ship this over 3 months", that's multiple sub-projects

## When NOT to flag

- A single feature with multiple steps (auth with signup + login + reset is still one sub-project)
- UI + backend of the same feature (that's one feature with two surfaces)
- A feature with migration + implementation + tests (that's task decomposition, not sub-project decomposition)

## Action on detection

1. **Name the sub-projects.** Each gets a slug. Example: `auth`, `billing`, `admin-dashboard`, `analytics`.
2. **Pick one sub-project to plan now.** Use this priority order:
   a. The one that unblocks the others (`auth` usually wins)
   b. The smallest, if no clear unblocker
   c. The one the user named first
3. **Defer the rest.** Write them into the design doc's `## Scope note` section.
4. **Do not ask the user for permission.** Deferring is reversible — they can `/plan <deferred-slug>` later.

## Output

Append to `design-doc.md`:

```markdown
## Scope note

This plan covers: **<selected-slug>** — <one-line description>.

Deferred to separate plans:
- `<slug-2>` — <one-line>
- `<slug-3>` — <one-line>

Run `/plan <slug-2>` etc. when ready.
```

## Anti-pattern

Do not write a plan whose tasks span multiple sub-projects with "we'll circle back" language. That plan cannot be reviewed, executed, or estimated coherently. Split before writing.
