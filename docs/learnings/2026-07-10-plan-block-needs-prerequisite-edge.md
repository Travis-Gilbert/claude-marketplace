# A plan-task block written in the title is invisible — model it as a prerequisite edge

**Kind:** gotcha
**Captured:** 2026-07-10
**Session signature:** `plan:1c9778d3e196c0c2`
**Domain tags:** theorem, plan-substrate, mcp

## Trigger

Created plan task `U7` with "blocked on ambient identity D1-D3" written into
its TITLE. `plan query next_actionable` returned `U7` as the next claimable
task anyway — the substrate reads structure, not prose. A block is only honored
when it is a real dependency/prerequisite edge on the task node.

## Rule

On the Theorem plan substrate, encode blocks and dependencies as
`prerequisites` on the task, not as text in the title. A title-only "blocked"
note does not affect `next_actionable` / `frontier` / `blocked_set` queries —
the query will hand a "blocked" task straight to a head. This is the same
"don't hide deferred work in prose" anti-pattern the planning skill warns
about, enforced by the engine.

## Evidence

- `plan:1c9778d3e196c0c2` `query next_actionable` → `U7` despite the title block
- `blocked_set` only reflects prerequisite edges, not free text

## Encoded in

- `docs/learnings/2026-07-10-plan-block-needs-prerequisite-edge.md` (this file)
