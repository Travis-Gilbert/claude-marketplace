# Planned Capability Plugin Ideas

Status: design input, not an availability claim
Date: 2026-07-13

This note records plugin ideas prompted by:

- `HANDOFF-OFFLOAD-SOLVERS (1).md`
- `HANDOFF-RECONSTRUCT-SYMBOLIC (1).md`
- `HANDOFF-VERIFIED-COGNITION.md`

These handoffs describe planned work. Nothing in this note should cause the
plugin to teach a capability as usable until the implementation, oracle,
server registration, live endpoint, and teaching artifact agree.

## Decisions from the Capability Audit

The following dispositions are now design decisions:

| Existing surface | Decision | Replacement |
|---|---|---|
| `show-context` | Remove. It teaches `harness_describe_current`, which is not a live contract. | Add a new context inspection skill only after the typed context/status contract is live. |
| `context-refresh` | Remove. It teaches `orchestrate_refresh`, which is not a live contract. | Keep context management ambient; expose a refresh action only if the runtime registers and oracles one. |
| `code_theorem` | Remove. Its obsolete 17-tool vocabulary should not be migrated alias by alias. | Consolidate current code understanding under the typed code domain and `compute_code`. |
| `replay-last-run` | Keep the product idea and replace its guessed interfaces with a real capability. | Build `replay_last_run` over the existing event log and deterministic replay kernel. |
| Ponytail | Remove from the plugin and retire its runtime capability pack. | Replace it with the Harness-native compound practice system described below. |

Removal means removing the teaching artifact and every route to it. Historical
run receipts remain readable; deleting provenance from old runs would damage
replay.

## Make `replay-last-run` a Real Capability

The substrate already contains most of the engine:

- `theorem-harness-core::replay_events` deterministically rebuilds `RunState`
  from ordered events;
- `theorem-harness-runtime::replay_persisted_run` loads the persisted ledger and
  calls that kernel;
- `harness_run` and GraphQL `harnessRun` return a named run and its event ledger;
  and
- `harness_replay` replays plan events, which is useful but is a different
  domain from replaying an agent run.

The missing capability is not event storage. It is the safe resolution of
“last,” actual state-machine replay, integrity comparison, and a useful audit
projection.

### Proposed contract

`replay_last_run` should accept an optional explicit `run_id`. Without one, it
must select the latest run visible to the current tenant and bound
session/agent identity. It must not choose the latest run globally or fall back
to the `default` tenant.

Return:

- selected run id and a machine-readable selection reason;
- ordered, pageable events with raw payloads preserved;
- reconstructed terminal `RunState`;
- persisted state hash and replayed state hash;
- `integrity_match`, event count, first missing sequence if any, and typed
  refusal on gaps or conflicts;
- a normalized timeline grouped into decisions, tool calls, observations,
  validations, outcomes, selected practices, memory retrievals, and compound
  actions; and
- a content-addressed replay receipt so later comparisons reference exactly
  what was checked.

Recommended exposure:

- typed GraphQL query: `replayLastHarnessRun`;
- stable flat MCP action: `replay_last_run`, because this is a frequent atomic
  audit operation; and
- the existing `replay-last-run` skill, rewritten to call only the registered
  contract and to distinguish run replay from plan replay.

`harness_run` can remain the lower-level “fetch this known run” operation.
`replay_last_run` is the opinionated selection plus integrity operation. Fork
and compare can be exposed later from the already-existing kernel functions,
but are not required to make replay useful.

### Replay acceptance

- A closed run with an intact ledger replays to the persisted terminal state
  and reports matching hashes.
- A ledger with a missing sequence returns a typed gap; it never presents a
  partial timeline as a verified replay.
- Two tenants with interleaved recent runs still select the bound tenant's run.
- An explicit `run_id` outside the caller's tenant is not observable.
- Replaying does not append compound events, create a new run, or change pack
  fitness.
- The plugin can answer “what did you actually do last run?” without referring
  to `harness_begin`, `harness_context`, `harness_fork`, or `harness_compare`.

## Remove Ponytail Completely

Ponytail is not only six skills. A complete removal must cover:

- `skills/ponytail*`, `commands/ponytail*`, `scripts/ponytail-*`, both hook
  manifests, statusline/config state, README and installer lists,
  `PONYTAIL-INTEGRATION.md`, and its vendored license/provenance files;
- the Ponytail constants, payload builder, seeded engineering-pack entry,
  tests, and documentation in `theorem-harness-runtime::engineering_packs`;
- installed plugin caches and generated manifests after the source release is
  validated; and
- the graph-resident Ponytail pack, which should be retired/tombstoned so new
  Ensemble decisions cannot select it while historical receipts still resolve.

Do not preserve Ponytail commands as aliases. A deprecated alias would keep its
behavioral model alive and make it unclear whether a run used the replacement.

## Harness-Native Compound Practice System

Working name: `theorem-superpowers`.

This is a customized, source-attributed practice system derived from three
upstreams, pinned for reproducibility:

| Upstream | Pinned source reviewed for this note | What to retain | License posture |
|---|---|---|---|
| `obra/superpowers` | `d884ae04edebef577e82ff7c4e143debd0bbec99` | Practice workflow, automatic activation, skill behavior tests, evidence-before-completion | MIT |
| `obra/episodic-memory` | `10757690210574421f1df5f35835af8d0c74d984` | Cross-harness episode capture, semantic plus exact retrieval, source pointers, filters, opt-out, idempotent sync | MIT |
| `obra/the-elements-of-style` | `6099c505c2a8eb066f3777f83a97d9d828f7954c` | Public-domain writing rules and progressive disclosure | Public domain per upstream README; preserve source attribution |

This should be a maintained Theorem adaptation, not an unmodified bundle and
not a second standalone memory or MCP system.

### Architecture correction and target pattern

Compound Engineering currently lives primarily in
`theorem-harness-runtime::compound_engineering`, not inside the Ensemble crate.
It fires after `RUN.CLOSED` or `RUN.FAILED`, discovers the packs, memory, tools,
and retrievals a run actually used, captures qualifying outcomes, updates
positive fitness, writes review tensions for failures, and proposes promotion,
decay, or demotion. Ensemble provides the content-addressed pack registry and
the replayable selection decision.

The replacement should mirror that whole path:

```text
source-attributed practice graph
  -> Ensemble registry and phase-aware selection
  -> runtime activation and use receipts
  -> event-log evidence and episode capture
  -> run-close Compound Engineering attribution
  -> fitness, retrieval, promotion, revision, or retirement
  -> next run's Ensemble selection
```

It is therefore deep in Ensemble **and** cross-cutting in the runtime. Selection
without runtime receipts cannot compound; runtime hooks without Ensemble cannot
learn which practice mix works for which tasks.

### 1. Superpowers becomes a `skill_graph` capability pack

Model the methodology as a graph rather than one giant prompt:

- practice nodes: brainstorm, specify, plan, isolate, execute, test, debug,
  request review, receive review, verify, and finish;
- transition edges: prerequisites, allowed successors, re-plan triggers, and
  completion gates;
- validator nodes: the oracle for each practice, including proof that a test
  was observed failing before it passed when strict TDD applies;
- host adapters: mappings from abstract actions to the tools available in
  Codex, Claude Code, ACP, or another head; and
- policy metadata: mandatory, recommended, unavailable, or inapplicable for a
  particular run and host.

Use `PackKind::SkillGraph` in Ensemble. Select a small phase-appropriate
practice set under budget and emit the decision into the run log. Do not inject
the entire upstream library into every session.

The custom version should preserve Superpowers' systematic workflow and
evidence discipline while replacing assumptions that conflict with the
Harness: Harness plans/work graphs replace ad hoc todo files; Harness
coordination replaces generic subagent choreography; project oracle classes
control whether strict TDD, parity, live smoke, miri, soak, or another proof is
required; and user/project instructions remain higher priority than the pack.

### 2. Episodic Memory becomes substrate-native episode memory

Retain the upstream's useful semantics:

- ingest Claude Code and Codex sessions;
- preserve session, harness, project, branch, exchange, tool-call, and source
  line provenance;
- support semantic, exact-text, multi-concept, date, project, session, and
  branch filtering;
- provide explicit do-not-index markers;
- make incremental capture idempotent and reentrancy-safe; and
- search first, then read only bounded source ranges.

Replace the standalone SQLite/sqlite-vec store and separate MCP server with
RustyRed graph, vector, and memory contracts. A captured episode should link to
its `HarnessRun`, events, actor/head, task cluster, artifacts, retrieved memory,
selected practice packs, validation receipts, and outcome. Existing Harness
recall and typed GraphQL memory should expose it; no duplicate `search`/`read`
MCP connection is needed.

Episodes are evidence, not immediately reusable practice. Compound Engineering
clusters related successful and failed episodes; a distillation or promotion
gate turns repeated evidence into a revised practice pack. This preserves the
important difference between remembering what happened and teaching the next
run what to do.

### 3. Elements of Style becomes a writing corpus and validator source

The Harness already has `writing_style`, writing-engineering receipts, user
style notes, and Compound fitness axes. Import the public-domain rules as a
source artifact for that system rather than installing a second always-on prose
skill.

- Keep the long source behind progressive disclosure.
- Compile applicable rules into versioned writing-pack validators.
- Emit style receipts at real output boundaries.
- Let user, project, and register-specific style rules override generic advice.
- Feed receipt aggregates into the existing Compound fitness path.
- Propose rule changes from outcome evidence; never silently rewrite the
  canonical pack because one run preferred different prose.

### 4. Runtime activation and exposure

Add an always-on practice controller at run start, after compaction, and at
material phase transitions. It asks Ensemble for the applicable practice graph
slice and records why each practice was selected or rejected. Applying a
practice writes the normal skill-pack use receipt so Compound Engineering can
attribute the outcome.

Suggested runtime events:

- `PRACTICE.SELECTED`
- `PRACTICE.APPLIED`
- `PRACTICE.VALIDATED`
- `PRACTICE.REVISED`

The controller is ambient. Agent-visible tools are for inspection and explicit
recovery, not for deciding whether compounding runs:

| Capability | Exposure |
|---|---|
| current practice selection and reasons | Typed GraphQL plus `practice_status` diagnostic MCP action |
| explain why a practice or gate fired | Typed GraphQL plus `practice_explain` |
| episode search/read | Typed memory/episode GraphQL; reuse stable memory actions where schemas fit |
| replay the last run with practices, retrievals, validations, and compound actions | `replay_last_run` |
| select, attribute, capture, decay, and promote | Ambient runtime; never a required manual command |

### 5. Run-to-run compounding

Reuse the existing Compound Engineering spine instead of adding a second
learning loop:

- positive outcomes strengthen the practice packs, retrieved episodes, and
  memory that were actually used;
- failed outcomes create review tensions without pretending to localize blame;
- recurring task clusters separate a repeatable practice from a lucky run;
- hard oracle regressions can demote a canonical practice;
- unused practices decay; retrieval rehearses useful episodes; and
- all promotion or revision remains proposal-based until its gate passes.

The next run's Ensemble priors should incorporate this task-cluster fitness, so
the Harness gradually chooses the practice mix that has worked for this tenant,
project, task type, host, and oracle class.

### 6. Source sync and customization discipline

Keep upstream lineage on every derived pack: repository, commit, license,
source hash, Theorem patch set, behavioral evals, and previous pack hash.
Upstream updates enter as candidate pack versions. Diff and evaluate them
against held-out Harness tasks before promotion. Do not auto-copy upstream
changes directly into the canonical runtime pack.

The plugin skills are projections of the canonical practice pack, not an
independent handwritten copy. A drift check must compare the registered pack
hash, generated or validated skill files, hook/bootstrap behavior, installed
cache, live Ensemble listing, and use-receipt schema.

### Migration order

1. Remove Ponytail activation hooks and retire its Ensemble/runtime pack while
   preserving historical receipt resolution.
2. Build `replay_last_run` independently on the existing event log and replay
   kernel.
3. Register the pinned, source-attributed `theorem-superpowers` practice graph
   as non-canonical until its behavior tests pass.
4. Wire phase-aware Ensemble selection, runtime practice receipts, and the
   compact bootstrap.
5. Add substrate-native episode ingestion/retrieval and link episodes to runs,
   practices, artifacts, and outcomes.
6. Add Elements-of-Style-derived validators to writing engineering and feed
   their receipts through the existing Compound spine.
7. Run held-out workflow, replay-integrity, cross-harness episode-recall,
   tenant-isolation, and compounding tests.
8. Promote the replacement pack only after the live runtime and plugin
   projections agree.

### Compound practice acceptance

- A clean coding request activates an applicable design or execution practice
  without the user manually invoking a mode.
- The selected practice slice and reason appear in the run ledger and in
  `replay_last_run`.
- Practice use emits content-addressed receipts tied to the exact pack version.
- A successful validated run changes later selection fitness for the same task
  cluster; a failed run writes a tension without an ungrounded decrement.
- A prior Codex or Claude Code episode can be found through one tenant-scoped
  memory surface with source pointers.
- An excluded session is not indexed or used for compounding.
- Writing output carries a versioned style receipt when the writing practice is
  selected, and user/project style constraints outrank generic rules.
- Ponytail is absent from skills, commands, hooks, seeded packs, new Ensemble
  decisions, installed cache, and live plugin teaching.
- Historical runs that used Ponytail still replay with resolvable provenance.

## The Main Opportunity

The three plans reveal a coherent capability family: **verified cognition**.
It is not just “more symbolic tools.” It is a set of reusable substrate
executors that can be reached through two equal doors:

1. a person invokes a direct CommonPlace instrument; or
2. an agent invokes an affordance through the Harness.

Both doors must call the same executor and produce the same receipt. The plugin
owns the agent door and the teaching around it. CommonPlace owns the direct
user-facing surface. Theorem owns the executors, graph contracts, receipts,
GraphQL API, MCP projection, and runtime routing.

That division suggests expanding Theorem's Harness now as a capability pack,
then considering a separate `verified-cognition` companion plugin once plugin
dependency/composition rules are mature enough to avoid configuring the same
Harness MCP connection twice.

## Capabilities Implied by the Plans

| Capability | Source idea | Agent-facing job | Recommended exposure |
|---|---|---|---|
| Constraint check | SMT `ConstraintCheck` | Check consistency, entailment, feasibility, or find a counterexample | Typed GraphQL plus one stable MCP action |
| Constraint optimize | Pumpkin `ConstraintOptimize` | Choose, pack, schedule, or assign under explicit constraints | Typed GraphQL plus one stable MCP action |
| Verification receipt explanation | Models, unsat cores, limits, objective, and slack | Explain the specific reason for a result in product language | Stable MCP action backed by a shared receipt type |
| Progressive obligation discharge | Optional `FormalSpec` on obligations | Discharge formal obligations while preserving natural-language obligations | Typed reconstruction domain; batch-oriented MCP action only if frequent |
| Structural/semantic parity | egglog equivalence plus SMT residue | Check whether a reconstruction or port is actually equivalent | Stable high-level MCP action; internal solver steps remain composed |
| Rewrite-pack application | Idiom and binary canonicalization packs | Normalize terms and return a trace of applied rules | Dynamic affordance or typed GraphQL; do not create a tool per pack |
| Conflict witness extraction | Named claim sets and minimal unsat cores | Name the smallest conflicting facts or commitments | Part of check/discharge results, not a second solver call for callers |
| Constrained repair | Optimize distance from a prior subject to validators | Repair an invalid proposal to the nearest valid one | Dynamic affordance until a stable repair contract emerges |
| Verified decision | Compare options and test feasibility | Answer “which wins and why?” or “can this plan work?” | Agent capability over check/optimize; direct surface lives in CommonPlace |
| Verified consistency | Compare a new claim or plan with recorded commitments | Name the prior decision that conflicts, or state assumptions that hold | Agent capability over graph claims plus constraint check |
| Verified reconstruction | Recover a page, file, binary, or system with a parity receipt | Return a grounded structural map and located divergence | Agent capability over reconstruction and parity contracts |
| Verified voice | Use decision/consistency during a call | Speak the same checked result and preserve an inspectable receipt | Later channel adapter; not a new solver or separate truth path |

## What Should Become Agent Tools

The plugin should teach task-level verbs, not force every agent to assemble raw
solver scripts. Candidate stable actions are:

| Candidate action | Purpose | Important result fields |
|---|---|---|
| `constraint_check` | Consistency, entailment, counterexample, or feasibility over named claims | status, named core or model, assumptions, backend, limits, receipt id |
| `constraint_optimize` | `pack`, `schedule`, or `assign` problems | selected solution, objective, slack, proof reference, receipt id |
| `verification_receipt_explain` | Render a stored result in human language | conclusion, specific reason, assumptions, bounded-check caveat |
| `obligations_discharge` | Batch formal obligations through the shared check executor | per-obligation state and discharge receipt |
| `reconstruction_parity_check` | Compose structural equivalence with semantic discharge | structural status, semantic status, rewrite trace, located divergence |
| `verified_decision` | Product-level compare/feasibility flow | winner or feasibility, tradeoff/binding constraint, shared result card |
| `verified_consistency` | Check against graph-held commitments | conflicting commitment ids or assumptions used, shared result card |
| `verified_reconstruct` | Recover and verify something currently in view | structural map, evidence, parity receipt, unresolved obligations |

Names here are conceptual. The capability registry should choose final wire
names and generate or validate the MCP and plugin projections. The plugin must
not publish guessed aliases before that registry exists.

### Tools that should remain internal or dynamic

- Solver binary discovery, backend selection, seed, thread count, and option
  injection are runtime policy, not user tools.
- ENGINE_EQUIVALENCE rewrites and DifferentialAdmission probes are planner
  machinery. They should be observable in receipts and diagnostics, not
  invoked as ordinary actions.
- Individual idiom, framework, and binary canonicalization packs should be
  capability parameters discovered through the affordance registry, not one
  MCP tool per pack.
- Feature flags that choose heuristic versus solver-backed capsule packing are
  operational controls, not reasoning verbs.
- Raw `get-model` and `get-unsat-core` calls should not escape as separate
  public actions. They are parts of one checked result.

## Plugin Skills Suggested by the Plans

### 1. `verification-receipts`

This should land first because every later capability depends on agents reading
the result correctly.

It should teach an agent to:

- distinguish `sat`, `unsat`, `unknown`, `timeout`, and `invalid` without
  converting them into misleading pass/fail language;
- turn a named core into the specific conflicting claims;
- turn a model into a concrete counterexample or witness;
- turn objective and slack into “this option wins because” and “why not X”;
- state the assumptions, backend, limits, and bounded nature of the check;
- reopen an existing receipt instead of silently recomputing a new result; and
- preserve the same explanation schema used by the direct CommonPlace result
  card.

This is also the right home for the product lexicon: “caught a conflict,”
“proven feasible under these constraints,” and “this option wins because,” not
raw solver vocabulary.

### 2. `verified-decision`

Triggers on explicit decisions with structured options, attributes, budgets,
deadlines, assignments, or schedules. It should elicit missing constraints,
select `constraint_optimize` or `constraint_check`, and explain the result from
the receipt.

It must not infer a person's weights in v0. It asks for them or uses weights
the person already supplied. It should refuse free-form optimization models
outside the supported `pack`, `schedule`, and `assign` templates.

### 3. `verified-consistency`

Triggers on “does this conflict with what I decided/agreed/promised?” It should
retrieve the relevant commitments from the graph, form named claims, use the
formal check when formal payloads exist, and preserve the natural-language
belief-conflict path when they do not.

The skill should make absence of formal payload explicit without treating the
underlying commitment as inferior or invalid.

### 4. `verified-reconstruction`

Triggers on “recover this faithfully,” “port this without semantic drift,” or
“show that this reconstruction matches.” It should coordinate evidence
collection, obligation discharge, rewrite-pack selection, and the composite
parity check.

The critical teaching is that parity is a conjunction: structural equivalence
under the active rewrite pack and semantic discharge of the remaining residue.
Neither part alone may be reported as parity.

### 5. `constraint-authoring` (advanced/internal)

This skill would help an agent create named claim sets and safe SMT-LIB2 formal
payloads from already-structured domain facts. It should be gated and advanced,
because malformed formalization can produce a perfectly valid answer to the
wrong problem.

It must follow the whitelist and template constraints from the solver handoff;
it must not teach free-form FlatZinc, MaxSMT, unrestricted solver options, or a
second backend integration style.

## Recommended Plugin Shape

Do not create a public command for every executor. Prefer one adaptive entry and
auto-triggered skills:

```text
theorems-harness/
  skills/
    verification-receipts/
    verified-decision/
    verified-consistency/
    verified-reconstruction/
    constraint-authoring/
  references/
    VERIFICATION-RECEIPT-CONTRACT.md
    VERIFIED-COGNITION-ROUTING.md
  commands/
    verify.md                 # optional narrow entrypoint
```

The existing `/harness` router can select these skills from task signals. If a
narrow public command is useful, `/verify` should accept a mode such as
`decision`, `consistency`, or `reconstruction`; separate `/check`, `/optimize`,
`/parity`, `/discharge`, and `/receipt` commands would recreate the vocabulary
sprawl the plugin upgrade is meant to remove.

### Possible future companion plugin

Once the Harness supports explicit plugin dependencies or shared MCP
connections cleanly, extract the product-facing skills into:

```text
verified-cognition/
  skills/
    decision/
    consistency/
    reconstruction/
    receipt-literacy/
  commands/
    verify.md
  references/
    CAPABILITY-CONTRACT.md
```

The companion should depend on Theorem's Harness rather than bundle a second
connection to the same server. The Harness remains the substrate/operator
plugin; Verified Cognition becomes the user-intent and explanation plugin.

## MCP and Capability Registry Implications

Each capability should declare enough metadata to project consistently into
GraphQL, MCP, dynamic affordances, and plugin teaching:

| Field | Why it matters here |
|---|---|
| capability id and version | Solver, receipt, rewrite-pack, and parity contracts will evolve independently |
| implementation state | Distinguishes a handoff idea from code that exists |
| oracle and evidence state | Prevents a fake solver, fixture, or partial parity check from being taught as production proof |
| caller classes | Records whether agents, direct users, planners, or operators may invoke it |
| input schema | Keeps named claims and the three optimization templates stable |
| receipt schema | Makes the direct and agent doors render one result |
| permission and tenant policy | Keeps commitments, constraints, models, and receipts tenant-correct |
| exposure projection | Chooses typed GraphQL, stable MCP action, dynamic affordance, ambient behavior, or admin-only control |
| teaching artifact | Points to the exact plugin skill/reference that teaches the live contract |
| deprecation replacement | Allows old symbolic aliases and stale skills to be removed without silent breakage |

Add a planned state to the census, but do not call planned capabilities
experimental by default. A useful lifecycle is:

```text
planned
  -> implementation-present
  -> oracle-backed
  -> server-registered
  -> live-advertised
  -> plugin-taught
```

Operationally broken and deprecated are orthogonal states, not maturity rungs.
A drift test should fail when a plugin teaches an action before it is live, or
when a live stable action has no capability entry and no teaching decision.

## Existing Plugin Changes These Plans Inspire

1. Expand or split the current `symbolic` skill. Its Datalog, source
   reliability, and expected-value tools are a different family from solver
   checks and optimization. Folding everything into one long symbolic skill
   would blur when each executor applies.
2. Add receipt interpretation as a cross-cutting skill rather than repeating
   explanation rules in decision, consistency, and reconstruction skills.
3. Teach compute offload as the routing substrate behind these capabilities,
   while keeping backend selection and planner rewrites out of the public tool
   list.
4. Add dual-entry parity tests: the same structured input through the direct
   product contract and the agent affordance must produce the same normalized
   result and receipt id.
5. Add negative teaching tests: unknown and timeout must never be described as
   verified; absent term IR must produce `undischargeable`; structural-only or
   semantic-only success must never be described as parity.
6. Add a tenant assertion to every capability smoke test. Verification receipts
   can contain sensitive commitments, option weights, models, and conflict
   witnesses; a default-tenant fallback is unacceptable.

## Suggested Build Order

1. Register the planned capability records without advertising them as live.
2. Land and oracle the shared solver receipt contract.
3. Expose `constraint_check`, `constraint_optimize`, and receipt retrieval or
   explanation through the typed server surface and selected stable MCP actions.
4. Add `verification-receipts`, then `verified-decision` and
   `verified-consistency` to the Harness plugin.
5. Land progressive formal obligations and the composite parity contract.
6. Expose reconstruction discharge/parity and add
   `verified-reconstruction`.
7. Prove direct/agent dual-entry equivalence against CommonPlace contract
   fixtures.
8. Add the voice/channel adapter only after the same executor and receipt path
   works without voice.
9. Decide whether to extract `verified-cognition` as a companion plugin based on
   real adoption and available plugin dependency support.

## Acceptance Criteria for the Plugin Work

- No skill names or calls a capability that is only planned.
- Every taught stable action exists in the capability registry, the server
  schema, the live MCP catalog, and a tenant-correct smoke test.
- Direct-user and agent entrypoints produce the same normalized receipt for the
  same request.
- Explanations name the core, binding constraint, counterexample, objective, or
  slack rather than returning a verdict alone.
- Unknown, timeout, invalid, undischargeable, partial parity, and operational
  failure remain distinct states in agent language.
- Every formal result states assumptions and bounds; no skill makes an
  unqualified formal-verification claim.
- Deprecated symbolic or reconstruction aliases identify a supported
  replacement before removal.
- Plugin references, manifests, installed cache, and the live server pass the
  capability-drift check together.

## Recommendation

Build these ideas first as a **Verified Cognition capability pack inside
Theorem's Harness**, with receipt interpretation as the foundation. Keep the
solver and reconstruction primitives in the Harness MCP/GraphQL contract, keep
the direct instruments in CommonPlace, and keep backend/planner mechanics
ambient or dynamic. Extract a separate `verified-cognition` companion plugin
only when it can depend on the Harness without duplicating the MCP connection.

This gives the plans a plugin home immediately without teaching unfinished
work, and it preserves the core product promise from the handoffs: one checked
capability, two equal doors, one durable explanation.
