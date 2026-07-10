# One plugin, many install channels at different versions — "is it live?" is per-channel

**Kind:** gotcha
**Captured:** 2026-07-10
**Session signature:** `plan:1c9778d3e196c0c2`
**Domain tags:** plugins, claude-code, desktop-app, marketplaces

## Trigger

The `theorems-harness` plugin existed as five+ on-disk copies at different
versions simultaneously, and the surface serving a running desktop
agent-mode session was NOT the one `sync-plugins.sh` updated:

- `local-desktop-app-uploads/theorems-harness` — symlink → repo (0.8.0), CLI channel
- `codex-marketplace/theorems-harness` — independent real clone (0.6.1), desktop channel
- registry `installPath` cache — a third version (0.5.13)
- `theorems-harness-marketplace` (0.1.6), `temp_1780363012841` (0.3.7) — orphan clones
- per-session `rpm/plugin_<id>/` materialization — frozen copy (0.6.1, days old)

`sync-plugins.sh` hard-coded only `local-desktop-app-uploads`. The desktop
app's agent-mode session materialized its plugin from `codex-marketplace`, so
it served stale skills while the CLI marketplace was current.

## Rule

Answer "is the plugin live?" per channel, not globally. A plugin can be served
by multiple independent marketplace clones (each its own git clone) plus a
per-session `rpm/` materialization that is frozen until a NEW session. Point
every hosting marketplace at one source (symlink or re-clone) AND push to the
shared remote; a running session's copy will not refresh mid-session.

## Evidence

- `readlink`/version audit across `~/.claude/plugins/marketplaces/*/theorems-harness`
- rpm manifest `plugin_01KXTkZGZDxAB9E5f1SMzm88` = 0.6.1, dir mtime days before session
- `codex-marketplace` and `local-desktop-app-uploads` both clones of `claude-marketplace`

## Encoded in

- `docs/learnings/2026-07-10-plugin-install-channel-drift.md` (this file)
