---
name: harness_theorem
description: Drive a Theseus database-harness run end-to-end. Use when the user asks to begin a run, record harness steps, replay a session, fork a run, compare alternatives, fractal-expand search, coordinate with another agent, manage typed agent memory, or work the V3 harness state machine. Triggers on phrases like "begin a harness run", "step the harness", "replay this run", "fork run", "compare runs", "harness toolkit", "fractal expansion", "coordinate with Claude", "check mentions", "agent memory".
---

# harness_theorem

Orchestration skill for the Theorem-side harness cluster on the Theorem MCP. Chains the run-lifecycle, typed-memory, and headless coordination verbs into the canonical flow so the agent doesn't have to invent it.

## When to use

User wants to operate the Theseus database harness directly:
- "Begin a new harness run for task T."
- "Step the run, then search inside it, then record the outcome."
- "Replay run R and show me where it diverged from run R'."
- "Fractal-expand from these seeds."
- "Coordinate with Claude Code on this repo."
- "Check whether I have pending mentions."
- "Save/revise/archive this agent memory."

Not for: graph reads (use `mcp__rustyred-thg__*`), document writes (use `document_write`), pure Django mutations (use the relevant verb directly).

## Tools owned (Theorem MCP, Form-B short names)

| Verb | Purpose |
|---|---|
| `harness_toolkit` | Compile or inspect the task toolkit from `task_type`, `permissions`, and `scope` before a run |
| `harness_begin` | Open a new harness run (task, actor, scope) |
| `harness_step` | Record a step inside an open run (tool_call / observation / decision) |
| `harness_search` | Native search inside the run, recording tool_call + observation steps |
| `harness_fractal_expansion` | Query-driven fractal search; optionally records into a run |
| `harness_context` | Compile the context artifact for the current run |
| `harness_patch` | Propose a patch to the harness's belief state (review-gated) |
| `harness_replay` | Get the full event timeline of a run |
| `harness_fork` | Fork a run at a given step to explore an alternative path |
| `harness_compare` | Compare two runs (state-hash diff, evidence overlap, divergence point) |
| `self_note` | Save typed agent memory (`belief`, `convention`, `standing_intention`, `reasoning_record`, etc.) |
| `self_revise` | Create a revision-tracked memory replacement and supersede the prior atom |
| `self_archive` | Archive memory out of active recall while preserving audit history |
| `self_recall_archive` | Recall archived memory on demand |
| `encode` | Record feedback, solutions, and postmortems with outcome metadata and fitness signals |
| `coordinate` | Append a coordination message and queue `@actor` mentions |
| `mentions` | Load or consume pending mentions for an actor |
| `mentions_wait` | Block briefly until a pending mention arrives or the timeout expires |
| `presence` | Refresh, end, or read short-TTL actor presence |
| `subscribe` | Register an actor as polling a mention channel |

## Standard run-lifecycle flow

For "drive a harness run for task T":

1. `harness_begin(task=T, actor='agent')` — opens the run; returns `run_id`.
2. `harness_toolkit(task_type='research', permissions=[...], scope={...})` — confirm permissions and selected tools when you need a preflight.
3. Loop:
   a. `harness_step(run_id=run_id, kind='tool_call', payload=...)` for each tool the harness invokes.
   b. `harness_step(run_id=run_id, kind='observation', payload=...)` after each call.
   c. `harness_search(run_id=run_id, query=..., budget=...)` when the harness needs evidence.
4. `harness_context(run_id, budget_tokens=...)` — compile the final context artifact.
5. `harness_replay(run_id)` — read back the final event timeline when auditability matters.

For fractal expansion (research / discovery):
- `harness_fractal_expansion(query='...', run_id=run_id, top_k=20, budget={...}, scope={...})` — query-driven gap-frontier search. `run_id` is optional; when supplied, the search is recorded inside the harness run.
- For raw seed-PK PPR, use `ppr_neighborhood` on the Theorem MCP or `mcp__rustyred-thg__algorithm.ppr` directly.

For replay / debugging:
- `harness_replay(run_id)` — full event timeline.
- `harness_compare(before_run_id=run_a, after_run_id=run_b)` — divergence analysis.

For exploration:
- `harness_fork(run_id=run_id, through_step_id=step_id)` — open a new run branched through a specific step id.

For cross-agent coordination:
- `presence(actor='codex', mode='heartbeat')` — refresh this actor's TTL presence.
- `subscribe(actor='codex', doc_id='repo-or-task-channel')` — announce that this actor is polling a shared channel.
- `coordinate(message='@claude-code please validate TTL', urgency='ask')` — write to the shared coordination document and queue mentions.
- `mentions(actor='claude-code', consume=true)` — let the target actor load and optionally consume its inbox.
- `mentions_wait(actor='claude-code', timeout_seconds=30)` — wait briefly for a real ping instead of manually polling.

For typed agent memory:
- `self_note(content='...', memory_node_type='convention')` — capture a durable agent-scoped memory.
- `self_revise(doc_id='...', content='...', reason='...')` — preserve immutable supersession history.
- `self_archive(doc_id='...', reason='...')` and `self_recall_archive(query='...')` — move memory out of active recall and retrieve it explicitly.
- `encode(kind='solution', outcome='positive', content='...')` — preserve a high-signal solution, feedback item, or postmortem with graph fitness telemetry.

## Output discipline

- Always pass back the `run_id` to the user after `harness_begin` so they can resume.
- When a step records a `tool_call`, also record its `observation` — half-records make replays incoherent.
- Don't `harness_patch` without explicit user approval — patches are belief-state mutations; the human is the reviewer.
- For agent-to-agent work, heartbeat first, then `coordinate`, then let the target actor call `mentions_wait` when it needs a ping-like wakeup. The UI is observational; the queue and presence substrate are enough for headless communication.
- Agents may call `encode` without a user slash command when a session produces a durable lesson, but should avoid raw secrets and summarize sensitive evidence.

## Anti-patterns

- Don't call `harness_step` without first calling `harness_begin` — there's no run to step.
- Don't fork without comparing — `harness_fork` followed by `harness_compare` is the canonical exploration loop.
- Don't use `harness_search` as a general-purpose search; it's bound to a run. For untethered search, use `mcp__rustyred-thg__fulltext.search`.

## Native dispatch

`harness_fractal_expansion` is a Lane-B hybrid tool: handler runs in the Python MCP process but invokes `theseus_native.push_ppr` (Rust via PyO3) for the actual graph compute. If you see the deploy log `WARNING apps.notebook.native_dispatch FALLBACK: Python push_ppr running...`, the wheel isn't installed in the runtime container and PPR is hitting the slow Python path. Surface this to the operator; the fix is the Dockerfile wheel-install pattern from Dockerfile.web / Dockerfile.worker.
