---
name: theorems-harness
description: Theorem's Harness default plugin skill. Use for planning, implementation, debugging, review, context preparation, validation, reporting, cross-agent coordination, typed memory, encode, run lifecycle, replay, fork/compare, fractal search, code search, or V3 harness state-machine work. Triggers on /harness, "Theorem's Harness", "begin a harness run", "coordinate with Claude", "check mentions", "agent memory", and "plan/execute through the harness".
---

# Theorem's Harness

Theorem's Harness is the plugin and public product surface. It owns the full
workflow: observe, plan, compile context, coordinate, delegate, execute,
validate, report, and learn. The SDK is plumbing, MCP is the tool bus, and slash
commands/skills are the product layer.

## When to use

Use this by default when the user wants Theorem's Harness to do grounded work:

- plan, implement, debug, review, research, validate, or produce a report
- compile context or refresh working context as part of a larger task
- coordinate with Claude Code, Codex, Claude.ai, or another agent
- begin, step, replay, fork, or compare a harness run
- fractal-expand search or gather evidence into a run
- save/revise/archive typed agent memory or encode a durable lesson
- route across plugins, agents, Redis harness specialists, or code/context tools

Not for: graph reads (use `mcp__rustyred-thg__*`), document writes (use `document_write`), pure Django mutations (use the relevant verb directly).

## Public command role

- Primary command: `/harness`
- Utility commands:
  - `/context-refresh` for narrow context refresh only.
  - `/coordinate` for cross-agent presence, @mentions, and waits only.
  - `/encode` for feedback, solution, or postmortem memory only.
  - `/research` for direct fractal expansion / gap-frontier discovery only.
  - `/compute_code` for graph-structural code ranking only.

## Internal modes

Use modes as phases inside the Harness, not separate products:

- `observe`: understand the task, repo, and current run state.
- `theorize`: explore options before commitment.
- `plan`: produce checklist-first implementation plans.
- `execute`: modify files, run checks, and reconcile the checklist.
- `coordinate`: heartbeat, send/receive mentions, and avoid overlap.
- `compile_context`: refresh or build the Context Artifact.
- `validate`: run focused checks, visual gates, and production gates.
- `remember`: encode lessons, postmortems, and memory candidates.

Do not present `orchestrate` as the product name in user-facing output. It is
only an internal/backend word during the route migration.

## Workflow

1. Observe the live repo/tool state and identify the smallest real surface.
2. Choose a Harness mode: theorize, plan, execute, coordinate, compile_context,
   validate, or remember.
3. Build stable checklist IDs before multi-step execution.
4. Compile or refresh context when the task has drifted or the repo surface is
   larger than the current prompt.
5. Coordinate before overlapping with another active agent.
6. Execute with focused edits, tests, and validation.
7. Reconcile the checklist and report what is done, partial, blocked, skipped,
   or failed.
8. Encode high-signal lessons or postmortems when they will help a future run.

## Tools owned (Theorem MCP, Form-B short names)

| Verb | Purpose |
|---|---|
| `harness_toolkit` | Compile or inspect the task toolkit from `task_type`, `permissions`, and `scope` before a run |
| `harness_begin` | Open a new harness run (task, actor, scope) |
| `harness_step` | Record a step inside an open run (tool_call / observation / decision) |
| `harness_search` | Native search inside the run, recording tool_call + observation steps |
| `harness_fractal_expansion` | Query-driven fractal search; optionally records into a run |
| `code_search` | Search ingested code symbols through the CodeCrawler service / code graph |
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

## Slim MCP launch aliases

The local `theorems-harness` MCP server also exposes launch-facing aliases that
wrap current shipped SDK/backend routes:

| Tool | Purpose |
|---|---|
| `context_compile` | Compile an explicit Context Theorem artifact for a task |
| `code_crawl` | Ingest or refresh a repository in the CodeCrawler/code graph |
| `fractal_expand` | Launch-facing alias for `harness_fractal_expansion` |
| `instant_kg_status` | Check tenant-scoped Instant KG readiness through THG product |
| `instant_kg_reingest` | Enqueue fresh Instant KG capture/reingest in Index-API |
| `provenance_trace` | Read reasoning trace provenance or object-specific trace explanations |
| `recall` | Preview saved-context recall for a task |
| `remember` | Save reusable context through the harness memory substrate |
| `relate` | Record a typed THG relation without claiming canonical graph promotion |
| `domain_list` | List available Context Theorem domain packs |
| `domain_install` | Install one to three domain packs for a user |

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

For code search:
- `code_search(query='CodeCrawlerService', limit=20)` — discover symbols before asking for `code_context`, `code_impact`, or `code_explain`.
- `code_crawl(repo='owner/repo')` — operator-approved crawl/ingest before deeper Pairformer or code-search work.

For Pairformer / graph readiness:
- `instant_kg_status(tenant_slug='...')` — check the THG-backed Instant KG runtime.
- `instant_kg_reingest(input='https://...', kind='url')` — enqueue a fresh capture when evidence is stale.
- `provenance_trace(trace_id='...', object_pk=123)` — explain how a trace used a specific object.

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
- Don't use `document_write(kind='draft')`; drafts should be `self_note` or a supported document kind such as `scratch`, `markdown`, `insight`, `handoff`, `solution`, or `postmortem`.
- For agent-to-agent work, heartbeat first, then `coordinate`, then let the target actor call `mentions_wait` when it needs a ping-like wakeup. The UI is observational; the queue and presence substrate are enough for headless communication.
- `mentions_wait` is a short long-poll in one MCP request thread, not a permanent listener. Use the 30 second default at checkpoints; the service caps waits at 120 seconds.
- Agents may call `encode` without a user slash command when a session produces a durable lesson, but should avoid raw secrets and summarize sensitive evidence.

## Anti-patterns

- Don't call `harness_step` without first calling `harness_begin` — there's no run to step.
- Don't fork without comparing — `harness_fork` followed by `harness_compare` is the canonical exploration loop.
- Don't use `harness_search` as a general-purpose search; it's bound to a run. For untethered search, use `mcp__rustyred-thg__fulltext.search`.

## Native dispatch

`harness_fractal_expansion` is a Lane-B hybrid tool: handler runs in the Python MCP process but invokes `theseus_native.push_ppr` (Rust via PyO3) for the actual graph compute. If you see the deploy log `WARNING apps.notebook.native_dispatch FALLBACK: Python push_ppr running...`, the wheel isn't installed in the runtime container and PPR is hitting the slow Python path. Surface this to the operator; the fix is the Dockerfile wheel-install pattern from Dockerfile.web / Dockerfile.worker.
