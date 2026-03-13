# PATTERNS-self-org-loop

## Goal
Add feedback loops that improve structure without unsafe auto-mutations.

## Loop Shape
1. Detect candidate structural pattern.
2. Propose mutation and compute confidence.
3. Enforce thresholds and policy gates.
4. Apply mutation only when thresholds pass.
5. Persist timeline/provenance event.
6. Expose non-mutating preview endpoint.

## Verify
- Validate no-op behavior below threshold.
- Validate idempotency across repeated runs.
- Validate preview output matches mutation logic.
