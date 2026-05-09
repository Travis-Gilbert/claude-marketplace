# Install: theorem-context-claude

## Prerequisites

- Claude Code 2.x or later
- `node` 18+ on `$PATH` (the MCP server uses built-in `fetch` and stdio)
- `jq` and `curl` on `$PATH` (the hook scripts use both)
- An `Index-API` instance reachable from your machine; default points at the Railway production deployment

## 1. Install MCP dependencies

```bash
cd packages/theorem-context-claude/mcp
npm install
```

This installs `@modelcontextprotocol/sdk`. The MCP server is a single ESM file with no other dependencies.

## 2. Make hook scripts executable

```bash
chmod +x packages/theorem-context-claude/scripts/*.sh
```

## 3. Configure environment

Add to your shell rc (or `.envrc`, or a project-local `.env`):

```bash
# Required only for non-public deployments:
export THEOREM_CONTEXT_API_KEY="..."

# Optional: override the default API base. Must include /api/v2/theseus.
# export THEOREM_CONTEXT_BASE_URL="https://index-api-production-a5f7.up.railway.app/api/v2/theseus"

# Optional: action-rail enforcement. Default is "record" (logs only).
# export THEOREM_ACTION_RAIL="enforce"

# Optional: enable debug logging to stderr.
# export THEOREM_DEBUG=1
```

## 4. Register the plugin with Claude Code

You have several options.

### Option A: install from a local marketplace (recommended for active development)

If you already have a `local-desktop-app-uploads` or similar local marketplace, drop a symlink:

```bash
ln -s "$PWD/packages/theorem-context-claude" \
      ~/.claude/plugins/marketplaces/local-desktop-app-uploads/theorem-context-claude
```

Then enable in `~/.claude/settings.json`:

```json
"enabledPlugins": {
  "theorem-context-claude@local-desktop-app-uploads": true
}
```

### Option B: publish to your codex-marketplace

The repo already includes a `codex-marketplace` reference at
`https://github.com/Travis-Gilbert/claude-marketplace`. Add this plugin to that
marketplace's manifest, push, and enable in settings:

```json
"enabledPlugins": {
  "theorem-context-claude@codex-marketplace": true
}
```

### Option C: install via slash command

Once registered in any marketplace Claude Code knows about:

```
/plugin install theorem-context-claude
```

## 5. Fix the stale Theseus MCP URL in your global settings

Your current `~/.claude/settings.json` points the `theseus` MCP at
`https://theseus.travisgilbert.me/mcp`, which currently returns 404. The
production URL is `https://theseus-mcp-production.up.railway.app/mcp`. The
plugin's `plugin.json` registers the production URL under its own bundle, but
your global registration may still be wrong; either update it or remove it
(the plugin will provide the same MCP under its own scope).

To update:

```diff
 "mcpServers": {
   "theseus": {
     "type": "http",
-    "url": "https://theseus.travisgilbert.me/mcp",
+    "url": "https://theseus-mcp-production.up.railway.app/mcp",
     "description": "Theseus knowledge graph (coding-theorem)"
   }
 }
```

## 6. Add `.theorem/` to your project's gitignore

Each project where you use this plugin will accumulate run state under `.theorem/`. Add to `.gitignore`:

```
.theorem/
```

A starter `.gitignore` is shipped at `packages/theorem-context-claude/.gitignore.sample`.

## 7. Verify

In a fresh Claude Code session:

1. Look at your stderr / debug log for `[theorem]` lines after the SessionStart hook fires.
2. Send any prompt with more than ~12 chars of substance.
3. Inspect `.theorem/current-context.md` after the prompt; it should contain the freshly compiled Context Artifact.
4. Run `/show-context` (the skill) to confirm the artifact is what the model received.

## Uninstall

Set the plugin to `false` in `enabledPlugins`, restart Claude Code, and optionally:

```bash
rm -rf .theorem/
```

The `~/.claude/plugins/cache/...` entry will clean itself up on next plugin sync.
