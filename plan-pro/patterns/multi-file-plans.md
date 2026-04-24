# Pattern: Multi-File Plans (Index + Sub-Plans)

Large plans exceed what an agent can author or consume in one pass. Split by stage: one index, one sub-plan per stage, plus an optional cross-cutting file.

## When to split

Split when ANY hold:
- The design-doc names **≥4 stages** (Stage 0, Stage 1, …)
- Estimated total tasks **≥10**
- A single authoring pass would exceed **~2,500 words of plan text**
- User explicitly requests multi-file

Otherwise: single `implementation-plan.md` as usual.

## Structure

```
docs/plans/<slug>/
├── implementation-plan.md        # INDEX — stages, order, totals
├── 01-stage-foundation.md        # sub-plan (numeric prefix for stable sort)
├── 02-stage-ingest.md
├── 03-stage-train.md
├── ...
└── cross-cutting.md              # optional — tasks spanning multiple stages
```

Stage files are numbered with a zero-padded prefix so `ls` sorts them in execution order. The slug after the prefix is descriptive. Sub-stages keep the parent number (e.g., `03a-engine-settle.md`, `03b-export.md`).

## Index file format

`implementation-plan.md` becomes an index, not a plan body:

```markdown
# Implementation Plan: <topic>

_Multi-file plan. Each stage is its own file. Execute in order._

## File structure

<full tree of what stages will create — same as single-file plans>

## Stages

| # | File | Title | Tasks | Delegates to |
|---|------|-------|-------|--------------|
| 0 | [01-stage-foundation.md](01-stage-foundation.md) | Foundation | 5 | plan-pro (self) |
| 1 | [02-stage-ingest.md](02-stage-ingest.md) | Ingest pipeline | 7 | django-engine-pro |
| 2 | [03a-engine-settle.md](03a-engine-settle.md) | Engine settle | 4 | ml-pro |
| 2 | [03b-export.md](03b-export.md) | Export format | 3 | ml-pro |
| ... | ... | ... | ... | ... |
| — | [cross-cutting.md](cross-cutting.md) | Cross-cutting | 3 | various |

## Execution order

Sub-plans run sequentially unless the index marks two explicitly parallel-safe. The executor re-reads each sub-plan JUST BEFORE dispatching its tasks (just-in-time discipline: upstream stages may have produced insights that amend downstream stages).

## Totals

- <N> tasks across <M> files
- Estimated delegation: <K> specialists
```

## Sub-plan file format

Each `NN-stage-<slug>.md` file is a regular plan body — same shape as a single-file `implementation-plan.md`:

- File structure note (subset of the full tree, the files this stage touches)
- Task list (5-8 bite-sized tasks, TDD-shaped)
- Completion criteria for this stage

No index-level content. No reference to other stages beyond imports.

## Cross-cutting file (optional)

Tasks that logically span stages (observability hooks, shared utilities, documentation updates) go in `cross-cutting.md`. The index names where they execute (e.g., "run cross-cutting task 2 after stage 3 completes").

## Just-in-time discipline

The executor re-reads each stage's sub-plan JUST BEFORE dispatching its tasks. Reason: earlier stages may have produced output or discoveries that should amend later stages. If amendments are needed, invoke `retrofitter` against the specific sub-plan before executing it.

This is the C-discipline from the design conversation: write the whole map up front (approach A), but stay flexible at the execution boundary (approach C).

## plan-writer behavior

1. After writing the design-doc, decide: single or split?
2. If split: write `implementation-plan.md` as index, then write each stage file in sequence.
3. The index is written FIRST (so the reader sees the map), stage files SECOND (in order).
4. plan-reviewer audits the index AND every stage file. Cross-references (a stage referencing another stage's function) must resolve.

## executor behavior

1. Read `implementation-plan.md` — if it has a "Stages" table, it's an index.
2. For each stage in order:
   a. Re-read the stage file (catches any retrofit).
   b. Execute its tasks per the normal task flow (domain-router → dispatch → reviews).
   c. Commit after each task.
   d. At stage boundary: run stage-scoped integration test if the stage file defines one.
3. At the end of all stages: auto-/review over the full implementation.

## retrofitter behavior

`/retrofit <path>` works on either:
- A single `implementation-plan.md` — retrofits in place (normal behavior)
- An index file — retrofits the index AND each referenced stage file
- A single stage file — retrofits that one file, leaves the index alone (unless task count changes)

## Anti-patterns

- **Arbitrary splits** (by file count, by alphabet) — split by stage only. Stages reflect the design's natural phases.
- **Over-splitting** — <4 stages doesn't need multi-file. Keep it a single plan.
- **Under-splitting** — 15 tasks in one file works until an agent truncates mid-authoring. Use the threshold.
- **Reading all sub-plans upfront at /execute** — defeats JIT discipline. Read each stage just before dispatching.
- **Cross-file task cross-references without imports** — if Stage 2's tasks reference a function from Stage 1, Stage 1 must `Delegate to:` has already created it (confirmed by spec-reviewer at Stage 1 completion).

## Size heuristics (quick reference)

| Tasks | Stages | Layout |
|-------|--------|--------|
| ≤9 | 1-3 | Single `implementation-plan.md` |
| 10-20 | 3-5 | Index + 3-5 stage files |
| 20-40 | 5-8 | Index + 5-8 stage files, possibly sub-stages |
| 40+ | 8+ | Index + many stage files, likely sub-stages, cross-cutting file |
