---
name: context-management
description: "Use when a task needs Harness Context Brief status, explanation, lease reuse, explicit compilation, invalidation, generation history, span disposition, or an honest account of the current UserPromptSubmit, PostToolUse, and PreCompact hook boundary."
---

# Harness context management

Generated surface map: [capability catalog](./CAPABILITIES.generated.md).

Read `../../references/CONTEXT_CAPABILITY.md` before preparing, invalidating, or
reporting context state.

## Workflow

1. Inspect with GraphQL `contextStatus` or `contextExplain`; use flat
   `context_status` or `context_explain` for compatibility and diagnosis.
2. Prepare or reuse through flat `harness_prepare`. Use GraphQL
   `refreshContext` when an explicit compile is intended.
3. Read the lease, `context_action`, `refresh_reason`, generation, and compile
   receipt. Preserve `included` and `excluded` span dispositions and
   `active`, `stale`, and `evicted` generation state.
4. Advance the scoped epoch explicitly with GraphQL `invalidateContext` or flat
   `context_invalidate`, using a durable source event id. Then prepare again.
5. Do not claim hook-driven invalidation. `PostToolUse` captures evidence but
   does not advance the epoch; Claude `PreCompact` flushes memory but does not
   advance the epoch; Codex currently has no `PreCompact` hook.
6. Label admission gaps. Without an authenticated admitted session and resolved
   project, context operations refuse and fail-open prompt hooks inject no
   Harness brief.

Refresh reasons are `first_turn`, `explicit_refresh`, `missing_brief`,
`post_compaction`, and `semantic_invalidation`. Status reasons and eviction
receipts are evidence; keep them attached to the report.
