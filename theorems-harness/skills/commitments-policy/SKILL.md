---
name: commitments-policy
description: "Use when a task needs scoped standing decisions, structured coordination claims, commitment lifecycle checks, policy receipts, or the canonical Rust-only typed claim, typed commitment, and constitution-refusal boundaries."
---

# Commitments, claims, constitution, and policy

Read `../../references/COMMITMENTS_POLICY_CAPABILITY.md` before using a remote
coordination record as governance evidence or working on the canonical Rust
seams.

## Workflow

1. For a remote standing decision, use GraphQL `writeCoordinationRecord` or
   flat `coordination_record` with a decision record, `standing: true`, and an
   explicit scope. Keep its policy receipt.
2. Use flat `commitment_retract`, `commitment_supersede`, or
   `commitment_check` for the currently exposed lifecycle and tension writes.
3. Use GraphQL `recordClaim` only for Coordination V2 structured claims. Do not
   report it as the canonical derivation-backed typed assertion seam.
4. For repository implementation, use the real Rust APIs
   `assert_typed_claim`, `affirm_typed_commitment`,
   `supersede_typed_commitment`, `retract_typed_commitment`,
   `explain_typed_commitment`, and `Constitution::refusal`.
5. Preserve stable slot identity, immutable history, evidence references,
   witnesses, governing rule, explanation, policy decision, and idempotent
   receipt together.
6. If an agent session needs the canonical typed seam, report the projection
   gap. It is not exposed through MCP, GraphQL, or the dynamic gateway today.
