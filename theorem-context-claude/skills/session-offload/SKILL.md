---
name: session-offload
description: Use this skill when a sub-task ends, a tool result is verbose, a decision or assumption should be preserved, or a plan step has just completed and should stop occupying live context.
---

# Session Offload

Use `theorem_session_offload` when the useful part of the current context should
survive the session but does not need to stay in the model's active window.

Mental model: write it down, then stop carrying it.

## When To Offload

- A sub-task ended and its result will matter later.
- A tool result was long, but only a short summary is worth keeping.
- A decision, assumption, or observation should be recoverable.
- A plan step completed and the next step can start with a clean working set.

## Kinds

- `decision`: a choice that should guide future work.
- `assumption`: a premise to revisit if evidence changes.
- `observation`: a repo/runtime fact found during investigation.
- `plan_step`: the current or next concrete step in a plan.
- `working_summary`: a compact handoff of a completed sub-task.

## Defaults

Use `evict_local=true` for completed sub-task summaries and verbose tool-result
summaries. Use `evict_local=false` for live plan steps that should still be
eligible for Pairformer injection.

Call `theorem_session_recall` when the model needs a prior offload back in the
active context window.
