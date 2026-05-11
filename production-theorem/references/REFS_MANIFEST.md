# Refs Manifest Schema

Every plugin that vendors reference content under `refs/` SHOULD ship a
`refs/MANIFEST.md` at the top of that directory. The manifest is the
canonical contract between the plugin's static disk content and the
Theseus harness retrieval layer.

## Purpose

Two consumers read `MANIFEST.md`:

1. **The SessionStart walker hook** (`~/.claude/hooks/refs-manifest-load.sh`)
   reads MANIFEST.md from every enabled plugin and injects a bounded
   summary into the session's `additionalContext`. This is the **static
   fallback layer (Phase 1)** of the refs-visibility design.

2. **The Theseus ingest pipeline** (`python3 manage.py ingest_design_refs`)
   reads MANIFEST.md to create Theseus Objects per ref, each tagged with
   `source_system='design_ref'`. Once ingested, the orchestrate backend
   surfaces task-relevant refs in `memory_recall.read_first` per turn.
   This is the **smart primary layer (Phase 2)**.

The two layers compose: F (Phase 2) is the primary retrieval surface; A
(Phase 1) is durable fallback when retrieval misses or the backend is
unreachable.

## Required Fields

Every row in the manifest table represents one reference (typically one
vendored repo or one curated reference set). Required fields per row:

| Field | Type | Example | Notes |
|---|---|---|---|
| `path` | string | `radix-primitives/` | Path under `refs/`. Must resolve on disk |
| `source` | URL | `https://github.com/radix-ui/primitives` | Upstream source |
| `license` | string | `MIT` | SPDX ID or `NOASSERTION` (flagged risk) |
| `bucket` | string | `components / unstyled` | Free-form, but stay consistent within a manifest |
| `pull_what` | string (1-2 sentences) | "Unstyled accessible primitives. Canonical source for Dialog, Popover, Select, Tooltip, Tabs" | The retrieval-time hint: what should the model pull from here when this ref matches a task |

Optional fields (recommended when applicable):

| Field | Type | Example | Notes |
|---|---|---|---|
| `framework` | string | `react` | One of: react, vue, svelte, solid, vanilla, multi |
| `entry_paths` | comma list | `components/, packages/themes/` | Subdirectories of `path` worth deep-reading |

## Canonical Format

`MANIFEST.md` must contain a single markdown table with this header:

```
| path | source | license | bucket | framework | pull_what |
|---|---|---|---|---|---|
| <path under refs/> | <URL> | <SPDX> | <bucket> | <framework> | <1-2 sentence retrieval hint> |
```

Free prose above the table is fine for orientation (one paragraph max).
The walker hook reads the entire file and budgets by character cap; the
ingest command parses the table.

## Example

See `codex-plugins/ui-design-pro/refs/MANIFEST.md` for the canonical
sample (19 rows: 12 pre-existing + 7 added in v1.2.0).

## Budgets

The SessionStart walker enforces:

- **Per-plugin cap:** 2000 characters per plugin's manifest summary
- **Total cap:** 8000 characters across all enabled plugins
- **Per-row line:** ~150 characters maximum (path + source + license +
  bucket + framework + pull_what)

When a single plugin's manifest exceeds 2000 characters, the walker
truncates to the first N rows and appends a `... (M more entries; see
refs/MANIFEST.md)` line. The ingest command (Phase 2) has no such cap —
all rows ingest.

## Fallback Semantics (F primary, A fallback)

When both Phase 2 (ingest + harness retrieval) and Phase 1 (walker
inject) are active, the walker hook detects whether Theseus has already
surfaced design_ref Objects in `memory_recall.read_first` for the
current turn and **skips injection if so**. The walker fires only when:

- The Theseus orchestrate backend is unreachable, OR
- Retrieval returned zero design_ref Objects for the current task, OR
- The user explicitly forced the static layer via env var
  `REFS_FORCE_STATIC=1`.

This makes A a durable fallback rather than a redundant always-on
layer. See `apps/orchestrate/runtime/orchestrate.py:1332` for where the
plugin bank surfaces refs in Phase 2.

## Adding a New Plugin's MANIFEST.md

1. Inventory `refs/` content: every distinct vendored repo, design
   library, doc archive, etc. gets one row.
2. Bucket them: components / unstyled, components / styled, tokens,
   accessibility, animation, curated archive, etc. (free-form; pick
   consistent labels within your manifest).
3. Write the `pull_what` field as if you were briefing another engineer
   on what's in each ref. One or two sentences. Avoid marketing prose.
4. License check via `gh api repos/<owner>/<repo> --jq .license` for
   any GitHub-sourced refs. `NOASSERTION` results need either a swap
   to a license-clear alternative or explicit user approval.
5. Commit MANIFEST.md alongside the refs/ content.

After committing, run `python3 manage.py ingest_design_refs` (Phase 2)
to land the refs in THG. Until that runs, only the walker (Phase 1) can
surface them.

## Drift Protection

When `refs/` content changes (new vendored repo, removed repo, source
URL changed), the manifest must update in the same change. There is no
automatic enforcement in v1; future work can add a PostToolUse hook
that detects edits to files under `refs/` and prompts to update
MANIFEST.md.

The ingest command (Phase 2) is idempotent: re-running on an updated
MANIFEST.md updates existing Objects rather than duplicating them
(matched by `slug = <plugin-name>-<row-path-slugified>` +
`source_system='design_ref'`).
