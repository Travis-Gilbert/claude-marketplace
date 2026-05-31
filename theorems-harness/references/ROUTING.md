# Theorem's Harness Routing

Theorem's Harness is an adaptive session router. The user-visible command is
`/harness`; utility commands remain available for narrow operations, but the
default behavior is to choose the best capability mix for the active task and
revise that choice as evidence changes.

## Public Surface

| Surface | Role |
|---|---|
| `/harness` / `theorems-harness` | Default opt-in. The agent observes, routes, acts, validates, remembers, and reports through the harness. |
| `/context-refresh` | Narrow context artifact refresh. |
| `/coordinate` | Room digest, intent/reflection writes, presence, mentions, waits, and handoffs. |
| `/peer-review` | Cross-frontier-model review before commit, PR, launch report, or risky closeout. |
| `/research` | Direct fractal expansion, gap-frontier discovery, or code-symbol discovery. |
| `/encode` | Durable feedback, solution, or postmortem write. |
| `/compute_code` | Graph-structural code ranking. |

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
- `research`
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
- harness begin/get/step/search/context/patch/replay/fork/compare
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
