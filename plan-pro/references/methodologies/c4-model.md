# C4 Model

Source: Simon Brown, [c4model.com](https://c4model.com/).

Four levels of architectural zoom. plan-pro uses the top two.

## The levels

1. **Context**: the system as a box, surrounded by users and external systems.
2. **Container**: the system broken into deployable units (web app, API, database).
3. **Component**: one container broken into modules/packages.
4. **Code**: class-level detail (rarely needed; IDE shows this).

plan-pro uses **Context** + **Container** in design-doc.md. Components are drawn only when a feature spans multiple components within a single container.

## Context sketch format

ASCII is fine. Boxes + arrows + labels on arrows.

```
 ┌─────────┐         ┌──────────────┐        ┌──────────┐
 │  User   │ ──HTTP──▶│  Web app     │───SQL──▶│ Postgres │
 └─────────┘         │  (Next.js)   │        └──────────┘
                     └──────┬───────┘
                            │ REST
                            ▼
                     ┌──────────────┐
                     │  API         │
                     │  (Django)    │
                     └──────────────┘
```

## Container sketch

Same shape, one level down. Inside the "Web app" box above:

```
  ┌──────────────────────────────────┐
  │ Next.js                          │
  │  ┌────────┐  ┌────────┐          │
  │  │  App   │──│ Route  │──────────┼───▶ Django API
  │  │ router │  │handlers│          │
  │  └────────┘  └────────┘          │
  │       │                          │
  │       ▼                          │
  │  ┌────────┐                      │
  │  │  UI    │                      │
  │  │components│                    │
  │  └────────┘                      │
  └──────────────────────────────────┘
```

## When to draw

- New system (in research-brief.md or design-doc.md)
- Major feature that crosses containers
- Feature that introduces a new container (e.g., adding a worker or a cache)

Skip for single-component changes.

## Where to put it

In `design-doc.md` under `## Architecture sketch`.

## The key insight

C4 is about **naming boxes clearly**, not about tools. The ASCII is the sketch — don't block the plan on picking a diagramming tool.

## Anti-pattern

- Showing the code-level diagram. IDE handles that.
- Drawing every class as a box. That's UML soup. Boxes should be deployable or architecturally-significant units.
