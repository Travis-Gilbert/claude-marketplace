# Theorem's Harness Routing

Theorem's Harness is the plugin and default user-facing skill, plus small
utility skills for refresh, coordination, research, encoding, and structural
code compute:

| Canonical skill | Use when |
|---|---|
| `theorems-harness` | the user wants planning, implementation, debugging, review, context preparation, validation, reporting, coordination, memory, or routed specialist work |
| `context-refresh` | the current context artifact is stale and the agent only needs a fresh compile |
| `harness-coordinate` | another agent is active and the task needs presence, @mentions, wait, or handoff protocol |
| `peer-review` | multi-agent work is finishing, a commit/PR is near, or one frontier model should review another model's diff |
| `research` | the user wants direct fractal expansion, gap-frontier discovery, or code-symbol discovery |
| `encode` | a durable feedback item, solution, or postmortem should be saved |
| `compute_code` | a code-search question benefits from graph-structural ranking |

The older `/orchestrate` public command has been removed. `orchestrate_refresh`
remains an internal MCP/backend verb until the backend route is renamed.

## Internal Routing Modes

Do not expose these as separate user-facing skills:

- research
- retrofit
- review-plan
- diagnose
- tdd
- simplify
- code-review
- docs-update
- postmortem
- graph-writeback
- context-compile
- plugin-delegate
- federation-signal
- redis-harness
- thg-product-safety

These are phases inside Theorem's Harness.

## Profile Gates

Two registry profiles install state-machine guards that wrap every run.
See `PROFILES.md`, `ENGINEERS_MINDSET.md`, and `CONCISE_ACTION.md`.

| Guard | Owner | Blocks transition into |
|---|---|---|
| `DEFERRAL_GATE.CHECKED` | `engineers-mindset` | `ASK_USER`, `RUN.DEFERRED`, `RUN.FAILED`, `BLOCKED`, `NEEDS_CONTEXT`, `NEEDS_HUMAN_DECISION` |
| `CONCISE_ACTION.APPLIED` | `concise-action` | `RESPONSE.EMITTED` |

`ASK_USER`, `RUN.DEFERRED`, and `RUN.FAILED` are invalid unless
`DEFERRAL_GATE.CHECKED` passes. The gate is satisfied by an
`ENGINEERING_PASS` record (internal sources checked, external sources
checked when reality may live outside the repo, smallest attempted
experiment or reason none was safe, current best default action, exact
remaining blocker, the one specific user input needed).

Both gates compose with the Harness routing below. They do not change
mode selection; they prevent the run from collapsing into lazy deferral
or verbose narration.

## Routing Algorithm

1. Use `theorems-harness` by default.
2. If the user asks only to refresh context, route to `context-refresh`.
3. If the user asks only to message, ping, or coordinate with another agent,
   route to `harness-coordinate`.
4. If the user asks only for peer review, cross-model review, or another agent
   to inspect a diff, route to `peer-review`.
5. If the user asks only for fractal expansion, gap-frontier discovery, or
   code-symbol discovery, route to `research`.
6. If the user asks only to encode feedback, a solution, or a postmortem,
   route to `encode`.
7. If the user asks only for structural code search over an adjacency, route to
   `compute_code`.
8. If the user asks for exploration before commitment, run internal
   `theorize` mode.
9. If the user asks for a plan, checklist, spec, migration plan, or retrofit
   artifact, run internal `plan` mode.
10. If the user asks to modify files, run checks, fix a bug, simplify code, or
   ship, run internal `execute` mode.
11. If execution reveals unresolved ambiguity, route briefly through internal
   `theorize` mode, then return to the checklist.
12. Consult `checklist-manifest` before multi-step execution when the parent
   needs the compact table of user intent, current codebase state, additions or
   removals, and exact locations. Consult it again at report time when the
   parent needs the same checklist updated with done, partial, blocked, failed,
   skipped, or not-run reasons.
13. If work touches the paired harness SDK product or product graph client,
   consult `codex-sdk-harness-product` for a read-only context pass before
   locking decisions or editing.
14. If work touches Redis-backed harness state, THG product service, RESP/Valkey,
   tenant Redis keyspaces, or product deployment gates, consult
   `redis-harness-operator` or `redis-product-safety` for guardrails and
   validators. Do not treat those agents as implementation owners unless the
   parent has assigned a write-scoped task.

## Checklist Manifest Escalation

Use `checklist-manifest` when work needs a compact table in this shape:

| Unchecked box | Desired outcome | Where | Why |
|---|---|---|---|
| [ ] CM-001 | Outcome to produce or verify. | `file`, route, command, or runtime surface | Why this matters and what evidence grounds it. |

At completion, keep the same IDs and table shape, but update the first column
with `[x]`, `[~]`, `[!]`, or `[ ]` and explain every non-done item in `Why`.

## SDK Harness Product Escalation

Use `codex-sdk-harness-product` when work references any of these:

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
- default base URL vs tenant-scoped product base URL

## Redis Agent Escalation

Consult `redis-harness-operator` for a read-only Redis harness brief when work
references:

- Redis-backed harness runs/events/cache
- semantic cache or ContextArtifact cache behavior
- harness replay/fork/compare/patch proposal flows
- ContextArtifact attach/fork behavior
- local Redis unavailable fallback behavior
- operational state vs canonical graph boundaries

Consult `redis-product-safety` for a read-only product safety brief when work
references:

- `thg-product-server`
- tenant-scoped routes under `/v1/tenants/{tenant_id}/`
- `TheoremHotGraphClient`
- `THG_REDIS_URL`, `THG_REDIS_KEY_PREFIX`, `THG_REQUIRE_AUTH`,
  `THG_API_TOKENS`, or Railway product service deployment
- RESP/Valkey facade behavior
- OpenAPI, metrics, CORS, auth scopes, or product smoke tests

## Harness Event Mapping

When the SDK harness product is available for writeback, map workflow phases onto the harness event model:

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

If the harness is not available, preserve the same information in the final report and mark harness writeback as deferred instead of pretending it happened.
