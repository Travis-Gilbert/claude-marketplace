# Context Management Capability

Harness context is a scoped, leased, generation-tracked Context Brief. Its
scope is admitted by the transport and resolved from the active identity:
tenant slug, project slug, session id, and the server-owned surface
`harness_prepare`. Callers provide the task and compile controls, not identity
scope.

Prefer GraphQL after `graphql_introspect`. Use flat MCP for compatibility,
diagnosis, or the current hook scripts.

## Surface mapping

| Operation | GraphQL | Flat MCP | Effect |
|---|---|---|---|
| Status | Query `contextStatus` | `context_status` | Reads scope epoch, lease, active generation, history, staleness, and reasons. |
| Explain | Query `contextExplain` | `context_explain` | Adds the active compile receipt and retained eviction receipts. |
| Prepare or force compile | Mutation `refreshContext(task, turnIndex, contextTokenBudget)` | `harness_prepare` with `task`, optional `turn_index`, `context_token_budget`, and `refresh_context` | Reuses a valid lease or compiles and activates a new Context Brief; GraphQL always requests an explicit compile. |
| Invalidate | Mutation `invalidateContext(sourceEventId, reason)` | `context_invalidate` with `source_event_id` and optional `reason` | Idempotently advances the scoped compaction epoch for the source event. |

`refreshContext` defaults `turnIndex` to 1 and `contextTokenBudget` to 2,000.
`invalidateContext` defaults `reason` to `post_compaction`. There is no separate
flat prepare or refresh tool: the flat prepare/compile/reuse operation is
`harness_prepare`.

The GraphQL context fields currently return a JSON scalar projection, unlike
the typed identity receipt. They accept no tenant, project, session, actor, or
surface arguments.

## Lease and compile contract

A context lease binds `lease_id`, tenant, project, session, surface, brief id,
compile turn, compaction epoch, semantic fingerprint, and generation.

`harness_prepare` returns one of two actions:

- `context_action: reuse` when scope, semantic fingerprint, compaction epoch,
  brief, and lease are still valid. It returns `inject_context: false` and
  `retrieval_performed: false` with the current brief id and lease.
- `context_action: compile` when a refresh decision requires a new brief. It
  returns `inject_context: true`, `retrieval_performed: true`, the typed brief,
  explanation, lease, generation, compile receipt, and `refresh_reason`.

Refresh reasons are `first_turn`, `explicit_refresh`, `missing_brief`,
`post_compaction`, and `semantic_invalidation`.

The compile receipt accounts for every candidate span. Dispositions are
`included` or `excluded`; reasons are `mandatory`, `ranked_within_budget`, and
`token_budget_exhausted`. Preserve each derivation reference, provenance,
retrieval score, and estimated token count. A mandatory span that cannot fit is
a refusal. Only trusted Harness instruction spans may enter as instructions.

## Generations, invalidation, and status

The active generation becomes `stale` when a newer generation supersedes it.
Retained older generations eventually become `evicted`; the default retention
is three, and eviction reason `retention_limit` has a persistent receipt.
Activation retries use compare-and-swap and exact replay is idempotent.

`context_invalidate` requires a source event id and advances the epoch only
once for that event. The next `harness_prepare`, or GraphQL `refreshContext`,
compiles against the advanced epoch.

`contextStatus` / `context_status` reports `empty`, `stale`, or `active` and
keeps the machine-readable reasons:

- `no_active_context_generation`
- `scope_epoch_advanced_after_compile`
- `active_generation_matches_scope_epoch`

Use `contextExplain` / `context_explain` when the compile receipt or evicted
generation receipts are needed. Do not collapse included, excluded, stale, or
evicted evidence into an unqualified “context loaded” claim.

## Current hook boundary

- Claude and Codex `UserPromptSubmit` run `prepare-context.sh`, which calls
  `harness_prepare` and injects returned `rendered_markdown` when available.
- Claude and Codex `PostToolUse` run `posttool-context.sh` for write-capable
  tools. It records ToolResult/reference evidence, but it does not call
  `context_invalidate` or advance the context epoch.
- Claude `PreCompact` runs `precompact-flush.sh`. It flushes transcript,
  decision, rule, and summary memory, but it does not call
  `context_invalidate` or advance the context epoch.
- Codex currently has no `PreCompact` hook in this plugin.

Until the hook lifecycle is completed, callers must use explicit
`context_invalidate` or GraphQL `invalidateContext` to advance a compaction
epoch. Hook scripts fail open: without an admitted session authenticated by the
host and a resolved project, context preparation refuses and the user prompt
continues without injected Harness context.

## Current proof boundary

Repository tests cover lease reuse, refresh reasons, scoped invalidation,
generation transitions, retention, disposition receipts, and GraphQL/flat
parity. They do not prove a live admitted production session for this plugin
install. The missing PostToolUse and PreCompact invalidation wiring, Codex
PreCompact support, and live authenticated session oracle remain explicit
gaps; do not describe hook-driven epoch management as complete.
