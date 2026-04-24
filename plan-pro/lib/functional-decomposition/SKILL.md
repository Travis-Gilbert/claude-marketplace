---
name: functional-decomposition
description: "INCOSE-derived feature trees. Top function → sub-functions → leaves. Each leaf becomes a task. Use for multi-surface features (3+ architectural layers)."
---

# Functional Decomposition

INCOSE systems engineering: decompose a capability into verb-object leaves that map cleanly to implementation tasks.

## When to use

- Feature spans 3+ architectural surfaces (UI + API + data + infra)
- Feature has enough complexity that a flat task list would obscure structure
- You need to communicate the feature to a stakeholder who doesn't think in code

Skip for single-surface features, simple CRUD, and features with fewer than ~5 tasks.

## The rules

1. **Top function is a verb + object** matching the feature ("share projects", "configure notifications").
2. **Children are sub-capabilities**, not components. "User identifies recipient" not "Recipient input field".
3. **Leaves are implementation-bounded** — a single person / task unit can complete one.
4. **Every leaf is a verb + object**. "Create share button" is a leaf. "Design share flow" is not (it's meta).
5. **Tree depth: 2-3 levels**. Deeper means either over-decomposing or mixing abstraction levels.

## Example

```
Share projects
├── User initiates share
│   ├── Add "Share" button to project card
│   ├── Open share modal on click
│   └── Capture recipient input with validation
├── System records share
│   ├── Create Share model and migration
│   ├── Write create-share endpoint
│   └── Add authorization check (owner-only)
├── Recipient is notified
│   ├── Emit ShareCreated event
│   ├── Email handler: template + send
│   └── In-app handler: create notification record
└── Recipient accesses shared project
    ├── Add accept-share endpoint
    ├── Grant read permission on accept
    └── Show "Shared with you" section in dashboard
```

12 leaves → 12 tasks (or clusters).

## Format in design-doc.md

```markdown
## Functional Decomposition

<paste the tree>

### Notes
- Leaves map 1:1 to tasks in implementation-plan.md unless marked otherwise.
- Cluster `<sub-capability>` into one task body when leaves are smaller than 2 min of work each.
```

## Plan integration

The plan-writer agent takes the leaves as the task skeleton. Each leaf becomes a task; small leaves may cluster.

## Why not a flat list?

A flat list hides the missing piece. A tree makes the absent branch obvious. "Wait, there's no 'recipient accesses shared project' branch — the feature's not actually done." That's worth catching before writing code.

## Why not an entity diagram?

Entity diagrams are good for data shape, not for capability. A feature is a capability to do something, not a set of tables. Start with functions; entities fall out of the leaves.

## Anti-pattern

Trees with one leaf per sub-function, or leaves that are clearly commands for a single person. That's not a tree — that's a list with extra steps. Collapse or re-decompose.
