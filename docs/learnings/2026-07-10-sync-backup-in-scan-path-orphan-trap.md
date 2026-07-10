# Plugin backups inside the marketplace path are themselves discoverable orphan plugins

**Kind:** gotcha
**Captured:** 2026-07-10
**Session signature:** `plan:1c9778d3e196c0c2`
**Domain tags:** plugins, claude-code, sync-plugins, slash-commands

## Trigger

`sync-plugins.sh` replaced a physical plugin dir with a symlink and backed the
original up to `<marketplace>/<name>.backup.<timestamp>` — INSIDE the
marketplace scan path. The orphan diagnostic
(`find ~/.claude/plugins/marketplaces -name SKILL.md -path '*/planning-theorem/*'`)
then found the backup as a SECOND, stale `/planning-theorem` skill: a bare
slash-command resolution ambiguity (the documented "orphan plugin trap").

## Rule

Never write plugin backups under `~/.claude/plugins/marketplaces/` — that is
the directory Claude Code scans for slash-command / skill resolution, so an
in-tree backup becomes a discoverable stale plugin. Put backups in a sibling
outside the scan path (e.g. `~/.claude/plugins/.sync-backups/`).

## Evidence

- Diagnostic flagged `codex-marketplace/theorems-harness.backup.<ts>/skills/planning-theorem/SKILL.md` as `[STALE]`
- Fix: `sync-plugins.sh` `BACKUP_DIR="$HOME/.claude/plugins/.sync-backups"`, both backup code paths relocated
- Related: repo `CLAUDE.md` "Slash Command Resolution and the Orphan Plugin Trap"

## Encoded in

- `docs/learnings/2026-07-10-sync-backup-in-scan-path-orphan-trap.md` (this file)
