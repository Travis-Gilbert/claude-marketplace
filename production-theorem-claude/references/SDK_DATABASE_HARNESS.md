# SDK Database Harness Bridge

Orchestrate can run with or without a live SDK/database harness. The report must
preserve the same lifecycle facts either way.

## Harness Lifecycle Events

Map Orchestrate phases onto these event names when the harness is available:

| Orchestrate phase | Harness event |
|---|---|
| observe | `RUN.CREATED` |
| resolve | `TASK.RESOLVED` |
| delegate | `PROFILE.SELECTED` |
| delegate | `TOOLKIT.COMPILED` |
| plan | `CONTEXT.PLANNED` |
| compile_context | `CONTEXT.PACKED` |
| execute | `AGENT.ACTING` |
| validate | `VALIDATION.FINISHED` |
| report | `OUTCOME.RECORDED` |
| learn | `LEARNING.PROPOSED` |
| close | `RUN.CLOSED` |

## Client Boundaries

- `TheoremContextClient` owns the default Codex-facing context, harness, action
  rail, replay, fork, compare, and patch proposal routes.
- `TheoremHotGraphClient` owns tenant-scoped product graph routes such as
  `command`, `batch`, `run`, `contextPack`, and `graphQuery`.
- Do not describe tenant product behavior from default harness assumptions.
- Do not describe default harness behavior from tenant product assumptions.

## Redis Boundary

- Redis-backed harness state is operational state.
- Tenant THG product state must be key-isolated by tenant.
- Redis keys, service URLs, and bearer tokens must not appear in reports except
  as redacted or documented variable names.
- Canonical graph promotion requires an explicit reviewed write path.

## Writeback Policy

If the SDK/harness is available:

1. Create or attach a Context Artifact when the run needs reusable context.
2. Record run state and validation outcomes when host tools permit it.
3. Queue learning or patch proposals rather than silently promoting them.
4. Include writeback evidence in the final report.

If unavailable:

1. Preserve the same lifecycle facts in markdown sections.
2. Mark writeback as deferred.
3. Include the missing route/tool/runtime as evidence.
4. Provide a concrete next action and suggested owner/agent.
