# Host Repo Opt-In For Orchestrate And Harness

Use this when a repository wants to opt into Orchestrate-first and
harness-aware behavior for complex work.

The goal is not to force Orchestrate on every trivial task. The goal is to
encode repo preference for:

- complex multi-file implementation
- architecture or migration work
- context-heavy runs
- planner-plus-worker execution with `handoff=spark`

## AGENTS.md snippet

```md
## Orchestrate Opt-In

For multi-file, high-risk, long-running, or architecture-heavy work:

- prefer `/orchestrate mode=plan` for planning
- prefer `/orchestrate mode=plan handoff=spark` when the work can be split into
  bounded implementation slices while keeping the planner in-thread
- prefer harness-backed `prepare`, `preview`, and `run` surfaces when available

Do not force Orchestrate or harness usage for trivial, self-contained requests.
```

## CLAUDE.md snippet

```md
## Orchestrate / Harness Preference

This repository opts into Orchestrate-first workflow for complex work.

Guidance:

- use `/orchestrate mode=plan` or equivalent planning flow for migrations,
  architecture work, or multi-file execution
- use `handoff=spark` when a bounded coding slice can be delegated while the
  planner remains in-thread for review
- use harness-backed context preparation when available
- avoid over-orchestrating trivial asks
```

## Why this is useful

- keeps repo preference durable across sessions
- makes the planner-plus-worker workflow discoverable
- nudges the agent toward harness-backed context where it actually helps
- avoids turning every simple request into a heavy orchestration run

## Guardrail

Treat these snippets as preference signals, not absolute laws. If the task is
tiny, straightforward, or purely conversational, direct execution is still the
right choice.
