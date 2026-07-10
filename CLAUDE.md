# Codex Plugins

Multi-plugin repository. Each subdirectory is a standalone Claude Code plugin.

## Plugin Install Model

Three gates must all be satisfied for a plugin to load:

| Step | What | Where | How |
|------|------|-------|-----|
| 1. Symlink | Plugin files accessible | `~/.claude/plugins/marketplaces/local-desktop-app-uploads/<name>/` | `./sync-plugins.sh` |
| 2. Registry | Plugin registered | `~/.claude/plugins/installed_plugins.json` | `./sync-plugins.sh` |
| 3. Enablement | Plugin enabled | `~/.claude/settings.json` → `enabledPlugins` | Manual: add `"<name>@local-desktop-app-uploads": true` |

`sync-plugins.sh` now handles all three steps automatically. If step 3 fails, manually add `"<name>@local-desktop-app-uploads": true` to `enabledPlugins` in `~/.claude/settings.json`.

`~/.claude/plugins/<name>/` (without marketplace namespace) is NOT read by Claude Code.

## Active Plugins

| Plugin | Version | Path |
|--------|---------|------|
| ui-design-pro | 1.1.0 | `ui-design-pro/` |
| scipy-pro | 4.0.0 | `scipy-pro/` |
| django-design | 4.0.0 | `django-design/` |
| d3-pro | 1.0.0 | `d3-pro/` |
| three-pro | 1.0.0 | `three-pro/` |
| shipit | 1.0.0 | `shipit/` |
| ml-pro | 1.0.0 | `ml-pro/` |
| django-engine-pro | 1.0.0 | `django-engine-pro/` |
| next-pro | 1.0.0 | `next-pro/` |
| theorems-harness | 0.8.0 | `theorems-harness/` |
| app-forge | 1.0.0 | `app-forge/` |
| swift-pro | 1.0.0 | `swift-pro/` |
| vie-design | 2.0.0 | `vie-design/` |

## Sync

Run `./sync-plugins.sh` to symlink all plugins to the Claude Code install path.
Run `./sync-plugins.sh --status` to check which plugins are linked.

## Slash Command Resolution and the Orphan Plugin Trap

This bit us hard in May 2026 with `theorems-harness`. Recording the failure mode here so we do not waste another session diagnosing the same thing.

**The trap:** when a plugin is "deleted" from the marketplace (removed from `.claude-plugin/marketplace.json`), its directory at `~/.claude/plugins/marketplaces/<marketplace>/<plugin>/` does NOT get cleaned up automatically. The orphan directory persists. Claude Code may still scan it during slash-command resolution, even when the plugin is disabled in `enabledPlugins` or absent from `installed_plugins.json`. If the orphan plugin defines a slash command with the same bare name as a different active plugin (e.g. both define `/orchestrate`), bare slash invocations can resolve to the orphan instead of the intended active plugin.

**Symptom:** bare `/<command>` hangs or returns "Unknown command" while the fully-qualified `/<plugin>:<command>` works correctly. The user's restarts will not fix it because no on-disk state I usually look at is wrong; the orphan directory just is.

**Three-step fix:**

1. Delete the orphan directory from the marketplace clone: `rm -rf ~/.claude/plugins/marketplaces/<marketplace>/<orphan-plugin>/` (or rename it aside with a leading `.` for reversibility)
2. Remove the disabled entry from user-level `enabledPlugins` in `~/.claude/settings.json`: drop the `"<orphan>@<marketplace>": false` key entirely
3. Remove any matching entry from `~/.claude/plugins/installed_plugins.json` (its `plugins.<orphan>@<marketplace>` array)

After all three: open a NEW Claude Code session (not `--resume`). The orphan should no longer be discoverable.

**Prevention going forward:** when removing a plugin from `.claude-plugin/marketplace.json`, also `rm -rf` the plugin's source directory in this repo. Plugins exist in this repo as directories AND in marketplace.json as listing entries; both must be removed together.

`theorem-context-claude/` is intentionally not a top-level plugin directory anymore. Its canonical source now lives under `theorem-context-sdk/claude-code/`; do not recreate the top-level directory when syncing Context Theorem SDK or Pairformer hook work.

**Diagnostic to run first when a bare slash command misbehaves:**

```bash
find ~/.claude/plugins -name "<command-name>.md" -path "*/commands/*"
find ~/.claude/plugins -name "SKILL.md" -path "*/<command-name>/*"
```

If those return more than one plugin, the bare resolution is ambiguous. Use the fully-qualified form OR remove the orphan.

## Plugin Install Gotchas (learned the hard way)

- **Scope flip.** Adding a plugin entry to project-level `enabledPlugins` (in `<project>/.claude/settings.json`) when that plugin is already installed at user scope causes Claude Code to FLIP the `installed_plugins.json` scope from `user` to `project` on the next session start. The install path stays at the user-cache location, creating a project-scope/user-path mismatch that breaks plugin command dispatch silently. If a plugin is user-scoped, leave it that way; do not add it to project-level `enabledPlugins`.

- **Resume vs new session.** Claude Code's `--resume <session-id>` reuses the session's in-memory tool/MCP registry from when the session started. File-level edits to `installed_plugins.json`, `enabledPlugins`, or plugin caches will NOT take effect in a resumed session if they touch the registry. After any plugin-state change, open a brand-new conversation (not resume) to verify.

- **Duplicate version directories.** Having both `~/.claude/plugins/cache/<marketplace>/<plugin>/0.2.3/` AND `0.2.4/` present simultaneously confuses Claude Code's resolution even when `installed_plugins.json` points at only one. After updating a plugin, remove or rename-aside the OLD version directory.

- **The marketplace clone is a real source.** `~/.claude/plugins/marketplaces/<marketplace>/` is not just a registry index. Claude Code reads plugin files directly from here during command/skill discovery. Edits to the marketplace clone affect runtime behavior on the next session start, regardless of what is in `installed_plugins.json`.

## Manual Plugin Refresh (when `/plugin` is unavailable)

Some Claude Code environments do not expose the `/plugin` slash command. To force-refresh an installed plugin's cache to match the marketplace clone's current state, use `~/.claude/scripts/refresh-plugin.py`. The script materializes the marketplace clone's plugin source into the version-pinned cache and updates `installed_plugins.json`. Backups are timestamped and reversible via the `--rollback` flag.

```bash
~/.claude/scripts/refresh-plugin.py theorems-harness            # default flow
~/.claude/scripts/refresh-plugin.py theorems-harness --dry-run  # preview
~/.claude/scripts/refresh-plugin.py theorems-harness --force    # overwrite stale cache
~/.claude/scripts/refresh-plugin.py --list                        # show all installed plugins + versions
~/.claude/scripts/refresh-plugin.py --rollback                    # restore previous installed_plugins.json
```

The script does NOT touch `enabledPlugins` (intentional, since touching it can trigger the scope-flip bug). Always start a new session after running it.

## Epistemic Seeder Notes

- `seed_knowledge.py` over-extracts structural lines as claims. Target spec Part III sample claims, not raw agent markdown lines.
- `GIT_LFS_SKIP_SMUDGE=1` required when cloning DRF into refs/ (large test fixtures).

## Remote

Remote: `https://github.com/Travis-Gilbert/Plugins-building.git`
