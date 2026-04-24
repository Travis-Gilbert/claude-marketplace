# Pattern: Functional Decomposition

See: `lib/functional-decomposition/SKILL.md` and `references/methodologies/incose-functional-decomposition.md`.

## Concrete example

Feature: share projects.

```
Share projects
├── User initiates share
│   ├── Add Share button to project card
│   ├── Open share modal on click
│   └── Capture recipient input with validation
├── System records share
│   ├── Create Share model + migration
│   ├── Write create-share endpoint
│   └── Add authorization check (owner-only)
├── Recipient is notified
│   ├── Emit ShareCreated event
│   ├── Email handler
│   └── In-app handler
└── Recipient accesses shared project
    ├── Accept-share endpoint
    ├── Grant read permission on accept
    └── "Shared with you" dashboard section
```

## Conventions

- Top = feature name (verb + object).
- Middle = sub-capabilities (verb + object).
- Leaves = tasks (verb + object).
- Depth 2-3 only.

## Rules

- Every node is verb + object. "Share" alone is not; "Share projects" is.
- Every leaf is implementable by one person in 2-5 minutes (or one task unit).
- No solo leaves (a sub-function with one child should collapse).
- No components as nodes (UI widgets, DB tables, class names).

## Plan integration

- Leaves → tasks in `implementation-plan.md`, one leaf per task (small leaves may cluster).
- Sub-functions → section headers in the plan.
- Tree in `design-doc.md` under `## Functional Decomposition`.

## When to draw

- Multi-surface features (3+ architectural layers)
- Features that would otherwise be a flat list of 10+ tasks
- Features where a stakeholder needs to verify completeness

## When to skip

- Single-surface features
- Features with fewer than ~5 tasks
- Bug fixes

## Anti-patterns

- Components as nodes ("Share button", "Share form", "Share endpoint"). Those are artifacts, not capabilities.
- Mixed abstraction levels ("User signs up" next to "Hash password"). Signup contains hashing.
- Decomposing for its own sake. If the feature is simple, don't decorate it with a tree.
