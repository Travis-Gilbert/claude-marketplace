# Context Theorem SDK

Root-level copy of the Context Theorem SDK clients used by Theseus/Index-API.
The package directory names remain `theorem-context-*` for published-package
compatibility.

## Contents

- `theorem-context-ts/` - TypeScript client package, including `TheoremContextClient`
  for the Index-API harness and `TheoremHotGraphClient` for the standalone THG
  product service.
- `theorem-context-py/` - Python client package with the same surfaces.

## Source

This SDK mirrors:

`/Users/travisgilbert/Tech Dev Local/Creative/Website/Index-API/packages/theorem-context-*`

Keep this copy in sync when the Index-API SDK contract changes.

## Verification

```bash
npm --prefix theorem-context-ts run build
npm --prefix theorem-context-ts test
python3 -m pytest theorem-context-py/tests -q
```
