# PATTERNS-two-mode-deployment

## Goal
Keep production stable without PyTorch while preserving richer local/dev capability.

## Pattern
1. Gate advanced imports with availability flags.
2. Provide deterministic fallback behavior.
3. Emit pass status as `complete`, `degraded`, or `skipped`.
4. Keep quality and latency impact visible to callers.
5. Route heavy batch work to workers or Modal.

## Canonical Snippet
```python
try:
    from apps.research.advanced_nlp import sentence_similarity
    FEATURE_AVAILABLE = True
except Exception:
    FEATURE_AVAILABLE = False
```

## Verify
- Validate production path with advanced deps absent.
- Validate local path with advanced deps present.
- Validate consistent payload schema in both modes.
