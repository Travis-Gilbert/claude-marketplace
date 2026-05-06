# Production-Theorem / Orchestrate Routing

Production-Theorem exposes one default user-facing skill:

| Canonical skill | Use when |
|---|---|
| `orchestrate` | the user wants planning, implementation, debugging, review, context preparation, validation, reporting, or routed specialist work |

The older skill names remain compatibility surfaces, but Orchestrate is the
default product command.

| Compatibility surface | Orchestrate mode |
|---|---|
| `theorize` | `orchestrate mode=theorize` |
| `brainstorm` | `orchestrate mode=theorize` |
| `planning-theorem` | `orchestrate mode=plan` |
| `plan` | `orchestrate mode=plan` |
| `execute` | `orchestrate mode=execute` |

## Important Note About Aliases

Treat these as compatibility aliases in workflow language and outputs. Do not
delete old skills until host compatibility is tested. If the host environment
needs a real slash alias, add it through host-specific command wiring outside
the skill itself.

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

These are phases inside Orchestrate.

## Routing Algorithm

1. Use `orchestrate` by default.
2. If the user asks for exploration before commitment, run internal
   `theorize` mode.
3. If the user asks for a plan, checklist, spec, migration plan, or retrofit
   artifact, run internal `plan` mode.
4. If the user asks to modify files, run checks, fix a bug, simplify code, or
   ship, run internal `execute` mode.
5. If execution reveals unresolved ambiguity, route briefly through internal
   `theorize` mode, then return to the checklist.
6. Consult `checklist-manifest` before multi-step execution when the parent
   needs the compact table of user intent, current codebase state, additions or
   removals, and exact locations. Consult it again at report time when the
   parent needs the same checklist updated with done, partial, blocked, failed,
   skipped, or not-run reasons.
7. If work touches the paired harness SDK product or product graph client,
   consult `codex-sdk-harness-product` for a read-only context pass before
   locking decisions or editing.
8. If work touches Redis-backed harness state, THG product service, RESP/Valkey,
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
