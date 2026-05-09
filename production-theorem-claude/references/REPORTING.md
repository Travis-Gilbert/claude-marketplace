# Reporting

Production-Theorem reports are reconciliation artifacts, not victory speeches.

Orchestrate makes this stricter: every report must reconcile a checklist or say
why no checklist was needed. For multi-step, product, SDK, Redis, harness, or
production-facing work, a checklist is always needed.

## Artifact Lineage

Preserve this lineage whenever possible:

`TheoremBrief -> PlanningArtifact -> ExecutionReport -> Postmortem or ContextArtifact`

Each step should make the next one cheaper and more honest.

## Executive Summary Rules

Every major artifact starts with a concise executive summary.

Include:

- goal
- intent
- concise summary of work

Avoid:

- decorative prose
- repeated checklist detail
- hidden blockers

## Checklist Reconciliation Rules

- keep stable checklist IDs from planning through execution
- never renumber completed items to hide scope changes
- mark status explicitly: `planned`, `done`, `partial`, `blocked`, or `skipped`
- attach evidence and validation to each completed or partially completed item
- explain every non-`done` item
- preserve newly discovered scope as new checklist IDs rather than hiding it in
  notes
- include Redis/harness writeback status when the run touches harness state,
  SDK product behavior, THG product routes, or ContextArtifact reuse

## Incomplete Work Rules

For every incomplete item, report:

- what was not done
- why it was not done
- the supporting evidence
- the risk of leaving it open
- the next action
- the best owner, skill, or agent route

## Learning Patch Candidates

Every execution should propose candidate learnings when relevant:

- new test pattern
- reusable implementation pattern
- code convention worth preserving
- new domain term
- ADR candidate
- postmortem candidate
- retrieval hint
- routing rule

## SDK Harness Reporting

If the SDK harness product is available, the report should be compatible with these lifecycle moments:

- `RUN.CREATED`
- `TASK.RESOLVED`
- `CONTEXT.PLANNED`
- `CONTEXT.PACKED`
- `AGENT.ACTING`
- `VALIDATION.FINISHED`
- `OUTCOME.RECORDED`
- `LEARNING.PROPOSED`
- `RUN.CLOSED`

If the harness is unavailable, preserve the same information in markdown and mark harness writeback as deferred.

## Orchestrate Reporting

Default report lineage:

`Orchestrate Brief -> Orchestrate Plan -> Orchestrate Report -> Learning Candidate`

The report must include:

- checklist reconciliation
- delegation reconciliation
- context used and action rail choices
- validation table
- incomplete or blocked work
- production gate review
- learning/writeback candidates

## Failure Language

Use direct status language:

- done
- partial
- blocked
- failed
- not run

Do not replace a failed or partial result with optimistic phrasing.
