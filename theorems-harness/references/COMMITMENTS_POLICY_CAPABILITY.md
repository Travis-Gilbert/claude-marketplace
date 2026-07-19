# Commitments, Claims, Constitution, and Policy Capability

This family has two distinct layers. The remote Harness exposes coordination
standing decisions, structured coordination claims, and the canonical typed
commitment lifecycle. Canonical typed claims and structured constitution
refusals remain production Rust APIs without agent-callable transport.

Do not collapse these layers. A coordination claim or standing decision is not
the canonical typed assertion/commitment record merely because its payload is
structured.

## Remote surface mapping

| Operation | GraphQL | Flat MCP | Current meaning |
|---|---|---|---|
| Write a standing decision | Mutation `writeCoordinationRecord` with `recordType: "decision"`, `standing: true`, and `scope` | `coordination_record` with `record_type: "decision"`, `standing: true`, and `scope` | Creates a scoped coordination record. The same write path applies native scope, budget, publication, and admitted-identity policy. |
| Read standing decisions | Query `coordinationRoom` with decision record filters | Coordination room/context reads | Returns active and historical coordination records; it does not return the canonical typed commitment explanation object. |
| Retract | None | `commitment_retract` | Marks one active standing decision retracted while preserving its record. |
| Supersede | None | `commitment_supersede` | Links an active standing decision to an already-existing active replacement. |
| Check output | None | `commitment_check` | Checks output against active scoped decisions and persists tension records for verified violations. |
| Structured coordination claim | Mutation `recordClaim` | None | Records task-reference subject/predicate/object claims, contradictions, and same-actor supersession in Coordination V2. |
| Affirm canonical typed commitment | Mutation `affirmTypedCommitment` | `typed_commitment_affirm` | Creates an immutable, evidence-bound commitment owned by the admitted actor. |
| Read canonical typed commitment | Query `typedCommitment` | `typed_commitment_read` | Reads one same-tenant commitment and refuses a different admitted owner. |
| Explain canonical typed commitment | Query `explainTypedCommitment` | `typed_commitment_explain` | Returns active/superseded/retracted status plus the immutable lifecycle. |
| Supersede canonical typed commitment | Mutation `supersedeTypedCommitment` | `typed_commitment_supersede` | Replaces the active commitment in the same owner/scope/rule slot and preserves history. |
| Retract canonical typed commitment | Mutation `retractTypedCommitment` | `typed_commitment_retract` | Deactivates the commitment with rule, evidence, and explanation receipts. |

`writeCoordinationRecord` returns JSON and lowers to the same native handler as
`coordination_record`. Its policy receipt names required/missing scopes, budget
admission, publication decision, and admitted identity metadata. Preserve that
receipt with the record. `recordClaim` is a Coordination V2 domain operation;
it is not the canonical derivation-backed typed assertion seam described below.

## Canonical typed claim Rust API

`theorem-harness-runtime::assert_claim` exposes the canonical companion through
`assert_typed_claim`. It accepts a `RuntimeTypedClaimInput` containing tenant,
actor, an existing V1 assertion receipt, and a `TypedClaimIdentity` with
subject, predicate, object, and claim type.

Relations are `supports`, `attacks`, `contradicts`, and `supersedes`. The
runtime atomically commits:

- an immutable `TypedClaimRecord`;
- a subject/predicate/type `TypedClaimSlotState` with active and historical ids;
- immutable `TypedClaimWitness` records that bind both claims, assertion
  receipts, and evidence references;
- a content-addressed `TypedAssertionReceipt` with witness and active-claim
  ids plus `idempotent_replay`.

Two active claims in the same tenant/subject/predicate/type slot with different
normalized objects conservatively contradict. Supersession changes only the
active-slot projection; it does not mutate or delete the prior claim or its
witnesses. Rust readers include `load_typed_claim`,
`load_typed_claim_witness`, `load_typed_claim_slot`, and
`active_typed_contradictions`.

## Canonical typed commitment contract

`theorem-harness-runtime::commitment` exposes:

- `affirm_typed_commitment`
- `supersede_typed_commitment`
- `retract_typed_commitment`
- `explain_typed_commitment`

The stable slot identity is tenant, owner, scope, and governing rule. A
`TypedCommitmentInput` also carries the statement and at least one evidence
reference. Records are immutable; a small `TypedCommitmentSlotState` names the
active id and preserves all commitment and lifecycle receipt ids.

Lifecycle actions are `affirmed`, `superseded`, and `retracted`; explanation
status is `active`, `superseded`, or `retracted`. Supersession and retraction
require a policy rule id, evidence, and explanation. An active commitment must
be superseded explicitly, replacements must preserve slot identity, and an
inactive commitment cannot be reactivated by replay. Each transition commits
its record, slot projection, and content-addressed
`TypedCommitmentLifecycleReceipt` atomically and reports idempotent replay.

## Constitution and policy Rust API

`theorem-harness-core::constitution::Constitution` provides pure, deterministic
turn and publication decisions. The authority order is:

1. `global_law`
2. `self_model`
3. `project_law`
4. `current_request`
5. `live_evidence`

`Constitution::refusal` creates a content-addressed
`StructuredPolicyRefusal`. It requires a known layer, stable rule id, at least
one evidence reference, and an explanation; the receipt preserves all four
alongside the denied `PolicyDecision`. Ordinary binding guards remain the hard
publication boundary.

The learned action policy in `theorem-harness-core::policy` and the separate
`theorem-policy` crate are training/runtime substrate. They do not create a
general remote constitution or policy-evaluation tool. Coordination policy
receipts are the currently exposed policy evidence.

## Current proof and exposure boundary

Strict AOF reopen, rejecting-batch, idempotency, contradiction, supersession,
retraction, explanation, and structured-refusal tests cover the Rust seams.
Remote standing-decision and Coordination V2 claim tests cover their separate
contracts.

Typed commitment MCP/GraphQL operations derive tenant and owner from admitted
identity; caller tenant/owner fields do not grant authority. Still open are the
canonical typed-claim transport, adoption by coordination commitments,
persisted structured constitution-refusal transport, and the full declared core
proof. Do not substitute coordination standing decisions for typed commitment
records, or describe the still-unprojected claim/constitution seams as remote.
