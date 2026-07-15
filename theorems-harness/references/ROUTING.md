# Theorem's Harness Routing

Theorem's Harness is an adaptive session router. The user-visible command is
`/harness`; utility commands remain available for narrow operations, but the
default behavior is to choose the best capability mix for the active task and
revise that choice as evidence changes.

## Public Surface

| Surface | Role |
|---|---|
| `/harness` / `theorems-harness` | Default opt-in. The agent observes, routes, acts, validates, remembers, and reports through the harness. |
| `/coordinate` | Room digest, intent/reflection writes, presence, mentions, waits, and handoffs. |
| `/peer-review` | Cross-frontier-model review before commit, PR, launch report, or risky closeout. |
| `/research` | Direct fractal expansion, gap-frontier discovery, or code-symbol discovery. |
| `/encode` | Durable feedback, solution, or postmortem write through GraphQL `rememberMemory` with outcome metadata, or flat `encode` when needed. |
| `/compute_code` | GraphQL-first code ingest, discovery, explanation, specification, drift, features, and obligations, with consolidated flat MCP and graph-structural fallbacks. |

Identity is ambient and argument-free. Load `identity-bindings` when principal,
project selection, actor, binding, active heads, memory/capability scope, or
budget provenance matters. Prefer typed GraphQL `identityBindingStatus` and
`identityBindingExplain`; use flat `identity_binding_status` and
`identity_binding_explain` only for compatibility or diagnosis. Follow
`IDENTITY_CAPABILITY.md` and do not infer identity from configuration or known
projects.

Context compilation is ambient, but its control surface is exact. Load
`context-management`; inspect with GraphQL `contextStatus` / `contextExplain`
or flat `context_status` / `context_explain`, prepare through `harness_prepare`
or GraphQL `refreshContext`, and advance the epoch through
`context_invalidate` or `invalidateContext`. Current PostToolUse and Claude
PreCompact hooks do not advance the epoch, and Codex has no PreCompact hook.
Keep that admitted-session boundary visible as documented in
`CONTEXT_CAPABILITY.md`.

Commitments, claims, constitution, and policy require a layer check before
routing. Load `commitments-policy`. For remote work, use GraphQL
`writeCoordinationRecord` / `recordClaim` and the real flat standing-decision
lifecycle including `commitment_check`. For repository work, the canonical seam
is Rust `assert_typed_claim`, typed commitment lifecycle, and
`Constitution::refusal`; it has no remote projection. Follow
`COMMITMENTS_POLICY_CAPABILITY.md` and never report a coordination record as a
canonical typed assertion receipt.

Graph Lisp routes to `graph-lisp` only for repository implementation, tests, or
contract reasoning. The current capability is
`rustyred_thg_graph_lisp::execute_capability`; it has no agent-callable remote
projection, and effect requests refuse with `external_executor_required`. See
`GRAPH_LISP_CAPABILITY.md` rather than inventing an MCP, GraphQL, or dynamic
action.

Data, instant-KG, DATAWAVE, resolve, or source-port work routes to
`data-reconstruction`. Prefer typed Data, `harnessKg*`, and
`reverseEngineerCompose` through `reverseEngineerPort` GraphQL fields where
they exist. Use `resolve_ingest`, `resolve_entities`, `resolve_explain`,
`datawave_ingest`, `reconstruct`, and `reconstruct_binary` only as their real
flat-only tools. Follow `DATA_RECONSTRUCTION_CAPABILITY.md`; preserve explicit
source SHAs, receipts, unknowns, `unresolved_obligations`, and validate-stage
`not_run` rather than claiming end-to-end parity.

Memory is one tenant/project-bound capability, not separate recall, episode,
and practice stores. Prefer GraphQL `memory`, `memoryDoc`, `memoryArchive`,
nested `links`/`related`, and the typed memory mutations. Route flat-only actor
memory and Data API packets only when their advertised capability is needed.
Keep `rankSignals` and episode provenance attached to retrieved context. Apply
the opt-out, deduplication, retro-import reentrancy, and evidence-clustered
practice-promotion rules in `MEMORY_CAPABILITY.md`.

Verification and calibration are one canonical receipt capability. Prefer
GraphQL `recordVerification`, `verificationReceipt`, `verificationExplain`,
`verificationAllocate`, and `calibrationReliability`; use the corresponding
flat `verification_*` and `calibration_reliability` tools only for compatibility
or diagnosis. Route verifier confidence through the evidence and graph-version
contract in `VERIFICATION_CAPABILITY.md`; do not treat self-reported head/model
labels or a reliability admission tier as identity authority or proof.

Constraint solving is a focused dynamic capability. Load `solvers`, then use
`tool_search`, `describe`, and `invoke` for only `constraint.check` and
`constraint.optimize`. Read `SOLVER_CAPABILITY.md` before treating a conclusion
as proof; provider availability, bounds, cancellation, and proof eligibility
are receipt facts.

Verified decision, consistency, reconstruction, or repair requests route to
`verified-cognition` only as a composition guide. Use real
`constraint.check`, reconstruction, verification, and Plan surfaces; there is
no verified-cognition or voice workflow orchestrator. Follow
`VERIFIED_COGNITION_CAPABILITY.md` and keep proposals, `not_run` receipts,
unresolved obligations, and proof separate.

Programmable WASM has no remotely callable lifecycle yet. Load
`programmable-wasm` for installed app exports shaped
`wasm_plugin:<plugin_id>.<export>` and use the ordinary dynamic gateway. The
durable publish/promote/inspect/selected-invoke/rollback kernel remains a Rust
API, as documented in `PROGRAMMABLE_WASM_CAPABILITY.md`.

Compatibility phase commands such as `/execute` can remain installed, but new
general work should enter through `/harness`.

## Capability Mixes

The router selects abilities, not rigid products:

- `observe`
- `theorize`
- `plan`
- `execute`
- `diagnose`
- `coordinate`
- `compile_context`
- `identity`
- `governance`
- `graph_lisp`
- `data_reconstruction`
- `research`
- `verified_cognition`
- `validate`
- `peer_review`
- `remember`
- `report`

`mode=plan`, `mode=execute`, and related flags are starting preferences. They
do not prevent the agent from adding coordination, diagnosis, validation,
context refresh, or memory when the work demands it.

## Adaptive Algorithm

1. Start with `observe`.
2. Use `harness_route` if available; otherwise apply this file and the
   `theorems-harness` skill directly.
3. Add capabilities from task signals:
   - another agent, Claude, Codex, ping, handoff, overlap -> `coordinate`
   - plan, spec, migration, checklist, roadmap -> `plan`
   - implement, fix, ship, build, edit, run tests -> `execute`
   - bug, error, regression, failure, broken -> `diagnose` plus likely
     `execute`
   - research, evidence, search, compare, current facts -> `research` or
     `compile_context`
   - identity, principal, project selection, binding, active heads, scopes, or
     budget provenance -> `identity`
   - standing decision, commitment, claim conflict, constitution, or policy
     receipt -> `governance`
   - Graph Lisp read, eval, diff, explain, fuel, or permission boundary ->
     `graph_lisp`
   - Data records, instant KG, DATAWAVE, entity resolution, source
     reconstruction, or port obligations -> `data_reconstruction`
   - Verified decision, consistency, reconstruction, repair, or voice boundary
     -> `verified_cognition`
   - review, PR, diff, audit -> `peer_review`
   - remember, encode, postmortem, lesson -> `remember`
4. If no concrete action emerges, run a short `theorize` pass, choose a default,
   and continue.
5. Route again after material discoveries, before overlapping edits, after
   failed validation, before risky closeout, and when the user corrects the
   frame.
6. Close with the smallest truthful report that preserves validation and
   incomplete work.

## Profile Gates

Two registry profiles install state-machine guards that wrap every run. See
`PROFILES.md`, `ENGINEERS_MINDSET.md`, and `CONCISE_ACTION.md`.

| Guard | Owner | Blocks transition into |
|---|---|---|
| `DEFERRAL_GATE.CHECKED` | `engineers-mindset` | `ASK_USER`, `RUN.DEFERRED`, `RUN.FAILED`, `BLOCKED`, `NEEDS_CONTEXT`, `NEEDS_HUMAN_DECISION` |
| `CONCISE_ACTION.APPLIED` | `concise-action` | `RESPONSE.EMITTED` |

`ASK_USER`, `RUN.DEFERRED`, and `RUN.FAILED` are invalid unless
`DEFERRAL_GATE.CHECKED` passes. The gate is satisfied by an engineering pass:
internal sources checked, external sources checked when reality may live outside
the repo, smallest safe experiment attempted or explained, current default
chosen, exact blocker named, and the one specific user input needed.

These gates constrain lazy deferral and verbose narration. They do not freeze
the router in one mode.

## Checklist Manifest Escalation

Use `checklist-manifest` when work needs a compact table in this shape:

| Unchecked box | Desired outcome | Where | Why |
|---|---|---|---|
| [ ] CM-001 | Outcome to produce or verify. | `file`, route, command, or runtime surface | Why this matters and what evidence grounds it. |

At completion, keep the same IDs and table shape, but update the first column
with `[x]`, `[~]`, `[!]`, or `[ ]` and explain every non-done item in `Why`.

Do not create a checklist just to look rigorous. Create one when it reduces
confusion, preserves acceptance criteria, or makes multi-step work safer.

## Specialist Escalation

Use `codex-sdk-harness-product` when work references:

- `theorem-context-sdk/README.md`
- `theorem-context-sdk/theorem-context-ts/src/client.ts`
- `theorem-context-sdk/theorem-context-ts/src/product.ts`
- `theorem-context-sdk/theorem-context-py/theorem_context/client.py`
- `theorem-context-sdk/theorem-context-py/theorem_context/product.py`
- `TheoremContextClient`
- `TheoremHotGraphClient`
- current Plan actions, Plan replay, deterministic run replay, and patch flows
- THG product `command`, `batch`, `run`, `contextPack`, or `graphQuery`
- `ContextArtifact`
- TypeScript/Python SDK parity

Use `redis-harness-operator` for Redis-backed harness runs/events/cache,
semantic cache, ContextArtifact cache behavior, replay/fork/compare/patch,
local Redis fallback, and operational-state boundaries.

Use `redis-product-safety` for `thg-product-server`, tenant routes under
`/v1/tenants/{tenant_id}/`, `TheoremHotGraphClient`, THG auth/env/deploy gates,
RESP/Valkey facade behavior, OpenAPI, metrics, CORS, and product smoke tests.

Treat these specialists as read-only context by default unless the parent has
assigned write-scoped work.

## Harness Event Mapping

When the SDK harness product is available for writeback, map workflow phases
onto the harness event model:

- `RUN.CREATED`
- `TASK.RESOLVED`
- `PROFILE.SELECTED`
- `TOOLKIT.COMPILED`
- `CONTEXT.PLANNED`
- `CONTEXT.PACKED`
- `AGENT.ACTING`
- `VALIDATION.FINISHED`
- `OUTCOME.RECORDED`
- `LEARNING.PROPOSED`
- `RUN.CLOSED`

If the harness is unavailable, preserve the same facts in the final report and
mark writeback as deferred instead of pretending it happened.
