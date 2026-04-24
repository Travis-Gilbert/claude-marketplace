# Implementation Plan: <TOPIC>

_Multi-file plan. Each stage is its own file. Execute stages in order. See `patterns/multi-file-plans.md`._

## Overview

<one paragraph: what ships when every stage completes>

## File Structure

_Full directory tree of what this plan creates or modifies, across all stages._

```
<working-repo>/
├── <path>                              # <responsibility>
├── <path>                              # <responsibility>
├── apps/<app>/
│   ├── models.py                       # <responsibility>
│   └── ...
└── docs/plans/<slug>/
    ├── implementation-plan.md          # this index
    ├── 01-stage-<slug>.md
    ├── 02-stage-<slug>.md
    ├── 03a-stage-<slug>.md             # sub-stages use letter suffix
    ├── 03b-stage-<slug>.md
    ├── ...
    ├── cross-cutting.md                # optional
    ├── design-doc.md
    └── decisions/
        └── 0001-<slug>.md
```

## Stages

| # | File | Title | Tasks | Primary delegate |
|---|------|-------|-------|------------------|
| 0 | [01-stage-foundation.md](01-stage-foundation.md) | Foundation | 5 | plan-pro (self) |
| 1 | [02-stage-<slug>.md](02-stage-<slug>.md) | <title> | <N> | <plugin> |
| 2 | [03a-stage-<slug>.md](03a-stage-<slug>.md) | <title> | <N> | <plugin> |
| 2 | [03b-stage-<slug>.md](03b-stage-<slug>.md) | <title> | <N> | <plugin> |
| 3 | [04-stage-<slug>.md](04-stage-<slug>.md) | <title> | <N> | <plugin> |
| ... | ... | ... | ... | ... |
| — | [cross-cutting.md](cross-cutting.md) | Cross-cutting | <N> | various |

## Execution order

Stages run sequentially in the order listed above unless explicitly marked parallel-safe. The executor re-reads each stage's file JUST BEFORE dispatching its tasks — earlier stages may have surfaced discoveries that amend downstream stages (JIT discipline).

Cross-cutting tasks execute at the boundaries noted in `cross-cutting.md` (e.g., "after Stage 3 completes").

## Totals

- **<N> tasks** across **<M> files**
- Primary delegates: <list distinct plugins>
- Estimated stages with integration tests: <N>

## Completion criteria

- All stages complete; every sub-plan's tasks marked `[done]`.
- All commits landed.
- Full test suite passes: `<command>`.
- Auto-/review emits a clean `review-report.md`.
- <feature-specific criteria>
