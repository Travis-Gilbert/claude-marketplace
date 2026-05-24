# Context Theorem SDK

Root-level copy of the Context Theorem SDK clients used by Theseus/Index-API.
The package directory names remain `theorem-context-*` for published-package
compatibility.

## Contents

- `theorem-context-ts/` - TypeScript client package, including `TheoremContextClient`
  for the Index-API harness and `TheoremHotGraphClient` for the standalone THG
  product service.
- `theorem-context-py/` - Python client package with the same surfaces.

This directory now contains SDK clients only. The Claude Code host adapter
(hooks, scripts, skills, slim MCP) was consolidated into the unified
[`theorems-harness/`](../theorems-harness/) plugin alongside the Codex host
adapter, so SDK releases stay decoupled from host integrations and a single
plugin shape serves both runtimes.

## Source

This SDK mirrors:

`/Users/travisgilbert/Tech Dev Local/Creative/Website/Index-API/packages/theorem-context-*`

Keep this copy in sync when the Index-API SDK contract changes.

The Claude Code adapter previously lived at the repository root as
`theorem-context-claude/`, then briefly at this SDK root as `claude-code/`.
Its canonical home is now [`../theorems-harness/`](../theorems-harness/) (the
dual-host plugin with `.claude-plugin/` and `.codex-plugin/` configs at the
root and shared `scripts/`, `hooks/`, `skills/`, `agents/`, and `mcp/` trees).

## Verification

```bash
npm --prefix theorem-context-ts run build
npm --prefix theorem-context-ts test
python3 -m pytest theorem-context-py/tests -q
```

For the host-adapter side (hooks, scripts, skills, slim MCP) verify against
`../theorems-harness/`:

```bash
node --check ../theorems-harness/mcp/server.mjs
python3 -m py_compile ../theorems-harness/scripts/detect_references.py
python3 -m json.tool ../theorems-harness/hooks/hooks.json > /dev/null
python3 -m json.tool ../theorems-harness/hooks/codex-hooks.json > /dev/null
```
