# Codex Plugins

Multi-plugin Claude Code marketplace. Each top-level subdirectory with a `.claude-plugin/plugin.json` is a standalone plugin. The repo also carries the epistemic-layer tooling, companion SDKs, and a Django MCP server that back the plugins.

Marketplace manifest: `.claude-plugin/marketplace.json` (declared name `codex-marketplace`).
Git remote (`origin`): `Travis-Gilbert/claude-marketplace`. The README and some scripts still reference the older repo name `Plugins-building`; treat `claude-marketplace` as canonical.

## Repository Layout

```
claude-marketplace/
├── .claude-plugin/marketplace.json   # Marketplace listing (20 plugins)
├── .mcp.json                         # Repo-level MCP servers (see below)
├── sync-plugins.sh                   # Symlink + register + enable all plugins
├── resync-codex-plugin.sh            # Force a running CC to load a pushed GIT-marketplace plugin
├── <plugin>/                         # 20 marketplace plugins (table below)
├── ui-lab/                           # Lab/vendored UI source + JS-Pro plugin (NOT in marketplace.json)
├── plugin-server/                    # Django app: HTTP MCP server backing the epistemic layer
├── theorem-context-sdk/              # Context Theorem SDKs: theorem-context-ts + theorem-context-py
├── scripts/epistemic/                # Shared epistemic pipeline (claims, tensions, confidence, embeddings)
├── skills/                           # Standalone skill workflows (next-tailwind-*)
├── docs/                             # Plans and divergence notes
└── *.md                              # Plugin specs + epistemic-layer spec (chat-skill bridge docs)
```

## Plugin Install Model

Three gates must all be satisfied for a plugin to load:

| Step | What | Where | How |
|------|------|-------|-----|
| 1. Symlink | Plugin files accessible | `~/.claude/plugins/marketplaces/local-desktop-app-uploads/<name>/` | `./sync-plugins.sh` |
| 2. Registry | Plugin registered | `~/.claude/plugins/installed_plugins.json` | `./sync-plugins.sh` |
| 3. Enablement | Plugin enabled | `~/.claude/settings.json` → `enabledPlugins` | `./sync-plugins.sh` (manual fallback) |

`sync-plugins.sh` handles all three steps automatically. If step 3 fails, manually add `"<name>@local-desktop-app-uploads": true` to `enabledPlugins` in `~/.claude/settings.json`.

`~/.claude/plugins/<name>/` (without the marketplace namespace) is NOT read by Claude Code.

**Namespace vs. declared name.** The on-disk install path namespace is `local-desktop-app-uploads` (hardcoded in `sync-plugins.sh`), but `marketplace.json` declares the marketplace `name` as `codex-marketplace`. They are intentionally different: the namespace is where the local sync symlinks land; the manifest name is the listing identity. Plugin keys in `enabledPlugins`/`installed_plugins.json` use `<name>@local-desktop-app-uploads`.

## Active Plugins

20 plugins are listed in `marketplace.json`. Versions below are the source of truth from each plugin's `plugin.json` (they match `marketplace.json`).

| Plugin | Version | Agents | Cmds | Skills | Domain |
|--------|---------|:------:|:----:|:------:|--------|
| animation-pro | 0.1.0 | 10 | 9 | 4 | Motion design (UI, 3D, creative, video) |
| app-forge | 1.0.0 | 6 | 2 | 0 | Web→native / Tauri / Swift app shells |
| app-pro | 1.0.0 | 6 | 1 | 1 | Web→mobile: PWA, React Native, offline, mobile API |
| cosmos-pro | 1.0.0 | 5 | 2 | 5 | cosmos.gl + Mosaic + DuckDB graph viz |
| d3-pro | 1.0.0 | 8 | 1 | 1 | D3.js data visualization |
| django-design | 3.0.0 | 5 | 6 | 1 | Full-stack Django (HTMX, Alpine, Tailwind, Cotton) |
| django-engine-pro | 1.0.0 | 7 | 9 | 1 | Django backend: ORM, DRF/Ninja, polymorphic, MCP |
| ml-pro | 1.0.0 | 5 | 5 | 0 | ML: PyTorch, GNNs, training, deploy |
| next-pro | 1.0.0 | 12 | 1 | 1 | Next.js feature + diagnostic work |
| scipy-pro | 4.0.0 | 12 | 4 | 1 | Epistemic engineering (NLP, graph, causal) |
| shipit | 1.0.0 | 0 | 3 | 0 | Commit / ship / deploy-check |
| spec-compliance | 1.0.0 | 0 | 2 | 1 | Deviation-resistant spec authoring |
| spec-guard | 1.0.0 | 0 | 4 | 0 | Spec-locked autonomous implementation loop (hooks) |
| swift-pro | 1.0.0 | 9 | 12 | 0 | Swift / SwiftUI / SwiftData (hooks) |
| theorems-harness | 0.5.9 | 10 | 9 | 26 | Orchestration harness (hooks + MCP) |
| theseus-pro | 1.1.0 | 24 | 7 | 1 | Epistemic engine (7-level intelligence stack) |
| three-pro | 1.0.0 | 2 | 0 | 1 | Three.js / R3F 3D web |
| ui-design-pro | 1.1.0 | 6 | 8 | 2 | Web UI design + implementation |
| ux-pro | 0.1.0 | 7 | 8 | 1 | UX research, IA, a11y, content design |
| vie-design | 2.0.0 | 5 | 0 | 2 | Theseus visual answer-engine design |

**JS-Pro** (`ui-lab/JS-Pro`, v2.0.0) is a complete plugin but is intentionally NOT in `marketplace.json` — it lives in the lab. Do not add it to the marketplace without intent.

## Plugin Anatomy

A typical plugin contains some subset of:

- `agents/` — specialist subagent definitions (Markdown with frontmatter)
- `commands/` — slash commands
- `skills/` — `SKILL.md` knowledge/decision frameworks
- `hooks/` — lifecycle hooks (only `theorems-harness`, `spec-guard`, `swift-pro`)
- `.mcp.json` — plugin-scoped MCP server (only `theorems-harness`)
- `knowledge/` — the epistemic layer: typed claims (JSONL), confidence scores, `tensions.jsonl`, session logs, optional SBERT embeddings
- `references/` / `skills/` — static decision tables and anti-pattern catalogs
- `refs/` — shallow-cloned real library source, populated by the plugin's `install.sh`, **gitignored** (UI-Design-Pro, ML-Pro, D3-Pro, Three-Pro grep source instead of trusting training data)

## Sync

```bash
./sync-plugins.sh              # sync all plugins (symlink + register + enable)
./sync-plugins.sh <name>       # sync one plugin
./sync-plugins.sh --status     # show what is linked
./sync-plugins.sh --uninstall <name>
```

## Repo-Level MCP Servers (`.mcp.json`)

These HTTP MCP servers are wired at the repo root and available to sessions here:
`theseus-mcp`, `r3f-mcp`, `github-mcp`, `modal-mcp`, `deepseek-mcp`, `tpu-commander`, `plugin-server` (the local Django MCP server, `plugins-building-production.up.railway.app`), `railway-mcp`, `unsloth-documentation`, `tavily`. `theorems-harness` additionally ships its own plugin-scoped `theorems-harness` MCP server (Bearer-token auth via `THEOREM_HARNESS_API_TOKEN`).

## Epistemic Layer

The shared epistemic pipeline lives in `scripts/epistemic/` (`run_pipeline.py`, `confidence_updater.py`, `tension_detector.py`, `embedding_manager.py`, `seed_knowledge.py`, `learn.py`, etc.). Knowledge types borrowed from Theseus: **Claims** (confidence-scored assertions), **Tensions** (unresolved conflicts), **Questions** (open threads), **Methods** (process knowledge), **Preferences** (user defaults). Per-plugin state lives in each plugin's `knowledge/` directory; the chat-skill planning surface never reads `knowledge/claims.jsonl`, and the plugin never produces planning docs (the two-surface split described in `README.md`).

`plugin-server/` is the Django app exposing this as an HTTP MCP server (chunkers, embeddings, models). The chat-skill specs (`django-engine-pro-plugin-spec.md`, `ui-design-pro-plugin-spec.md`, `django-engine-pro-epistemic-layer.md`, `plugin-server-spec.md`) bridge the planning surface (Claude.ai skills) and the implementation surface (these plugins).

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

`theorem-context-claude/` is intentionally not a top-level plugin directory anymore. Its canonical source now lives under `theorem-context-sdk/` (the `theorem-context-ts` and `theorem-context-py` SDKs); do not recreate the top-level directory when syncing Context Theorem SDK or Pairformer hook work.

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

- **Hardcoded MCP version pins (layer 4).** A GIT-marketplace plugin loads through four layers that must advance together: the marketplace clone, the version cache (`cache/<mkt>/<plugin>/<ver>/`), the registry pin in `installed_plugins.json`, and **hardcoded MCP args in `~/.claude.json`**. A manually-added global MCP server whose args hardcode an OLD cache version does NOT move on a version bump and `installed_plugins.json` edits never touch it. `resync-codex-plugin.sh` reconciles this; read its header before bumping a plugin that ships an MCP server.

## Manual Plugin Refresh (when `/plugin` is unavailable)

Some Claude Code environments do not expose the `/plugin` slash command. To force-refresh an installed plugin's cache to match the marketplace clone's current state, use `~/.claude/scripts/refresh-plugin.py`. The script materializes the marketplace clone's plugin source into the version-pinned cache and updates `installed_plugins.json`. Backups are timestamped and reversible via the `--rollback` flag.

```bash
~/.claude/scripts/refresh-plugin.py theorems-harness            # default flow
~/.claude/scripts/refresh-plugin.py theorems-harness --dry-run  # preview
~/.claude/scripts/refresh-plugin.py theorems-harness --force    # overwrite stale cache
~/.claude/scripts/refresh-plugin.py --list                        # show all installed plugins + versions
~/.claude/scripts/refresh-plugin.py --rollback                    # restore previous installed_plugins.json
```

The script does NOT touch `enabledPlugins` (intentional, since touching it can trigger the scope-flip bug). Always start a new session after running it. For GIT-marketplace plugins with hardcoded MCP pins, prefer `resync-codex-plugin.sh` (it also reconciles layer 4).

## Epistemic Seeder Notes

- `seed_knowledge.py` over-extracts structural lines as claims. Target spec Part III sample claims, not raw agent markdown lines.
- `GIT_LFS_SKIP_SMUDGE=1` required when cloning DRF into refs/ (large test fixtures).

## Remote

Current `origin`: `Travis-Gilbert/claude-marketplace`. Historical name referenced in `README.md`: `https://github.com/Travis-Gilbert/Plugins-building.git`.
