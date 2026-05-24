# Context Theorem SDK

Root-level copy of the Context Theorem SDK clients used by Theseus/Index-API.
The package directory names remain `theorem-context-*` for published-package
compatibility.

## Contents

- `theorem-context-ts/` - TypeScript client package, including `TheoremContextClient`
  for the Index-API harness and `TheoremHotGraphClient` for the standalone THG
  product service.
- `theorem-context-py/` - Python client package with the same surfaces.
- `claude-code/` - Claude Code host adapter: hook manifest, slim MCP fallback,
  skills, and shell scripts for out-of-band context compilation, action
  recording, Pairformer frontier injection, and session graph provenance.

## Source

This SDK mirrors:

`/Users/travisgilbert/Tech Dev Local/Creative/Website/Index-API/packages/theorem-context-*`

Keep this copy in sync when the Index-API SDK contract changes.

The Claude Code adapter previously lived at the repository root as
`theorem-context-claude/`. Its canonical home is now this SDK root under
`claude-code/`, so SDK releases and host adapters travel together.

## Verification

```bash
npm --prefix theorem-context-ts run build
npm --prefix theorem-context-ts test
python3 -m pytest theorem-context-py/tests -q
node --check claude-code/mcp/server.mjs
python3 -m py_compile claude-code/scripts/detect_references.py
```
