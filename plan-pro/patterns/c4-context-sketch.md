# Pattern: C4 Context Sketch

See: `references/methodologies/c4-model.md` for the full model.

## ASCII is fine

A pattern, not a drawing tool. Render as text in `design-doc.md`. If the user wants a rendered diagram later, they can copy the ASCII into a tool.

## Context level

System as a box, users and external systems around it.

```
 ┌─────────┐         ┌────────────────┐         ┌──────────┐
 │  User   │──HTTP──▶│  The System    │──SMTP──▶│  Sendgrid│
 └─────────┘         │  (plan-pro app)│         └──────────┘
                     │                │
                     │                │──HTTP──▶┌──────────┐
                     │                │         │ Stripe   │
                     └────────────────┘         └──────────┘
```

Labels on arrows. Protocol or purpose. Not both unless both matter.

## Container level

One level down. Inside "The System":

```
  ┌─────────────────────────────────────────────────────┐
  │  The System                                         │
  │                                                     │
  │   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
  │   │ Next.js  │──▶│ Django   │──▶│ Postgres │        │
  │   │ (app)    │   │ (API)    │   │          │        │
  │   └──────────┘   └─────┬────┘   └──────────┘        │
  │                        │                            │
  │                        ▼                            │
  │                  ┌──────────┐                       │
  │                  │ RQ worker│                       │
  │                  └──────────┘                       │
  └─────────────────────────────────────────────────────┘
```

## Rules

- **Box = deployable unit or architecturally-significant module**. Not a class. Not a file.
- **Arrow = meaningful integration**. Not "they talk sometimes" — "every request goes through here" or "this event flows here".
- **Label arrows**. "HTTP" is OK. "calls" is not — every arrow is a call; tell me what kind.

## When to draw

- New system → context diagram in `research-brief.md`
- Feature introducing a new container → container diagram in `design-doc.md`
- Complex feature spanning 3+ containers → both levels

## When to skip

- Features inside a single container
- Bug fixes
- Refactors that don't move boxes

## Tooling (if you must)

If ASCII isn't enough:
- [Structurizr](https://structurizr.com/) — C4 native, text-based DSL
- Mermaid's `flowchart` — render in markdown
- Excalidraw — hand-drawn aesthetic, export SVG

But start with ASCII. 90% of the benefit of a C4 sketch is naming the boxes clearly; tooling doesn't help with that.
