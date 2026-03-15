# Pattern: Two-Mode Deployment

The most critical architectural constraint in research_api. Every NLP feature
must work in two modes with graceful degradation.

## Deployment Modes

| Mode | Runtime | Available | Memory | GPU |
|------|---------|-----------|--------|-----|
| PRODUCTION (Railway) | gunicorn, 2 workers | spaCy, BM25, TF-IDF, sklearn | ~512MB/worker | No |
| LOCAL/DEV | manage.py runserver | All 7 passes: PyTorch, FAISS, SBERT, NLI, KGE | ~4GB | Optional |
| MODAL (GPU) | Serverless function | Full stack + GPU ops | 16-40GB | Yes |

## The Import Guard Pattern

Every module that touches PyTorch or heavy ML must use this exact pattern:

```python
try:
    from apps.research.advanced_nlp import sentence_similarity
    _FEATURE_AVAILABLE = True
except ImportError:
    _FEATURE_AVAILABLE = False
```

Then gate all usage:

```python
def my_function(obj, config):
    if not _FEATURE_AVAILABLE:
        logger.debug("Feature X unavailable, skipping")
        return []  # or degraded result
    # ... feature code ...
```

## Rules

1. **Never add PyTorch-only code to the production path.** If spaCy can't
   run it, it must be behind an import guard.

2. **Always degrade gracefully.** A missing feature returns an empty list,
   a degraded status, or a fallback result. It never raises an ImportError
   or crashes the worker.

3. **Test both modes.** Every PR that adds NLP functionality must verify:
   - Production mode: feature is skipped cleanly, no import errors
   - Dev mode: feature runs and produces correct results

4. **Memory budget awareness.** Railway runs 2 gunicorn workers sharing
   ~1GB total. Each worker gets ~512MB. Loading a 400MB model kills the
   deploy. Check model sizes before adding dependencies.

5. **No conditional installs in requirements.txt.** Use a single
   `requirements.txt` for production (lightweight) and
   `requirements-dev.txt` for local (adds PyTorch, FAISS, etc.).

## What Goes Where

| Component | Production | Dev | Modal |
|-----------|-----------|-----|-------|
| spaCy (en_core_web_sm) | Yes | Yes | Yes |
| BM25 (rank_bm25) | Yes | Yes | Yes |
| TF-IDF (sklearn) | Yes | Yes | Yes |
| SBERT (sentence-transformers) | No | Yes | Yes |
| CrossEncoder NLI | No | Yes | Yes |
| FAISS | No | Yes | Yes |
| KGE (pykeen) | No | Yes | Yes |
| SAM-2 (segment-anything-2) | No | No | Yes |

## Adding a New Feature Checklist

1. Write the feature in its own module (or in `advanced_nlp.py` if small)
2. Add the import guard at the top of every consumer module
3. Add the dependency to `requirements-dev.txt` only
4. Add a degradation path (empty result, fallback, or skip)
5. In engine.py: gate with `if not _FEATURE_AVAILABLE: return []`
6. In compose_engine.py: emit `status='degraded'` with reason
7. Test: `PRODUCTION=1 python manage.py test` (no PyTorch imports)
8. Test: normal `python manage.py test` (full feature)

## Anti-Patterns

```python
# BAD: Unconditional import at module level
from sentence_transformers import SentenceTransformer  # Crashes production

# BAD: Silent failure without logging
if not _FEATURE_AVAILABLE:
    pass  # No one knows this was skipped

# BAD: Partial degradation that produces wrong results
if not _FEATURE_AVAILABLE:
    return [Edge(strength=0.5)]  # Fabricating edges without evidence

# GOOD: Clean guard with logging and empty result
if not _FEATURE_AVAILABLE:
    logger.debug("SBERT unavailable, skipping semantic pass")
    return []
```

## Environment Detection

```python
import os

def is_production():
    return os.getenv('RAILWAY_ENVIRONMENT') is not None

def is_modal():
    return os.getenv('MODAL_ENVIRONMENT') is not None
```

Production detection is used for safety checks, not for feature gating.
Feature gating uses import guards (try/except), not environment variables.
This way, if someone installs PyTorch on Railway (don't), the feature
still works -- and if someone doesn't have PyTorch locally, it still
degrades cleanly.
