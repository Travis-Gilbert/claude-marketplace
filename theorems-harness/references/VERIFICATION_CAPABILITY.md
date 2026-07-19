# Verification and Calibration Capability

Canonical verification is one tenant-scoped receipt system. It binds a claim,
supporting and attacking evidence, evidence lineage, verifier metadata, method,
result, confidence, graph version, and source-calibration key under one content
address. A conclusive receipt and its calibration delta commit atomically.

Prefer GraphQL after `graphql_introspect`. Use flat MCP only when GraphQL is
unavailable or when flat compatibility is the surface under test.

## Surface mapping

| Operation | GraphQL | Flat MCP | Effect |
|---|---|---|---|
| Record | Mutation `recordVerification` | `verification_record` | Atomically records the canonical receipt, evidence edges, and any calibration delta. |
| Read | Query `verificationReceipt` | `verification_receipt` | Reads the tenant-scoped receipt and calibration delta by `receiptId` / `receipt_id`. |
| Explain | Query `verificationExplain` | `verification_explain` | Projects support, attack, lineage, verifier, method, graph anchor, and calibration effect. |
| Allocate | None | `verification_allocate` | Ranks candidates by stakes, unreliability, uncertainty, and miscalibration. |
| Reliability | None | `calibration_reliability` | Reads the persisted posterior, Brier score, observations, and admission tier for one source cell. |
| Discharge obligation | Mutation `dischargeVerificationObligation` | `verification_obligation_discharge` | Persists an applied or refused discharge receipt binding the obligation, admitted verifier, constraints, evidence, and graph version. |
| Record frontier | Mutation `recordVerificationFrontier` | `verification_frontier_record` | Persists one bounded, order-invariant frontier over unresolved obligations and verification receipts. |
| Read frontier | Query `verificationFrontierReceipt` | `verification_frontier_receipt` | Reads the exact tenant-scoped frontier receipt by content-addressed id. |

On GraphQL-default servers, covered flat tools may be absent from `tools/list`.
That is not a missing capability. Introspect the GraphQL schema before falling
back or inventing a tool name.

## Record contract

`recordVerification` and `verification_record` take the same logical input:

- `claim_ref`: an existing same-tenant claim node.
- `evidence`: one or more existing same-tenant evidence nodes. Each item has
  `evidence_ref`, role `supports` or `attacks`, and optional `lineage_refs`.
- `verifier`: `actor_id`, `binding_id`, `head_id`, and `model_version`.
- `method`: stable `method_id` plus `version`.
- `result`: `supported`, `refuted`, or `inconclusive`.
- `confidence`: finite value from 0 through 1.
- `graph_version`: the exact graph snapshot the verifier inspected.
- `calibration_key`: source `head_id` and `model_version`, plus normalized
  `domain` and `claim_type` for the source whose reliability is being learned.
- `outcome_kind`: `oracle`, `test_or_proof`, `user_correction`, or `diagnosis`.
- `weight`: optional non-negative calibration weight.

The first write refuses a stale `graph_version`. Exact content-addressed replay
returns the existing receipt with `idempotent_replay=true`; it does not apply a
second calibration update. `inconclusive` persists verification evidence but
does not change calibration.

Obligation discharge never infers success from confidence alone. A discharge
must satisfy its declared verifier, method, evidence, confidence, and graph
constraints; an unmet constraint persists a typed refusal rather than
disappearing. Frontier writes accept bounded obligation and receipt-reference
sets, preserve simultaneous support and attack evidence, and return the same
receipt for order-equivalent replay.

## Admission and self-report rules

1. Tenant comes from the admitted request scope, not from prose or a nested
   input object. Cross-tenant claim, evidence, lineage, and receipt reads refuse.
2. On authenticated requests, admitted `actor_id` and `binding_id` overwrite
   client-supplied verifier values. Never report those values as caller-chosen
   impersonation.
3. `head_id` and `model_version` remain reported runtime metadata on this
   surface. State the actual head/model when known, but do not describe those
   strings as signed identity or cryptographic attestation.
4. A verifier's confidence is not proof. Record `supported` or `refuted` only
   when the declared method and cited evidence justify that result. Otherwise
   record `inconclusive`.
5. Prefer canonical `recordVerification` / `verification_record` over direct
   `source_calibration_record` for new verification work. The canonical write
   binds the calibration observation to immutable claim and evidence lineage.
6. `admission_tier` (`load_bearing` or `quarantined`) describes the persisted
   reliability cell. It can govern evidence weighting; it is not actor
   authentication, action authorization, or permission to skip an oracle.
7. Do not let a head make itself load-bearing by self-reporting favorable
   outcomes. Calibration evidence must come from the named oracle, proof,
   correction, or diagnosis receipt.

## Read, explain, allocate, and reliability

- Use `verificationReceipt(receiptId: ...)` when exact stored content matters.
- Use `verificationExplain(receiptId: ...)` for a human-facing account of both
  supporting and attacking evidence. Preserve attacks and unknowns; do not
  collapse them into a confidence-only summary.
- Use `verificationAllocate` with candidate source keys and non-negative
  `stakes`. Higher priority means verification is more valuable, not that the
  candidate is more trustworthy.
- Use `calibrationReliability` with `head_id`, `model_version`, `domain`, and
  `claim_type`. Report posterior mean, variance, observed weight, Brier score,
  and admission tier together. A prior with little observed weight is not a
  mature track record.

The symbolic tool
`rustyred_thg_symbolic_probabilistic_source_reliability` is separate: it scores
an arbitrary graph source. Canonical calibration is the persisted
head/model/domain/claim-type outcome ledger described here. Do not substitute
one for the other.

## Reporting

Report the receipt id, claim ref, result, confidence, graph version, method,
support and attack evidence, calibration change (or `none`), and whether the
write was an idempotent replay. For allocation and reliability, name the exact
source cell and keep the priority breakdown or reliability evidence attached.
