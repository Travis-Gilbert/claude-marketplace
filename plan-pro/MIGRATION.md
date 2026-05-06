# plan-pro v1.0.0 to v1.1.0 Migration Notes

## What changed

v1.1.0 replaces the LLM-orchestrated plugin (21 agents, 3-phase planning chain)
with an SDK-driven Python orchestrator (5 agents, single planning call). The
slash command surface is unchanged: `/plan`, `/execute`, `/review`, and
`/retrofit` work the same way externally.

## What stays the same

- Final artifact paths: `docs/plans/<slug>/implementation-plan.md` and
  `review-report.md` are produced in the same locations and the same shapes.
- Multi-stage plans (4 or more stages or 10 or more tasks) still split into
  an index + per-stage sub-plans.
- Slash command names and argument shapes.
- Existing plans on disk remain readable.

## What's gone

The following intermediate artifacts are no longer produced:

- `docs/plans/<slug>/research-brief.md`
- `docs/plans/<slug>/design-doc.md`
- `docs/plans/<slug>/decisions/*.md` (ADRs)

If you relied on any of these, generate them with a one-off prompt before
upgrading. The reasoning is that on actual usage, nobody re-read them once
the plan was written; they were write-only scaffolding.

The following commands are removed (their behavior is now folded into `/plan`):

- `/research`
- `/brainstorm`
- `/write-plan`
- `/learn`

## Why

`/plan` cost roughly 70-85% more tokens than necessary because the 3-phase
chain produced 4 docs you only re-read 1 of. `/execute` ran 4-6 LLM calls per
task in series; v1.1.0 runs 3 (with the two reviewers in parallel) and
prompt-caches the per-task system context.

Estimated improvements on a 10-task plan:

- `/plan`: 70-85% token reduction
- `/execute`: 60-75% token reduction, 2-3x wall-clock speedup

## Reverting

The previous version remains in
`~/.claude/plugins/cache/codex-marketplace/plan-pro/1.0.0/`. To roll back, set
your plugin manifest to depend on `1.0.0` explicitly.

## Python dependency

v1.1.0 requires Python 3.11 or newer in the user's `PATH`. The first
invocation of `/plan` or `/execute` creates a venv inside the plugin directory
and installs `claude-agent-sdk`, `pydantic`, and `anyio`. Subsequent
invocations reuse it.
