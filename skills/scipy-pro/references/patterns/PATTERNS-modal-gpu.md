# PATTERNS-modal-gpu

## Goal
Offload heavy compute while keeping core API runtime lightweight.

## Use Cases
- Corpus-wide embedding re-encoding
- KGE model training
- Large-batch NLI scoring
- Heavy media analysis

## Pattern
1. Enqueue job from API/task layer with immutable payload.
2. Dispatch to Modal worker via authenticated client.
3. Persist job status and artifacts in app database/storage.
4. Reconcile results into local indexes/models asynchronously.

## Verify
- Validate retry and timeout behavior.
- Validate idempotent result ingestion.
- Validate local fallback path when Modal unavailable.
