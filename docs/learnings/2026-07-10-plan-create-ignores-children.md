# Theorem `plan create` silently ignores `children` — add tasks via `add_task`

**Kind:** gotcha
**Captured:** 2026-07-10
**Session signature:** `plan:1c9778d3e196c0c2`
**Domain tags:** theorem, plan-substrate, mcp

## Trigger

Called the Theorem `plan` MCP tool with `action:create` and a `children:[...]`
array (the tool schema advertises `children` at the top level). It returned a
success receipt (`affected:1`) but created a plan with ZERO tasks;
`plan query progress` then showed `total:0`. `create_plan` hard-codes
`tasks: BTreeMap::new()` and never reads `children` — only `refine` consumes it.

## Rule

`plan create` does not ingest `children`. Create the plan, then add each task
with a separate `plan add_task` call. Each `add_task` is a read-modify-write of
the whole plan record, so run them SEQUENTIALLY — parallel calls clobber each
other. (Filed upstream as Travis-Gilbert/Theorem#179: create should either
honor `children` or reject it with `invalid_params`.)

## Evidence

- `plan_substrate.rs:370` `tasks: BTreeMap::new()`; `children` read only at `:772` (`refine_plan_task`)
- `plan:1c9778d3e196c0c2` first `create` with children → `progress total:0`
- 8 subsequent `add_task` calls each `affected:1`

## Encoded in

- `docs/learnings/2026-07-10-plan-create-ignores-children.md` (this file)
