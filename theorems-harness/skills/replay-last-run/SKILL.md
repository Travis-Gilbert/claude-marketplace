---
name: replay-last-run
description: This skill should be used when the user asks to replay the last Harness run, inspect what actually happened, audit event order, verify a persisted state hash, trace a failed run, or asks what tools and transitions fired. It uses only the registered replay_last_run contract and its GraphQL projection.
---

# Replay Last Run

Replay one durable Harness event ledger through the pure state machine. Use the
result as an integrity receipt and audit timeline. Replay is read-only: it does
not run hooks, Compound Engineering, external calls, or side effects again.

## Select the run

Use the GraphQL field when the Harness GraphQL surface is available:

```graphql
query ReplayLastHarnessRun(
  $runId: String
  $sessionId: String
  $offset: Int
  $limit: Int
) {
  replayLastHarnessRun(
    runId: $runId
    sessionId: $sessionId
    offset: $offset
    limit: $limit
  )
}
```

Otherwise call the flat MCP tool `replay_last_run` with:

| Input | Meaning |
|---|---|
| `run_id` | Optional explicit run. This takes precedence. |
| `session_id` | Optional session whose latest eligible run should be selected. |
| `offset` | Raw-event page offset. Default `0`; must be non-negative. |
| `limit` | Raw-event page size. Default `100`; range `1..500`. |

Do not invent tenant or actor values in the user payload. The server supplies
them from the ambient principal and identity binding.

Without an explicit run, selection is deterministic and the receipt reports
one of:

- `latest_for_session`
- `latest_for_binding`
- `latest_for_actor`

With `run_id`, the reason is `explicit_run_id`.

## Read an applied receipt

An applied result has `status: "applied"` and includes:

- `selected_run_id` and `selection_reason`
- `reconstructed_run`
- `persisted_state_hash` and `replayed_state_hash`
- `integrity_match: true`
- `event_count`
- raw paging fields: `raw_offset`, `raw_limit`, `raw_total_count`, and
  `raw_truncated`
- raw `events`
- normalized `timeline` rows with event id, sequence, event type, category,
  creation time, and payload
- `side_effects_replayed: false`
- `replay_receipt_hash`
- the ambient `identity_receipt` when the host supplies one

Lead with the integrity result. Then answer the user's question from the
timeline. For broad audits, group by category and preserve sequence order. For
focused questions, show only the events that support the answer, while naming
the selected run and replay receipt hash.

If `raw_truncated` is true and the omitted events could change the answer, fetch
the next page by advancing `offset` by the returned page length.

## Read a refusal

A refused result has `status: "refused"`, a typed `code`, and a human-readable
`message`. Integrity refusals may also identify `run_id`, `divergent_seq`,
`expected`, `observed`, and `field`.

Report the refusal as evidence. Do not summarize a divergent ledger as a valid
run. Name the first divergent sequence and field when present, along with the
`replay_receipt_hash`.

## Boundaries

- Use `harness_replay` or `plan(action: "replay")` for Plan transition and
  refusal history. That is a different ledger.
- Use `git diff` for file changes and the visible conversation for chat
  transcript.
- Do not call retired `harness_begin`, `harness_context`, `harness_fork`, or
  `harness_compare` interfaces.
- Do not claim that replay reproduced external side effects. The explicit
  receipt field is `side_effects_replayed: false`.
