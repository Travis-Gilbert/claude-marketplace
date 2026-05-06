# Production Gates

A task is production-ready only when it passes the relevant gates or explicitly documents why a gate does not apply.

## Required Gates

- changed behavior has tests or another concrete validation method
- known failing checks are identified as new, pre-existing, or unrelated
- no silent deferred work
- no hidden TODOs without checklist coverage
- security risk considered
- performance risk considered
- migration or data risk considered
- rollback or revert path considered
- observability or logging considered
- documentation updated or explicitly deferred
- original checklist reconciled in the final report

## Change-Specific Gates

### Migrations And Data Changes

- backup or rollback path
- idempotency considerations
- deploy order
- compatibility with local and production settings
- cleanup of partial-failure states

### API Changes

- backwards compatibility
- schema or versioning notes
- auth and permission behavior
- rate-limiting or abuse considerations
- structured error responses

### THG / Database Harness / Graph Changes

- source provenance is still visible
- confidence or tension handling is still honest
- replay, fork, compare, and patch behavior are grounded in tests or live code
- cache or hot-state behavior is not mislabeled as canonical memory
- performance budget or degradation story is understood
- `THG_MODE` boundaries are preserved

### UI Changes

- empty states
- loading states
- error states
- keyboard and accessibility basics
- responsive behavior
- fallback or feature-flag path where relevant

## Reporting Rule

An open gate is not a hidden footnote. Surface it in:

- the plan's `Production Gates` section
- the execution report's `Production Gate Review`
- `Incomplete or Blocked Work` when the open gate materially blocks readiness
