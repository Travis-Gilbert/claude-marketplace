# Deferrals: <SLUG>

_Read by `spec-coverage-gate` (pre-execute) and `drift-auditor` (post-execute). One row per spec section the user has explicitly chosen to defer. Both gates trust this file and never write to it. Empty file is the default._

## Format

One Markdown table. One row per waiver. Three required columns:

| Column | Purpose |
|---|---|
| `spec_section_ref` | The exact `§N.Y` reference the waiver covers. No fuzzy match: `§3.2.1` is a separate requirement from `§3.2`. |
| `reason` | One-line explanation of why the section is deferred. The reason is for the user's future self and for anyone reviewing the plan diff. |
| `user_typed_at_timestamp` | ISO 8601 timestamp the user added this row. Both gates surface the timestamp in their output so it is clear which waivers are stale. |

## Table

| spec_section_ref | reason | user_typed_at_timestamp |
| --- | --- | --- |

## Rules

- **Only the user adds rows.** The gates and the executor never auto-write to this file. If a row appeared without the user typing it, that is a bug in the harness.
- **One row per `§N.Y`.** If multiple subsections of `§3` are deferred, list each on its own row (`§3.1`, `§3.2`, ...). The gates do exact-reference matching.
- **A waiver covers the requirement at that `§N.Y` and nothing else.** A waiver on `§3` does not cascade to `§3.2`.
- **Empty table is valid.** Default state. Means every spec requirement must be covered by a checklist item or implemented in the diff.
- **Delete rows when the work lands.** If a waived section is later implemented, remove its row so future runs treat it as live.
