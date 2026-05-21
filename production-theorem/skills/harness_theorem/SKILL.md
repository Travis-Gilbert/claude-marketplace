---
name: harness_theorem
description: Drive a Theseus database-harness run end-to-end. Use when the user asks to begin a run, record harness steps, replay a session, fork a run, compare alternatives, fractal-expand search, or work the V3 harness state machine. Triggers on phrases like "begin a harness run", "step the harness", "replay this run", "fork run", "compare runs", "harness toolkit", "fractal expansion".
---

# harness_theorem

Orchestration skill for the Theorem-side `harness_*` cluster on the Theorem MCP. Chains the 10 harness verbs into the canonical run lifecycle so the agent doesn't have to invent the flow.

## When to use

User wants to operate the Theseus database harness directly:
- "Begin a new harness run for task T."
- "Step the run, then search inside it, then record the outcome."
- "Replay run R and show me where it diverged from run R'."
- "Fractal-expand from these seeds."

Not for: graph reads (use `mcp__rustyred-thg__*`), document writes (use `document_write`), pure Django mutations (use the relevant verb directly).

## Tools owned (Theorem MCP, Form-B short names)

| Verb | Purpose |
|---|---|
| `harness_toolkit` | Inspect the available toolkit for a run (selected_tools, scope, permissions) |
| `harness_begin` | Open a new harness run (task, actor, scope) |
| `harness_get` | Fetch run state (status, current step, artifact references) |
| `harness_step` | Record a step inside an open run (tool_call / observation / decision) |
| `harness_search` | Native search inside the run, recording tool_call + observation steps |
| `harness_fractal_expansion` | Personalized PageRank expansion from seed PKs (uses PyO3 native push_ppr) |
| `harness_context` | Compile the context artifact for the current run |
| `harness_patch` | Propose a patch to the harness's belief state (review-gated) |
| `harness_replay` | Get the full event timeline of a run |
| `harness_fork` | Fork a run at a given step to explore an alternative path |
| `harness_compare` | Compare two runs (state-hash diff, evidence overlap, divergence point) |

## Standard run-lifecycle flow

For "drive a harness run for task T":

1. `harness_begin(task=T, actor='agent')` — opens the run; returns `run_id`.
2. `harness_toolkit(run_id)` — confirm the run's permissions and selected tools.
3. Loop:
   a. `harness_step(kind='tool_call', payload=...)` for each tool the harness invokes.
   b. `harness_step(kind='observation', payload=...)` after each call.
   c. `harness_search(query=..., budget=...)` when the harness needs evidence.
4. `harness_context(run_id, budget_tokens=...)` — compile the final context artifact.
5. `harness_get(run_id)` — read back final state.

For fractal expansion (research / discovery):
- `harness_fractal_expansion(run_id, seeds=[pk1, pk2], depth=...)` — uses native PPR, much faster than Python fallback.

For replay / debugging:
- `harness_replay(run_id)` — full event timeline.
- `harness_compare(run_a, run_b)` — divergence analysis.

For exploration:
- `harness_fork(run_id, at_step=N)` — open a new run branched from step N of an existing run.

## Output discipline

- Always pass back the `run_id` to the user after `harness_begin` so they can resume.
- When a step records a `tool_call`, also record its `observation` — half-records make replays incoherent.
- Don't `harness_patch` without explicit user approval — patches are belief-state mutations; the human is the reviewer.

## Anti-patterns

- Don't call `harness_step` without first calling `harness_begin` — there's no run to step.
- Don't fork without comparing — `harness_fork` followed by `harness_compare` is the canonical exploration loop.
- Don't use `harness_search` as a general-purpose search; it's bound to a run. For untethered search, use `mcp__rustyred-thg__fulltext.search`.

## Native dispatch

`harness_fractal_expansion` is a Lane-B hybrid tool: handler runs in the Python MCP process but invokes `theseus_native.push_ppr` (Rust via PyO3) for the actual graph compute. If you see the deploy log `WARNING apps.notebook.native_dispatch FALLBACK: Python push_ppr running...`, the wheel isn't installed in the runtime container and PPR is hitting the slow Python path. Surface this to the operator; the fix is the Dockerfile wheel-install pattern from Dockerfile.web / Dockerfile.worker.
