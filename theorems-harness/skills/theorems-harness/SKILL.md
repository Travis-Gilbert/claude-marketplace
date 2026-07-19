---
name: theorems-harness
description: Theorem's Harness default plugin skill. Use when the user invokes /harness or asks for grounded planning, implementation, debugging, review, context preparation, validation, reporting, cross-agent coordination, typed memory, encode, run lifecycle, replay, fractal search, code search, or harness-backed agent work.
---

# Theorem's Harness

Theorem's Harness is the public product layer for grounded agent work. The SDK
is plumbing, GraphQL MCP is the preferred tool bus, hooks provide ambient
session support, and skills/commands are the behavior contract that agents
actually inhabit.

When `graphql_query`, `graphql_mutate`, and `graphql_introspect` are available,
use them as the primary Harness MCP API. Start with `graphql_introspect` when the
schema is not already in context, then use GraphQL for memory, coordination,
jobs, graph, code, and run surfaces. Use legacy flat tools only when GraphQL is
unavailable, the session is intentionally on a local/dev flat-tool server, or
you are diagnosing flat-tool compatibility.

Host UIs may display Harness tools with plugin-qualified labels such as
`Theorem's Harness Recall`, `theorems-harness recall`, or
`mcp__codex_apps__theorems_harness._recall`. Treat those labels as
routing/display names for the native MCP verbs (`recall`, `remember`, `encode`),
not as a different memory system. In user-facing reports, prefer product
language like "Harness recall", "Harness encode", or "Harness memory" unless the
wire-level identifier matters.

The core change: `/harness` is not a request to force one narrow mode. It is the
operator saying "use the harness for this session or task." After that, the
agent chooses the most useful capability mix, revisits that choice at
checkpoints, and keeps moving unless a real blocker requires user input.

## Session Contract

When the user invokes `/harness`, "Theorem's Harness", or an equivalent phrase:

1. Treat it as consent to use harness abilities for the active task.
2. Resolve the current task from the user's words and live repo state.
3. Select the first capability mix by applying the routing rules below, the
   injected Product Packet (see Liveness), and — for the long tail — the
   `tool_search` discovery loop.
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
- Plan-shaped work routes through the durable plan substrate: `plan create` is
  the canonical act, heads claim and transition tasks on the plan, and plans
  are referenced by id/digest — never re-encoded into coordination records,
  messages, or reflections.
- If the user asks for research, evidence, graph search, code discovery, or
  current external facts, start with `research` or `compile_context`.
- If the user asks for review or a second model's view, start with
  `peer_review`; do not convert that into implementation unless asked.
- If a claim must be proven, checked, or adversarially verified, route through
  the verified-cognition surface: `oracle` for one claim against graph
  evidence, `verification_record`/`verification_receipt` for durable receipts,
  and the `multihead_*` family (`multihead_run`, `multihead_task`,
  `multihead_spawn_verify`, `multihead_submit_verify`, `multihead_review`) for
  multi-head work-graph runs with independent verification.
- If work should run in the background or on another head, use Dispatch:
  `job_submit`/`job_list`/`job_note`/`job_archive` (local node), or
  `spawn_session` for a room-visible spawned session.
- If the user asks to rebuild, port, or establish parity with an existing
  system, route to `reverse_engineer_*` (target_plan, slice, compose, port,
  emit, validate) and `reconstruct`/`reconstruct_binary`.
- If structured data must enter the graph, route to `datawave_ingest` for
  intake and `resolve_ingest`/`resolve_entities`/`resolve_explain` for entity
  resolution.
- If the task is design-system or UI-audit shaped, the Design Scout tools
  (`design_extract`, `design_audit`, `design_drift`, `design_report`,
  `design_tokens`) are first-class; pair them with the design-engineering
  skill.
- At the start of Rust-shaped work, `skill_apply` the Rust skill-pack (local
  node) so this head starts warm; `ensemble_select` chooses capability packs
  under budget when several could serve.
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
  - `/coordinate` for cross-agent presence, mentions, waits, and handoffs.
  - `/peer-review` for cross-frontier-model diff review before commit, PR, or
    launch-ready reporting.
  - `/encode` for feedback, solution, or postmortem memory.
  - `/research` for direct fractal expansion / gap-frontier discovery.
  - `/compute_code` for native CodeCrawler-backed code discovery, with graph-structural ranking fallback.
  - `/replay-last-run` for deterministic replay and integrity inspection of the
    most recent eligible run.
  - `/writing-engineering` for prose checks, including the integrated 1918
    Elements of Style ruleset.

The source-attributed practice system is ambient behavior rather than another
slash command. It binds planning, execution, verification, review, and
run-to-run learning into the active Harness run.

Compatibility commands such as `/execute` may remain installed, but new work
should prefer `/harness` plus adaptive routing.

## Querying the multi-model store

RustyRed is one store with several access methods behind a single query surface,
not several databases. Treat retrieval as a choice of predicate roles, not a
choice of tools.

Two predicate roles:

- Filters narrow a set and compose by intersection: scalar equals, range,
  prefix; time range; geo within; text contains; graph reachable-from.
- Rankers score and order and compose by fusion: vector similarity (knn), text
  relevance (BM25), graph proximity (PPR). A ranker is never collapsed into a
  filter. Its scores carry through.

Current routing, until the planner-unify spec lands:

- Scalar, time, and join predicates go through `relational_query`, which costs
  access methods, intersects with roaring bitmaps, hash-joins, and returns a
  `PlanTrace`.
- Vector, geo, text, and graph-expand go through the single-modality tools:
  `vector_search`, `spatial_radius` and `spatial_bbox`, `fulltext_search`,
  `graph_neighbors` and the PPR tools.
- Do not pass knn, geo, text, or expand predicates to `relational_query` yet.
  The planner does not back them. It full-scans and returns unranked or
  unfiltered rows with no error. Route those predicates to the tools above.

After the unify spec lands:

- `relational_query` becomes the single entry for compound cross-modal
  retrieval. One call can fuse knn, geo, time, text, and expand under a fusion
  policy, RRF by default.
- Read the `PlanTrace` as the receipt: which access method fired per predicate,
  candidate set size, the kNN strategy (exact over candidates, or filtered
  HNSW), and the fusion kind. Read it the way you would read an EXPLAIN.

Carry this model: cost picks the cheapest method only among interchangeable ways
to evaluate the same filter. It never trades a ranking for a cheaper boolean. If
a result set looks like it lost similarity ordering or dropped recall, that is
the symptom of a ranker being treated as a filter. Report it as a bug, do not
treat it as expected.

## Core Verbs (Theorem MCP, curated)

This table is the curated core, not the inventory. The full surface is
discovered at runtime (see Discovery Loop) and indexed in
`references/TOOL_SURFACE.md` (generated). Never teach or attempt a verb that
is absent from the connected server's `tools/list`.

| Verb | Purpose |
|---|---|
| `tool_search` / `describe` / `invoke` | The discovery loop: ranked affordance search, on-demand schema materialization, and gated invocation (`dry_run=true` to plan without firing). |
| `tool_result_fetch` | Fetch a byte slice from a tool result that exceeded the MCP boundary budget (the 16KB fetch-handle envelope). |
| `harness_prepare` | Compose a native Theorem Context Brief from Ensemble selection, tenant memory recall, ambient code, and ambient RustyWeb evidence. |
| `harness_run` | Return a named Harness run and its event ledger. |
| `harness_append_transition` | Append a transition receipt to a run's durable event ledger. |
| `harness_replay` | Replay a bounded page of durable transition and refusal events for one plan. |
| `replay_last_run` | Select the latest eligible Harness run or an explicit run, replay its event ledger without side effects, and return typed integrity evidence. |
| `fractal_expansion` | Queue live RustyRed fractal expansion; returns a pollable `run_id` by default, `wait=true` for a synchronous receipt. |
| `compute_code` | Search, explain, recognize, context-pack, or explore code through the native CodeCrawler / code graph read path; `provider_search` reaches live GitHub/GitLab code search. |
| `code_ingest` | Ingest, reindex, session-reingest, or record code-use receipts through the native CodeCrawler write path. |
| `plan` | Create and operate durable graph-backed plans: create, add_task, refine, claim, transition, prove, spawn/submit verify, render, import, query, what_changed, analyze, converge, replay. |
| `oracle` | Validate a claim against graph verification, records, and evidence; writes a learn_pattern receipt only in explicit write mode. |
| `query_data` / `retrieve_memory` / `turn_start` / `evidence_bundle` | Data API membrane: records query, memory-oriented retrieval, turn-start work-queue packet, and cited handoff bundles. |
| `self_note` / `self_revise` / `self_archive` / `self_recall_archive` | Manage typed agent memory. |
| `encode` / `recall` / `remember` / `relate` | Memory writes and recall; continuity packs are written as `encode` with `kind=continuity_pack`, not a separate tool. |
| `handoff` | Create a native cross-actor handoff memory document. |
| `coordination_room` | Join, inspect, pause, resume, or stop durable room membership. |
| `coordination_intent` | Announce status, summary, and `footprint` (files your hands are on); one live record per (room, head). |
| `coordination_record` | Write a durable typed room record: `record_type` is `event`, `decision`, `tension`, or `reflection`. Reflections, decisions, and tensions are record types, not separate tools. |
| `coordination_contribution` | Capture an agent contribution as a durable native coordination event record. |
| `coordinate` | Append a coordination message and queue actor mentions. |
| `mentions` | Load and consume pending mentions. There is no long-poll wait tool; publish with urgency and check at your next checkpoint. |
| `presence` | Refresh, end, or read short-TTL actor presence. |
| `stream_subscribe` / `stream_read` / `stream_publish` / `stream_ack` | Per-room event streams: subscribe once, read the cursor delta at turn-start, publish as you go; `urgency` ask/block with `target_actor` pings that head. |
| `multihead_run` / `multihead_task` / `multihead_claim` / `multihead_next` / `multihead_patch` / `multihead_proof` / `multihead_spawn_verify` / `multihead_submit_verify` / `multihead_review` / `multihead_refine` | Native multi-head work-graph runs: task fan-out, claims, patches, proofs, and independent verification. |
| `graphql_query` / `graphql_mutate` / `graphql_introspect` | The preferred typed API over the same store (see the top of this skill). |

## Discovery Loop

The server intentionally does not advertise every spoke tool schema upfront.
For anything beyond the core verbs:

1. `tool_search` with a task-shaped query returns ranked candidate
   affordances (PPR over outcomes — the substrate learns which tools actually
   work per task type).
2. `describe` with the chosen `affordance_id` materializes its full input
   schema on demand.
3. `invoke` fires it through the persisted connector target; `dry_run=true`
   plans without firing.

Prefer this loop over guessing tool names from memory or from this document.

## Liveness: the Product Packet

Hooks inject a "Theorems Harness Product Packet" into session events with
active and degraded capabilities. That packet — not this file — is the live
capability inventory:

- An active capability's directive and validation defaults are usable now.
- A degraded capability (`remote_unavailable`, `no_manifest`, ...) must not be
  taught, attempted, or silently worked around: report the degradation and use
  the documented fallback if one exists.
- When the packet and this skill disagree, the packet wins.

## Deployment Surfaces

The plugin's bundled server entry points at the remote node; a local node
(`theorem-local`) exposes a larger surface. The two are subsets of one source
catalog, pruned per deployment — so never assume a verb exists on the
connected server without checking `tools/list` or running `tool_search`.
As of 0.10.0 the memory-write verbs (`encode`, `remember`, `relate`,
`handoff`), the plugin host (`skill_*`), pack selection (`ensemble_*`),
Dispatch (`job_*`), practice (`practice_*`), and `replay_last_run` live on the
local node only. Treat a missing verb as a degraded capability: name it in
the report, do not emulate it.

## Tool Surface Index (generated)

Regenerate with `scripts/regen-routing.sh` against a live server or a
`harness-capability-source-catalog` dump; `--check` fails on drift. The full
per-tool index lives in `references/TOOL_SURFACE.md`.

<!-- BEGIN GENERATED TOOL SURFACE (scripts/regen-routing.sh; do not hand-edit) -->

server_version `live` | 187 tools | digest `f55203a9595800cf` |
full index: `references/TOOL_SURFACE.md`

- **code** (7): `code_compile_spec`, `code_extract_features`, `code_implementation_obligations`, `code_ingest`, `code_patterns_relevant`, `code_publish_spec`, `code_spec_drift`
- **context** (3): `context_explain`, `context_invalidate`, `context_status`
- **coordination** (5): `coordination_context`, `coordination_contribution`, `coordination_intent`, `coordination_record`, `coordination_room`
- **core** (45): `browse_for_me`, `browse_with_me`, `calibration_reliability`, `checkpoint`, `commitment_check`, `commitment_retract`, `commitment_supersede`, `composed_agent_run`, `compute_code`, `coordinate`, `datawave_ingest`, `describe`, `encode`, `evidence_bundle`, `fold_semiring`, `forget`, `fractal_expansion`, `handoff`, `impact`, `invoke`, `mentions`, `observe`, `observe_web`, `oracle`, `plan`, `presence`, `programmable_graph`, `programmable_graph_apply`, `query_data`, `recall`, `reconstruct`, `reconstruct_binary`, `refine`, `reflect`, `relate`, `remember`, `replay_last_run`, `retrieve_memory`, `rustyweb_search_acquisition`, `source_calibration_record`, `spawn_session`, `turn_start`, `understand_code`, `upsert_note`, `why_derivation_trace`
- **data_registry** (3): `data_registry_get`, `data_registry_list`, `data_registry_publish`
- **design** (5): `design_audit`, `design_drift`, `design_extract`, `design_report`, `design_tokens`
- **ensemble** (6): `ensemble_install`, `ensemble_list`, `ensemble_publish`, `ensemble_register`, `ensemble_select`, `ensemble_upgrade`
- **epistemic** (3): `epistemic_compile_subgraph`, `epistemic_dirty_frontier`, `epistemic_shadow_ppr`
- **graphql** (3): `graphql_introspect`, `graphql_mutate`, `graphql_query`
- **harness** (4): `harness_append_transition`, `harness_prepare`, `harness_replay`, `harness_run`
- **harness_kg** (6): `harness_kg_explain_edge`, `harness_kg_impact`, `harness_kg_ppr`, `harness_kg_related_objects`, `harness_kg_search`, `harness_kg_status`
- **identity_binding** (2): `identity_binding_explain`, `identity_binding_status`
- **job** (4): `job_archive`, `job_list`, `job_note`, `job_submit`
- **memory** (5): `memory_dedup_report`, `memory_documents_dump`, `memory_similar_edges`, `memory_similarity_reindex`, `memory_vector_backfill`
- **multihead** (10): `multihead_claim`, `multihead_next`, `multihead_patch`, `multihead_proof`, `multihead_refine`, `multihead_review`, `multihead_run`, `multihead_spawn_verify`, `multihead_submit_verify`, `multihead_task`
- **practice** (3): `practice_close_receipt`, `practice_explain`, `practice_status`
- **read** (3): `read_intents_for_room`, `read_messages_for_room`, `read_records_for_room`
- **resolve** (3): `resolve_entities`, `resolve_explain`, `resolve_ingest`
- **reverse_engineer** (7): `reverse_engineer_behavior_ir`, `reverse_engineer_compose`, `reverse_engineer_emit`, `reverse_engineer_port`, `reverse_engineer_slice`, `reverse_engineer_target_plan`, `reverse_engineer_validate`
- **rustyred_thg** (11): `rustyred_thg_epistemic_neighbors`, `rustyred_thg_fulltext_search`, `rustyred_thg_graph_explain`, `rustyred_thg_graph_index_status`, `rustyred_thg_graph_neighbors`, `rustyred_thg_graph_query`, `rustyred_thg_graph_schema`, `rustyred_thg_index_spine`, `rustyred_thg_relational_query`, `rustyred_thg_vector_hybrid`, `rustyred_thg_vector_search`
- **rustyred_thg_algorithm** (8): `rustyred_thg_algorithm_communities`, `rustyred_thg_algorithm_communities_inline`, `rustyred_thg_algorithm_components`, `rustyred_thg_algorithm_components_inline`, `rustyred_thg_algorithm_pagerank`, `rustyred_thg_algorithm_pagerank_inline`, `rustyred_thg_algorithm_ppr`, `rustyred_thg_algorithm_ppr_inline`
- **rustyred_thg_graph_version** (6): `rustyred_thg_graph_version_checkout`, `rustyred_thg_graph_version_compile`, `rustyred_thg_graph_version_diff`, `rustyred_thg_graph_version_log`, `rustyred_thg_graph_version_merge`, `rustyred_thg_graph_version_ref`
- **rustyred_thg_spatial** (2): `rustyred_thg_spatial_bbox`, `rustyred_thg_spatial_radius`
- **rustyred_thg_symbolic** (3): `rustyred_thg_symbolic_datalog_derive`, `rustyred_thg_symbolic_probabilistic_expected_value`, `rustyred_thg_symbolic_probabilistic_source_reliability`
- **self** (4): `self_archive`, `self_note`, `self_recall_archive`, `self_revise`
- **skill** (4): `skill_apply`, `skill_get`, `skill_list`, `skill_publish`
- **stream** (5): `stream_ack`, `stream_publish`, `stream_read`, `stream_subscribe`, `stream_unsubscribe`
- **tool** (2): `tool_result_fetch`, `tool_search`
- **typed_commitment** (5): `typed_commitment_affirm`, `typed_commitment_explain`, `typed_commitment_read`, `typed_commitment_retract`, `typed_commitment_supersede`
- **verification** (7): `verification_allocate`, `verification_explain`, `verification_frontier_receipt`, `verification_frontier_record`, `verification_obligation_discharge`, `verification_receipt`, `verification_record`
- **web** (3): `web_consume`, `web_query`, `web_search_graph`

<!-- END GENERATED TOOL SURFACE -->

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
  tension record (`coordination_record` with `record_type: "tension"`) you
  write and work around, not a silent overwrite.
- Send `coordinate` with an `@actor` only for a block or a fork that changes the
  next action. Ordinary progress goes in your announcement summary.
- Close your announcement at turn-end and write a reflection record (and a
  decision record for any architectural choice) via `coordination_record` so
  the next head resumes cold.

The durable model is room digest plus interrupt mailbox: membership, intents,
reflections, decisions, tensions, events, continuity packs, and pending mentions
survive head sleep; short-TTL presence only says who is fresh. Full protocol:
`skills/harness-coordinate/SKILL.md`.

Ambient coordination now flows over per-room streams. Subscribe once with
`stream_subscribe`, and at turn-start call `stream_read` to pull only the events
appended since your cursor, which replaces re-reading the whole room.
`stream_read` with advance consumes the window so the same events do not
reappear. Publish events with `stream_publish`; a publish with urgency block or
ask and a `target_actor` also pings that head through the mention and wake path,
so the interrupt channel rides the same stream. claude.ai still does not hold a
live listener, so the model is subscribe, then read the cursor delta at each
turn-start, not a long-running socket. `coordination_context` is still a valid
one-call orientation read; prefer `stream_read` once you are subscribed, since
it is the cursor-delta version of the same thing.

## Hook Enforcement Layer

The plugin hook layer makes the highest-risk harness disciplines deterministic:

- `SessionStart` and build-shaped `UserPromptSubmit` events inject the ambition
  frame so plans do not shrink the request before execution begins.
- Handoff-shaped prompts emit a session-bound
  `.harness/checklists/<plan-slug>--<plan-id>.json` projection; parallel sessions
  resolve only their own binding. The hook still mirrors it into a coordination
  record only until the Stop gate reads the plan substrate directly. The plan
  is the contract; `.harness/checklist.json` is only a legacy fallback.
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
