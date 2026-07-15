---
name: practice-system
description: This skill should be used when the user asks to "use superpowers", "follow a systematic workflow", "work test-first", "debug systematically", "verify before completion", "use agents where valuable", or asks how Harness practices compound across runs. It teaches the source-attributed Harness practice graph without inventing manual MCP controls.
version: 0.1.0
---

# Harness Practice System

Generated surface map: [capability catalog](./CAPABILITIES.generated.md).

Apply the Harness-native practice graph for substantive implementation work.
Treat it as an ambient, versioned workflow selected through Ensemble, not as a
collection of slash commands. Preserve user and project instructions as higher
authority than any practice.

## Core sequence

Use the smallest applicable slice of this graph:

1. Frame the problem, constraints, risks, and desired outcome.
2. Persist an approved specification when the change has real design choices.
3. Write an executable plan naming files, steps, tests, and proof commands.
4. Verify workspace isolation before editing.
5. Establish the failing behavior oracle when strict test-first work applies.
6. Execute the bounded plan slice.
7. Debug from a reproducible symptom and root-cause evidence on any failure.
8. Request and receive review at task checkpoints when risk warrants it.
9. Run fresh verification before every completion claim.
10. Choose the branch disposition explicitly.

Do not force every node onto trivial work. Record why a practice is
inapplicable when skipping it matters to later audit or learning.

## Host adaptation

Map the abstract practices to real host capabilities:

- Use the native Harness `plan` surface for durable plans and work graphs.
- Use Harness coordination for footprints, mentions, tensions, and handoffs.
- Use the host's isolated-workspace support for risky or parallel edits.
- Use project-declared oracle classes to choose tests, parity checks, live
  smoke, miri, soak, browser proof, or another validator.
- Use subagents when the task decomposes into independent bounded work and the
  host exposes a suitable agent model. Prefer the user's requested model when
  model selection exists; otherwise report that the host selected the model.
- Keep review and verification receipts tied to the claim they support.

Never fabricate `practice_status`, `practice_explain`, or another diagnostic
tool. Use those names only after the active MCP server actually registers them.
Until then, inspect the run replay and ordinary plan/coordination receipts.

## Activation and reentrancy

Apply practice cadence according to its contract:

| Practice | Trigger | Cadence |
|---|---|---|
| brainstorm/specify/plan/isolate | run setup | once per run unless a material discovery forces re-plan |
| test/execute/review | task checkpoint | once per applicable task |
| debug | any validation failure | once per distinct failure/root-cause loop |
| verify | before a status or completion claim | once per claim with fresh evidence |
| finish | change ready | once per branch disposition |

Verification does not wait for final review. Debugging does not depend on an
execution step; baseline, build, integration, and live failures can all trigger
it.

## Evidence discipline

Treat output as complete only when a current oracle supports it.

- Observe the test fail for the intended reason before calling a change
  test-driven.
- Re-run the exact proof after the final edit.
- Distinguish deterministic local fixtures from live, stateful evidence.
- Preserve typed refusals and failed checks as evidence rather than hiding
  them.
- Keep one anecdote as an episode, not as a promoted practice.
- Require same-tenant, same-project, same-practice-graph clustered evidence and
  the declared promotion gate before revising a canonical practice. The default
  gate requires 3 distinct episodes, 3 distinct runs, 2 distinct sessions, 2
  positive outcomes, and a positive rate of 2/3.
- Keep the committed promotion receipt and its authoritative episode support
  edges as the proof. Never promote from caller-supplied citations alone.

## Run-to-run learning

Let the ordinary Harness path compound practice evidence:

```text
Ensemble selection
  -> practice application and validator receipts
  -> run events and episode capture
  -> run-close Compound Engineering attribution
  -> fitness, revision, promotion, decay, or retirement proposal
  -> later Ensemble selection
```

Do not add a second memory store or learning loop. Capture episodes in the
tenant-bound Harness substrate. Retrieve bounded prior evidence at selection
boundaries and retain `rankSignals` plus episode provenance in citations. Keep
explicit opt-out and do-not-index markers authoritative. Treat retro-import as
an idempotent, reentrancy-safe runtime path whose partial recovery follows its
persisted phase receipts; it is not an agent MCP tool.

## Progressive disclosure

Read `references/source-provenance.md` when auditing upstream lineage,
licensing, source hashes, or the boundary between imported semantics and
Theorem-specific behavior.

Read `../../references/MEMORY_CAPABILITY.md` when applying episode capture,
tenant/project isolation, opt-out, deduplication, retro-import recovery, ranked
recall, or practice-promotion rules.
