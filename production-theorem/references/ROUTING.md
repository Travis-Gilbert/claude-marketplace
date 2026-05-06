# Production-Theorem Routing

Production-Theorem exposes exactly three user-facing skills:

| Canonical skill | Compatibility alias | Use when |
|---|---|---|
| `theorize` | `brainstorm` | the user wants exploration, adversarial clarification, option pressure, or design interrogation before commitment |
| `planning-theorem` | `plan` | the user wants a production-grade plan, checklist, spec, migration plan, retrofit plan, or execution handoff |
| `execute` | none | the user wants implementation, debugging, testing, simplification, validation, or final reconciliation |

## Important Note About Aliases

Treat `brainstorm -> theorize` and `plan -> planning-theorem` as compatibility aliases in workflow language and outputs. Do not invent unsupported skill metadata. If the host environment needs a real slash alias, add it through host-specific command wiring outside the skill itself.

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

These are phases inside one of the three canonical skills.

## Routing Algorithm

1. If the user asks for exploration before commitment, use `theorize`.
2. If the user asks for a plan, checklist, spec, migration plan, or retrofit artifact, use `planning-theorem`.
3. If the user asks to modify files, run checks, fix a bug, simplify code, or ship, use `execute`.
4. If execution reveals unresolved ambiguity, route briefly through `theorize`, then return to the checklist.
5. If work touches the paired harness SDK product or product graph client, consult `codex-sdk-harness-product` before locking decisions or editing.

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

## Harness Event Mapping

When the SDK harness product is available for writeback, map workflow phases onto the harness event model:

- `RUN.CREATED`
- `TASK.RESOLVED`
- `CONTEXT.PLANNED`
- `CONTEXT.PACKED`
- `AGENT.ACTING`
- `VALIDATION.FINISHED`
- `OUTCOME.RECORDED`
- `LEARNING.PROPOSED`
- `RUN.CLOSED`

If the harness is not available, preserve the same information in the final report and mark harness writeback as deferred instead of pretending it happened.
