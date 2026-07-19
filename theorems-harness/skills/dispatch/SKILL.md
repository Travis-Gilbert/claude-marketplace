---
name: dispatch
description: Use for the current Harness dispatch job board or the distinct GitHub Actions session-spawn handoff. Triggers on queue, job board, submit, note, archive, receiver, or spawn session.
---

# Dispatch

Read `../../references/COORDINATION_OPERATIONS_CAPABILITY.md` first. Dispatch
jobs, durable Plans, multi-head task nodes, and session spawning are different
state machines.

## Job board

Prefer GraphQL `jobList`, `jobSubmit`, `jobNote`, and `jobArchive`; flat
compatibility uses `job_list`, `job_submit`, `job_note`, and `job_archive`.

1. List by repository and derived state (`pending`, `started`, `archived`) to
   avoid duplicate intent.
2. Submit `title`, `repo`, one useful `spec_ref` or `spec_inline`, and optional
   priority (`P0`/`P1`/`P2`) and target head (`claude`/`codex`/`either`). Preserve
   the returned `job_id`, `idempotency_key`, and `created`/reuse result.
3. Submission queues a durable THG thread. It does not prove a receiver exists
   or execution started. Inspect `dispatch_mirrored` and any mirror error when
   the server reports them.
4. Append progress with `job_note`. The receiver alone should use
   `start_session_ref` for the set-once start write. Inspect `found`, `applied`,
   message, state, and receipts.
5. Close with `job_archive` plus a reason. Archive is not delete, cancel, retry,
   or proof of successful work.

The optional Postgres dispatch queue owns hot leases/retries internally; it is
not an agent tool. The THG job thread remains canonical coordination history.

## Spawn now

Flat `spawn_session` writes a room-visible record and Harness run, then sends
the configured GitHub Actions `repository_dispatch` handoff. It requires write
mode and policy admission. A `running` result means dispatch was accepted, not
that an agent completed. Preserve `dispatch_id`, `run_id`, record, policy
receipt, repository/branch, status, and `dispatch_error`.

There is no `spawn_handoff_session` tool and `spawn_session` is not a local CLI
launcher. Use the host's actual local-agent mechanism when local execution is
required.
