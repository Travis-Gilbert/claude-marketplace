# INCOSE Functional Decomposition

Source: INCOSE Systems Engineering Handbook, systems engineering tradition.

Decompose a capability into a tree of verb-object leaves. Each leaf is a task.

## The rules

1. **Top**: a verb + object (the feature).
2. **Children**: sub-capabilities, not components. "User identifies recipient" not "Recipient input field".
3. **Leaves**: implementation-bounded (one person, one task). Verb + object.
4. **Depth**: 2-3 levels. Deeper = over-decomposing.

## Example

```
Share projects
├── User initiates share
│   ├── Add Share button to project card
│   ├── Open share modal on click
│   └── Capture recipient input with validation
├── System records share
│   ├── Create Share model + migration
│   ├── Write create-share endpoint
│   └── Add authorization check
├── Recipient is notified
│   ├── Emit ShareCreated event
│   ├── Email handler
│   └── In-app handler
└── Recipient accesses shared project
    ├── Accept-share endpoint
    ├── Grant read permission
    └── Shared-with-you dashboard section
```

## Why it helps planning

- Missing branches are obvious (no "recipient accesses" branch? Feature's not done.)
- Every leaf maps to a task; plan size is predictable
- Stakeholders who don't think in code can read it
- Mid-plan, if you're stuck, check which branch you're stuck on

## When to use

Multi-surface features (3+ architectural layers). Skip for single-surface features.

## Anti-patterns

- Entities as leaves: "User", "Project", "Share" — that's a data model, not a function
- Single-leaf branches: if a sub-function has one leaf, it's not a sub-function, just a leaf
- Mixing abstraction levels: "User signs up" and "Hash the password" as siblings — signup contains hashing
