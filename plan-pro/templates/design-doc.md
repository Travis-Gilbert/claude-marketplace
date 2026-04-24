# Design: <TOPIC>

_Design doc produced by /brainstorm. Feeds /write-plan._

## Problem

<one paragraph, lifted from problem-statement.md if it exists, else derived from research + user intent>

## Chosen approach

<the finalist — one paragraph on what it is and why it won>

## Alternatives considered

- **<alt-1>** — <one-line summary>; rejected because <reason>
- **<alt-2>** — <one-line summary>; rejected because <reason>

## Architecture sketch

<C4 context + container sketch — see references/methodologies/c4-model.md>

```
<ASCII diagram>
```

## Contracts (if pipeline / workflow)

<from contract-first-architect if invoked — see patterns/contract-first-design.md>

### Stage: <name>
- Input: <type>
- Output: <type>
- Failure: <behavior>

## Event flow (if workflow)

<from event-mapper if invoked — see patterns/event-storming-lite.md>

### Happy path
1. `EventName { payload }` → handler
2. ...

### Failure branches
- <branch>

## Functional decomposition (if multi-surface)

<from functional-decomposer if invoked>

```
<topic>
├── <sub-function>
│   ├── <leaf>
│   └── <leaf>
└── <sub-function>
    └── <leaf>
```

## Scope note

This covers: <selected sub-project>.
Deferred to separate plans:
- `<slug>` — <one-line>

## Decisions

<one line per ADR with link>
- [0001: <title>](decisions/0001-<slug>.md)
- [0002: <title>](decisions/0002-<slug>.md)

## Open questions for plan-writer

<only real gaps — not best-practices questions>

- <gap>
