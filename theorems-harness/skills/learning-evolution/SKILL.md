---
name: learning-evolution
description: "Use when a task concerns Harness outcomes, calibration, ReasoningBank, GEPA candidates, programmable-graph evolution, or theorem-evolve scoring and promotion, especially to distinguish callable remote seams from Rust-only learning APIs."
---

# Learning and evolution

Read `../../references/LEARNING_EVOLUTION_CAPABILITY.md` before routing a
learning request.

## Workflow

1. Record actual claim/evidence outcomes with `recordVerification` or
   `verification_record`; inspect calibration with `calibrationReliability` or
   `calibration_reliability`.
2. Capture high-signal episodes through `rememberMemory` or `encode`, retaining
   tenant, project, run, source, receipt, and outcome provenance. Use the
   `practice-system` promotion gate; do not promote from one anecdote.
3. Use flat `programmable_graph` with `action: "evolve"` only to validate a
   typed standing-program evolution proposal for the ambient tenant. Treat the
   result as a proposal/refusal, not training, mutation, promotion, or proof of
   improvement.
4. For repository implementation, use the Rust GEPA and `theorem-evolve` APIs
   directly and test their oracles. Preserve missing-outcome refusal,
   instruction-key restrictions, validation subscores, candidate lineage,
   shadow evaluation, posterior uncertainty, guardrail discounts, negative
   outcomes, and receipt ids.
5. Require an independent held-out oracle and policy/verification receipt
   before calling a candidate promoted or improved.

There is no remote GEPA train/status/evaluate/promote/rollback lifecycle,
dedicated ReasoningBank action, GraphQL evolve mutation, or dynamic evolution
affordance. `programmable_graph_apply` materializes or publishes a supplied
program; it does not apply a GEPA candidate. Do not invent `practice_status`,
`practice_explain`, `gepa_train`, or `evolveCandidate`.

Local fixtures, synthetic worlds, deterministic scores, and fake heads remain
local evidence. Report a live learning loop only when the receipts prove that a
live provider ran, an independent outcome was observed, and a later selection
changed under the intended tenant/project scope.
