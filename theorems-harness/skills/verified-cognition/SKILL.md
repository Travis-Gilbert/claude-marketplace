---
name: verified-cognition
description: "Use when a decision, consistency check, reconstruction, or repair must separate proposals from proof by composing only real solver, verification, reconstruction, and Plan surfaces; also use to identify the absent verified-cognition and voice workflow boundaries."
---

# Verified cognition

Generated surface map: [capability catalog](./CAPABILITIES.generated.md).

Read `../../references/VERIFIED_COGNITION_CAPABILITY.md` plus the capability
guide for every primitive you use.

There is no monolithic verified-cognition workflow. Compose only advertised
surfaces:

1. Anchor the claim, inputs, graph version, repository revision, and source SHA
   that matter.
2. Use dynamic `constraint.check` only for claims representable by its bounded
   SMT schema. Read `proof_eligible`; preserve unknown, refusal, fallback,
   timeout, and cancellation dispositions.
3. Use `reverseEngineer*` or exact `reverse_engineer_*` stages for
   reconstruction. Preserve `unknowns`, hazards, `unresolved_obligations`,
   `needs_review`, and validate receipts marked `not_run`.
4. Run the real domain oracle outside the proposal-producing stage.
5. Record actual evidence with `recordVerification` or
   `verification_record`, then inspect it with `verificationExplain` or
   `verification_explain`.
6. When the work is Plan-backed, preserve `claim` -> `patch_proposed` ->
   `spawn_verify` -> `submit_verify` -> `prove` -> `done` and its independent
   reviewer boundary.

Do not route to invented verified-decision, consistency, reconstruction,
repair, voice, rewrite-pack, conflict-witness, or parity workflow tools. Repair
uses the ordinary bounded edit-and-oracle loop. Voice has no current verified
cognition surface. There is no callable orchestration shortcut for these
compositions. A replayable chain can be assembled from real receipts, but
the planned HCM-016 workflow orchestrator and adverse-fixture contract checker
do not yet exist.
