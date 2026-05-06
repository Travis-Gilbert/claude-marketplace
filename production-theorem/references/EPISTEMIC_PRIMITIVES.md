# Epistemic Primitives

Production-Theorem uses explicit epistemic primitives so the artifacts remain auditable, reusable, and graph-ready.

## Primitive Catalog

| Primitive | Meaning |
|---|---|
| Object | Persistent thing: file, module, route, issue, test, artifact, or document |
| Claim | Proposition believed or proposed |
| Evidence | File, command output, trace, test, doc, or observation that supports or weakens a claim |
| Edge | Relationship between objects, claims, artifacts, or decisions |
| Tension | Contradiction or unresolved conflict |
| Assumption | Premise not yet verified |
| Gap | Missing evidence, code, test, or decision |
| Decision | Chosen path among alternatives |
| Method | Procedure used, such as TDD, diagnosis, retrofit, review, or search |
| MethodRun | One concrete execution of a method |
| EvidencePath | Trace from a claim or outcome to the supporting evidence |
| ContextArtifact | Reusable packaged context assembled for future work |
| ProcessRecord | Audit record of a run, step, or workflow transition |
| Outcome | What actually happened |
| Revision | Change to plan, belief, code, docs, or graph after observing the outcome |

## How To Use Them In A Theorem Brief

- Mark repo-grounded facts as `Evidence`.
- Mark inferred but unverified statements as `Assumption`.
- Mark contradictions between docs, code, or expectations as `Tension`.
- Mark unresolved missing details as `Gap`.
- Mark chosen paths as `Decision`.

## How To Use Them In A Planning Artifact

Every plan should leave an `Epistemic Ledger` that records:

- the claims the plan depends on
- the evidence supporting each claim
- the assumptions that still need validation
- the tensions or contradictions that remain
- the gaps that must become checklist items or deferrals
- the decisions that define the execution path

## How To Use Them In Execution

Every execution report should record:

- claims confirmed
- claims falsified
- tensions introduced or resolved
- assumptions still unverified
- gaps requiring follow-up
- outcomes worth preserving
- revisions that future runs should inherit

## Theseus / THG Mapping

When the environment supports THG or Database Harness writeback:

- `ProcessRecord` maps naturally onto recorded run and step events
- `ContextArtifact` maps onto packed context outputs
- `EvidencePath` maps onto replayable traces and supporting file/test links
- `Outcome` and `Revision` map onto learning proposals and follow-up artifacts

Do not force this mapping when the harness is unavailable. Preserve the same structure in markdown output and mark writeback as deferred.
