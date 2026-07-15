---
name: solvers
description: "Use when a task needs bounded constraint checking or pack optimization through the stable ConstraintCheck and ConstraintOptimize dynamic affordances, including provider refusal, budgets, cancellation, provenance, and proof eligibility."
---

# Stable constraint solvers

Generated surface map: [capability catalog](./CAPABILITIES.generated.md).

Use this focused workflow for solver work. Read
`../../references/SOLVER_CAPABILITY.md` before calling the surface.

## Workflow

1. Call `tool_search` for the constraint task and retain
   `candidate_affordance_ids`.
2. Select only `constraint.check` or `constraint.optimize`.
3. Call `describe` and validate the request against its current bounded schema.
4. Call `invoke`; use `dry_run: true` when only a plan is authorized.
5. Read `operation_receipt.solver` rather than inferring proof from outcome
   prose. Report provider transport, controls, graph/input anchors,
   verification state, `proof_eligible`, fallback, and refusal.

There are no dedicated flat or GraphQL solver actions. If the dynamic gateway
is absent, report the unavailable capability instead of inventing a tool name.

ConstraintCheck supports one to 256 assertions. ConstraintOptimize currently
supports only the bounded `pack` problem. Exact optimization is opt-in; the
deterministic fallback stays non-proof. Cancellation is an input-time terminal
state, not a live cross-process cancellation channel.
