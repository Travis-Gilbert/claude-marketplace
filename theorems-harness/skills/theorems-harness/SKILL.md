---
name: theorems-harness
description: Theorem's Harness default plugin skill. Use when the user invokes /harness or asks for grounded planning, implementation, debugging, review, context preparation, validation, reporting, cross-agent coordination, typed memory, encode, run lifecycle, replay, fork/compare, fractal search, code search, or harness-backed agent work.
---

# Theorem's Harness

Theorem's Harness is the public product layer for grounded agent work. The SDK
is plumbing, MCP is the tool bus, hooks provide ambient session support, and
skills/commands are the behavior contract that agents actually inhabit.

The core change: `/harness` is not a request to force one narrow mode. It is the
operator saying "use the harness for this session or task." After that, the
agent chooses the most useful capability mix, revisits that choice at
checkpoints, and keeps moving unless a real blocker requires user input.

## Session Contract

When the user invokes `/harness`, "Theorem's Harness", or an equivalent phrase:

1. Treat it as consent to use harness abilities for the active task.
2. Resolve the current task from the user's words and live repo state.
3. Select the first capability mix. Use `harness_route` when available; otherwise
   apply the routing rules below directly.
4. Work through short cycles: observe, choose, act, check, and decide whether to
   continue, pivot, coordinate, validate, remember, or report.
5. Keep the harness visible only where it helps the user trust the work. Do not
   narrate every internal switch.

The command may accept `mode=plan`, `mode=execute`, or similar hints, but hints
are not handcuffs. Honor the user's explicit intent, then add supporting
capabilities when the work needs them.

## Capability Palette

Use these as abilities inside one run, not as competing products:

| Capability | Use it when |
|---|---|
| `observe` | Ground the task in repo state, tool state, runtime state, and current context. |
| `theorize` | Several real approaches exist and a short option pass will avoid churn. |
| `plan` | The task needs stable acceptance criteria, a checklist, or multi-session memory. |
| `execute` | Files must change, tests must run, bugs must be fixed, or a slice must ship. |
| `diagnose` | A failure, regression, flaky test, deploy issue, or runtime surprise appears. |
| `coordinate` | Claude Code, Codex, Claude.ai, or another agent may overlap the work. |
| `ambition` | A build, plan, or handoff could be underscoped relative to what was asked. |
| `compile_context` | The prompt/context is stale, broad, or missing the source surface. |
| `research` | Evidence, graph search, code search, or external/current reality is needed. |
| `validate` | A claim needs tests, screenshots, deploy proof, replay, or runtime evidence. |
| `peer_review` | A risky diff, multi-agent edit, commit, PR, or launch-ready claim is near. |
| `remember` | The session produced a reusable lesson, decision, postmortem, or correction. |
| `report` | The user needs a concise, truthful closeout with done/partial/blocked state. |

## Routing Heuristics

- If the user asks to coordinate, message, ping, hand off, or work with another
  agent, start with `coordinate`, then return to the main work.
- If the user asks to implement, fix, ship, simplify, or run tests, start with
  `execute`; add `diagnose` when a failure is not yet understood.
- If the user asks for a plan, spec, migration, checklist, or multi-session
  strategy, start with `plan`; allow a bounded execution handoff only when the
  first slice is obvious or requested.
- If the user asks for research, evidence, graph search, code discovery, or
  current external facts, start with `research` or `compile_context`.
- If the user asks for review or a second model's view, start with
  `peer_review`; do not convert that into implementation unless asked.
- If the task is broad but actionable, use a short `theorize` pass, choose a
  default, and continue. Do not park in brainstorming.
- If hooks already injected a useful context brief, use it. If it is missing,
  stale, or contradicted by source code, refresh or inspect before relying on it.

Re-route whenever a material discovery changes the shape of the work, when a
third workaround appears in the same layer, before overlapping edits, and before
final claims.

## Adaptive Workflow

1. **Observe.** Check cwd/worktree, user intent, dirty files, relevant source,
   active context artifact, and pending mentions when another agent is involved.
2. **Choose.** Pick the next capability mix. A tiny task may be
   `observe -> execute -> validate -> report`; a complex task may add plan,
   coordination, peer review, and memory.
3. **Act.** Take the next bounded action. Prefer source-grounded edits and
   focused validation over broad theater.
4. **Check.** Run the narrow proof that matters: tests, build, browser, deploy,
   replay, screenshot, MCP response, or code inspection.
5. **Pivot.** If the evidence changes the task, update the checklist or route.
   If another agent is affected, coordinate before proceeding.
6. **Close.** Report truthfully. For high-signal lessons, encode or recommend a
   memory write. For risky multi-agent work, peer review before commit/PR.

## Public Command Role

- Primary command: `/harness`
- Utility commands:
  - `/context-refresh` for narrow context refresh only.
  - `/coordinate` for cross-agent presence, mentions, waits, and handoffs.
  - `/peer-review` for cross-frontier-model diff review before commit, PR, or
    launch-ready reporting.
  - `/encode` for feedback, solution, or postmortem memory.
  - `/research` for direct fractal expansion / gap-frontier discovery.
  - `/compute_code` for native CodeCrawler-backed code discovery, with graph-structural ranking fallback.

Compatibility commands such as `/execute` may remain installed, but new work
should prefer `/harness` plus adaptive routing.

## Tools Owned (Theorem MCP, Form-B Short Names)

| Verb | Purpose |
|---|---|
| `harness_route` | Choose the next capability mix for a task or checkpoint. |
| `harness_toolkit` | Compile or inspect the task toolkit from task type, permissions, and scope before a run. |
| `harness_begin` | Open a new harness run. |
| `harness_step` | Record a step inside an open run. |
| `harness_search` | Search inside the run, recording tool-call and observation steps. |
| `harness_fractal_expansion` | Query-driven fractal search; optionally records into a run. |
| `compute_code` | Search, explain, recognize, context-pack, or explore code through the native CodeCrawler / code graph read path. |
| `code_ingest` | Ingest, reindex, session-reingest, or record code-use receipts through the native CodeCrawler write path. |
| `harness_context` | Compile the context artifact for the current run. |
| `harness_patch` | Propose a patch to the harness belief state. |
| `harness_replay` | Get the full event timeline of a run. |
| `harness_fork` | Fork a run at a given step to explore an alternative. |
| `harness_compare` | Compare two runs. |
| `self_note` / `self_revise` / `self_archive` / `self_recall_archive` | Manage typed agent memory. |
| `encode` | Record feedback, solutions, and postmortems with outcome metadata. |
| `coordination_room` | Join, inspect, pause, resume, or stop durable room membership. |
| `coordination_intent` | Announce what you are doing, which files or concepts your hands are on, and any semantic overlap peers should read. |
| `coordination_reflection` | Write turn-end working memory for the next agent. |
| `coordination_decision` | Preserve a room-scoped choice with rationale. |
| `coordination_tension` | Surface a structural disagreement without blocking peer work. |
| `coordinate` | Append a coordination message and queue actor mentions. |
| `mentions` / `mentions_wait` | Load, consume, or briefly wait for pending mentions. |
| `presence` | Refresh, end, or read short-TTL actor presence. |
| `subscribe` | Register an actor as polling a mention channel. |
| `continuity_pack` | Persist graph-backed and disk-mirrored continuity before compaction or handoff. |

## Slim MCP Launch Aliases

The local `theorems-harness` MCP server also exposes launch-facing aliases:

| Tool | Purpose |
|---|---|
| `context_compile` | Compile an explicit Context Theorem artifact for a task. |
| `code_ingest` | Ingest or refresh a repository in the CodeCrawler/code graph. |
| `fractal_expand` | Launch-facing alias for `harness_fractal_expansion`. |
| `instant_kg_status` | Check tenant-scoped Instant KG readiness through THG product. |
| `instant_kg_reingest` | Enqueue fresh Instant KG capture/reingest. |
| `provenance_trace` | Read reasoning trace provenance. |
| `recall` / `remember` / `relate` | Preview, save, and connect reusable context. |
| `domain_list` / `domain_install` | List and install Context Theorem domain packs. |

## Coordination Rule

The heads are one agent with several hands (`codex`, `claude-code`, `claude-ai`),
not separate workers dividing the repo. Coordinate as a unit:

- Read the room (intents, reflections, open tensions) and drain mentions at
  turn-start, before planning edits.
- Write `coordination_intent` as an announcement: what you are doing now, which
  files or concepts your hands are on, and where semantic overlap may exist. It
  is not a lock.
- When your work semantically overlaps another head's work, build on its edit
  rather than yielding or waiting; held, not clobbered. A real disagreement is a
  `coordination_tension` you record and work around, not a silent overwrite.
- Send `coordinate` with an `@actor` only for a block or a fork that changes the
  next action. Ordinary progress goes in your announcement summary.
- Close your announcement at turn-end and write a `coordination_reflection` (and
  a `coordination_decision` for any architectural choice) so the next head
  resumes cold.

The durable model is room digest plus interrupt mailbox: membership, intents,
reflections, decisions, tensions, events, continuity packs, and pending mentions
survive head sleep; short-TTL presence only says who is fresh. Full protocol:
`skills/harness-coordinate/SKILL.md`.

## Hook Enforcement Layer

The plugin hook layer makes the highest-risk harness disciplines deterministic:

- `SessionStart` and build-shaped `UserPromptSubmit` events inject the ambition
  frame so plans do not shrink the request before execution begins.
- Handoff-shaped prompts emit `.harness/checklist.json` and mirror it into the
  coordination substrate as the shared contract.
- `Stop` blocks completion only while checklist items remain unresolved without
  verification evidence or a concrete deferral reason.
- `PostToolUse` records action, context, and coordination events without
  policing ordinary planning or status language.
- Investigation-shaped prompts inject the curiosity frame as an enricher, not a
  gate.
- `UserPromptSubmit` injects an ambient `## Code neighborhood` block when a
  tenant is set (`THEOREM_TENANT_ID`): PPR-ranked code hits over the merged
  committed-base + local-edit delta, with `file:line` and an "editing X reaches
  Y" impact block. Trust it as PPR-ranked; prefer drilling in by `node_id`
  (`compute_code` operation `context`/`explore`) over a fresh lexical search,
  and read the impact line before editing a load-bearing symbol.

## Output Discipline

- Do not ask the user to choose internal modes unless it is genuinely a product
  preference or unsafe to infer.
- Keep checklists as small as the work requires. A one-file fix may need only a
  two-line internal checklist; a launch or migration needs stable row IDs.
- Do not claim "done" unless validation supports it. Say partial, blocked,
  skipped, failed, or not-run when that is the truth.
- For UI visual work, include the UI Visual Milestone and the Do Not Downgrade
  gate from `../../references/UI_VISUAL_PROJECT_GATES.md`.
- For high-risk product, SDK, Redis, THG, deployment, or multi-agent work, use
  the relevant specialist agent or peer review before final claims.
- Encode only high-signal lessons. Keep secrets out of stored memory.
- Write a continuity pack before compaction, handoff, or a long pause when the
  next agent needs exact resume state.

## Anti-Patterns

- Freezing the whole session in `execute` after the evidence says to diagnose,
  coordinate, or refresh context.
- Treating `/harness mode=plan` as permission to avoid implementing an obvious
  bounded first slice when the user asked to ship.
- Treating `/harness mode=execute` as permission to skip design when a third
  workaround appears.
- Reporting hook or route success as product success without runtime evidence.
- Treating files as territory to reserve instead of announcements to build on; using
  message handshakes where reading the room and co-editing on overlap would be
  faster.
