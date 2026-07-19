# Learning, GEPA, and Evolution Capability

Learning is split across ambient run/practice behavior, canonical outcome
receipts, one flat programmable-graph validation action, and several Rust-only
libraries. There is no remote train/evaluate/promote/rollback lifecycle and no
monolithic `gepa` or `evolve` agent tool.

## Callable remote seams

### Outcomes and calibration

Use canonical `recordVerification` or flat `verification_record` to bind an
observed outcome to its claim, evidence lineage, verifier, method, graph
version, and source-calibration cell. Read it through `verificationReceipt` /
`verification_receipt` and `verificationExplain` /
`verification_explain`. Read the learned source cell with
`calibrationReliability` / `calibration_reliability`.

`source_calibration_record` is a real flat compatibility write, but new work
should prefer canonical verification. A caller-supplied `head_id`, model,
confidence, or favorable result is not independent evidence and cannot make
that source load-bearing.

### Episodes, strategies, and practice learning

The agent-callable memory and run surfaces remain the route for learning
evidence:

- record high-signal outcomes through GraphQL `rememberMemory` or flat
  `encode`, preserving tenant, project, run, source artifact, tool receipt, and
  outcome provenance;
- close real Harness runs with their actual validation and outcome events;
- use bounded memory recall and run replay to inspect later selection evidence.

The practice system selects and learns ambiently at run boundaries. Do not
invent `practice_status` or `practice_explain` unless a live server actually
registers those diagnostics. A single episode is not a promoted practice; use
the clustered evidence and promotion rules in `MEMORY_CAPABILITY.md` and the
`practice-system` skill.

ReasoningBank stores distilled strategy memories over ordinary encode/recall.
Raw traces are intentionally excluded. Its dedicated
`write_reasoning_strategy` and `recall_reasoning_strategies_in_project` entry
points are Rust APIs, not MCP or GraphQL actions.

### Programmable-graph evolve

Flat `programmable_graph` with `action: "evolve"` is callable today. It checks
a typed `EvolutionProposal` against the supplied current `ProgramDefinition`.
Both current and proposed programs must match the ambient tenant. The response
is an `ok` result or a typed `ProgramRefusal`.

This is a pure validation/proposal action. It does not train a candidate,
execute a held-out evaluation, mutate the current program, promote the
proposal, or prove that it improved anything. `programmable_graph_apply`
supports only `materialize` and `publish`; it is not an evolve-apply or GEPA
promotion endpoint. There is no GraphQL or dynamic projection for this action.

## Rust-only GEPA surfaces

The current GEPA implementation is repository-callable through
`theorem-harness-core` and `theorem-harness-runtime`:

- `gepa_train_sessions_for_intent` and `gepa_trainset_for_intent` assemble
  intent-scoped examples from persisted run evidence;
- trainset export refuses a session whose outcome is missing;
- `GepaInstructionCandidate` may change only registered instruction keys; it
  carries run id, candidate id, parents, validation subscores, and lineage;
- `route_gepa_candidate_through_gate` creates a configuration delta, runs
  shadow evaluation, and submits it to the loop gate with attribution,
  improvement rate, fitness, and optional posterior-superiority evidence;
- the user-prompt improver can invoke one configured head and returns its head
  invocation receipt.

None of these functions is projected through MCP, GraphQL, or the dynamic
gateway. Do not invent `gepa_train`, `gepa_status`, `gepa_promote`, or
`gepa_rollback`.

## Rust-only theorem-evolve surfaces

`theorem-evolve` is storage-neutral library code:

- `score_candidate` computes a Beta-Bernoulli posterior and applies versioned
  correctness, safety, and style discounts while preserving receipt ids;
- `evaluate_world_forks` evaluates at least two uniquely named candidates on
  isolated graph branches and returns a survivor plus merge receipt;
- `promote_candidates` ranks supplied candidates and materializes a promotion
  plan; `materialize_promotion` produces graph mutations and a derived
  playbook;
- experience lineage can be queried from an in-memory `ExperienceStore`.

These APIs are not remote agent tools. In particular, `promote_candidates`
trusts the scores its caller supplies; it is not by itself an independent
evaluation or authorization gate. No rollback API or durable remote promotion
ledger exists in this crate today.

## Evidence discipline

1. Keep tenant, project, run, candidate, source-head/model, and receipt lineage
   attached to every training or evaluation item.
2. Train only from completed outcomes. Missing, self-reported, fixture, or
   synthetic outcomes must stay labeled as such.
3. Preserve posterior uncertainty, calibration evidence, guardrail discounts,
   negative outcomes, and held-out boundaries; a mean score alone is not proof.
4. Require independent evaluation and the real policy/verification gate before
   promotion. A candidate cannot certify itself.
5. Describe local deterministic tests as local evidence. Claim a live provider
   or production learning loop only from an actual live receipt chain.

## Honest gaps

HCM-024 still requires:

- projected trainset, status, evaluate, shadow, promote, and rollback actions;
- inspectable durable training-data and model/policy lineage;
- independent held-out promotion enforcement and rollback receipts;
- oscillation prevention across deployed candidates;
- remote ReasoningBank and GEPA descriptors;
- a production two-run/live-provider learning oracle.
