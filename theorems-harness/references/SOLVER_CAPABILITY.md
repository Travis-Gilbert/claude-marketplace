# Stable Constraint Solver Capability

The stable agent-facing solver surface is a pair of tenant-scoped dynamic
affordances. It is not a pair of dedicated flat MCP tools and it has no GraphQL
projection yet.

| Action | Affordance id | Purpose |
|---|---|---|
| ConstraintCheck | `constraint.check` | Check one to 256 bounded SMT assertions. |
| ConstraintOptimize | `constraint.optimize` | Optimize the bounded `pack` template over at most 4,096 items. |

## Dynamic discovery and invocation

Use the canonical gateway sequence:

1. Call `tool_search` with a constraint-oriented `query` and `task_type`.
   Preserve its `candidate_affordance_ids`.
2. Call `describe` with the selected `affordance_id`. Treat the returned
   `input_schema`, permissions, writeback policy, and tags as the current
   contract.
3. Call `invoke` with that `affordance_id`, the exact `arguments`, and the
   candidates from search. Use `dry_run: true` to inspect the planned action
   without solver execution.

The canonical ids are stable even though search ranking may change. Do not
invent a flat solver tool when the dynamic gateway is unavailable.

### ConstraintCheck input

```json
{
  "affordance_id": "constraint.check",
  "task_type": "constraint.check",
  "candidate_affordance_ids": ["constraint.check"],
  "arguments": {
    "operation_id": "check:requirements",
    "claims": [
      {"claim_id": "claim:1", "formula": "(assert true)"}
    ],
    "budget": {"timeout_ms": 5000, "seed": 0, "work_budget": 1000},
    "cancellation": {"state": "active"}
  }
}
```

`operation_id` and every `claim_id` are bounded to 256 bytes; formulas are
bounded to 16,384 bytes. `timeout_ms` must be from 1 through 120,000 and
`work_budget` from 1 through 1,000,000 when present. A cancelled input uses
`{"state":"cancelled","reason":"..."}` and terminates before provider
execution.

### ConstraintOptimize input

```json
{
  "affordance_id": "constraint.optimize",
  "task_type": "constraint.optimize",
  "candidate_affordance_ids": ["constraint.optimize"],
  "arguments": {
    "operation_id": "optimize:context-pack",
    "problem": {
      "template": "pack",
      "budget": 10,
      "items": [
        {"id": "item:a", "cost": 4, "value_scaled": 900, "pinned": false, "excludes": []}
      ]
    },
    "budget": {"timeout_ms": 5000, "seed": 0},
    "cancellation": {"state": "active"},
    "prefer_exact": false
  }
}
```

Only the `pack` template is stable. With `prefer_exact: false`, the
deterministic pack fallback may run and remains non-proof. With
`prefer_exact: true`, absence of an exact provider is a typed refusal.

## Reading the result

A fired call returns `operation_receipt`. Read these fields before using a
solver conclusion:

- `receipt_hash`: logical input/output content address, intentionally excluding
  executor identity;
- `execution_hash`: provider, controls, and proof-state-sensitive address;
- `operation_id`, `operation_kind`, `executor`, `input_refs`, `output`, and
  `graph_version`;
- `solver.disposition`, provider id/version/transport, effective controls,
  input and graph anchors, `verification_state`, `proof_eligible`, verified and
  unverified claims, fallback reason, and refusal reason.

Do not convert `sat`, `unsat`, `optimal`, or `infeasible` into proof merely from
the outcome text. `solver.proof_eligible` is authoritative. A service-transport
result remains unverified until a local verification path proves it.

## Honest boundaries

- `dry_run: true` describes the plan and returns no `operation_receipt`.
- Read-only MCP mode does not synchronize missing native affordances; discovery
  can only see constraint nodes already present in the tenant graph.
- Read-only MCP mode refuses live `invoke`; it permits dry-run only.
- Missing providers, invalid bounds, cancelled input, unattested work budgets,
  and provider budget mismatch return terminal typed receipts rather than
  plausible conclusions.
- Cancellation is currently a bounded invocation input, not a shared live
  cancellation channel during provider execution.
- The gateway returns the operation receipt inline, but does not yet persist a
  separate gateway invocation record for these native actions (`recorded` is
  null).
