# Codex Plugins

Multi-plugin repository. Each subdirectory is a standalone Claude Code plugin.

## Plugin Install Model

Local plugins register under `~/.claude/plugins/marketplaces/local-desktop-app-uploads/<name>/`.
The canonical path is in `~/.claude/plugins/installed_plugins.json` — only that path is loaded.
`~/.claude/plugins/<name>/` (without marketplace namespace) is NOT read by Claude Code.

## Active Plugins

| Plugin | Version | Path |
|--------|---------|------|
| ui-design-pro | 1.1.0 | `ui-design-pro/` |
| scipy-pro | 4.0.0 | `scipy-pro/` |
| django-design | 4.0.0 | `django-design/` |

## Remote

GitHub has renamed this repo to `Plugins-building.git`. Update local remote:
`git remote set-url origin https://github.com/Travis-Gilbert/Plugins-building.git`
