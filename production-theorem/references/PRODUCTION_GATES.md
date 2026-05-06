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

### SDK Harness / THG Product / Graph Changes

- source provenance is still visible
- TypeScript and Python SDK surfaces stay consistent where they are meant to mirror each other
- replay, fork, compare, patch, and THG product behaviors are grounded in tests or shipped client code
- default harness SDK client behavior is not conflated with tenant-scoped product graph behavior
- auth, tenant, and base URL expectations are explicit
- performance budget or degradation story is understood

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
