# PATTERNS-two-mode-deployment.md

How to maintain the three deployment modes: Railway (CPU), Local (GPU), and Modal (batch GPU).

## The Three Modes

| Mode | Hardware | Available | Use Case |
|------|----------|-----------|----------|
| Railway (PRODUCTION) | CPU, 512MB RAM | spaCy, BM25, TF-IDF, scikit-learn | Always-on API |
| Local (DEV) | GPU optional | All passes: SBERT, NLI, KGE, FAISS | Development, full pipeline |
| Modal (BATCH) | Serverless GPU | PyTorch, training, re-encoding | Scheduled heavy compute |

## Build Sequence

### Step 1: Import Guards

Every module that touches PyTorch, FAISS, or heavy ML must use try/except:

```python
try:
    import torch
    from sentence_transformers import SentenceTransformer
    HAS_PYTORCH = True
except ImportError:
    HAS_PYTORCH = False
    torch = None
```

Never use `HAS_PYTORCH` at module level to conditionally define classes.
Always check at call time:

```python
def my_function():
    if not HAS_PYTORCH:
        logger.info('PyTorch unavailable, skipping')
        return None
    # ... PyTorch code ...
```

### Step 2: Environment Detection

```python
import os

DEPLOY_MODE = os.environ.get('DEPLOY_MODE', 'local')  # 'railway', 'local', 'modal'
IS_RAILWAY = DEPLOY_MODE == 'railway' or os.environ.get('RAILWAY_ENVIRONMENT', '')
IS_MODAL = DEPLOY_MODE == 'modal'
IS_LOCAL = not IS_RAILWAY and not IS_MODAL
```

Use `IS_RAILWAY` to gate features, never check for absence of PyTorch as a proxy
for production (Railway may install PyTorch in the future).

### Step 3: Graceful Degradation

The API contract is identical across all modes. Endpoints never fail because
a pass is unavailable. They return fewer results.

```python
def run_engine(obj, notebook=None, process_record=None):
    results = {'engines_active': []}

    # Always runs
    if 'spacy' in active_engines:
        results['entities_extracted'] = len(extract_entities(obj, config))

    # Production-safe
    if 'bm25' in active_engines:
        results['edges_from_bm25'] = len(_run_bm25_engine(obj, config))

    # Dev/local only -- degrades silently
    if 'sbert' in active_engines and _SBERT_AVAILABLE:
        results['edges_from_semantic'] = len(_run_semantic_engine(obj, config))
```

### Step 4: Requirements Splitting

```
requirements/
  base.txt        # Django, DRF, spaCy, scikit-learn, redis
  local.txt       # -r base.txt + torch, faiss-cpu, sentence-transformers
  railway.txt     # -r base.txt (no PyTorch)
  modal.txt       # torch, transformers, peft (no Django)
```

Railway installs `requirements/railway.txt`. Local dev installs `requirements/local.txt`.
Modal functions define their own Image with `requirements/modal.txt`.

### Step 5: Memory Budgets

| Mode | RAM Limit | Model Budget |
|------|-----------|-------------|
| Railway | 512MB (1GB max) | spaCy en_core_web_md (~50MB), BM25 index, TF-IDF matrix |
| Local | 8-16GB | + SBERT (~400MB), FAISS index, NLI CrossEncoder (~500MB) |
| Modal | 16-80GB GPU | Full training: batched SBERT, KGE, GNN, LM fine-tuning |

On Railway, never load a model larger than 100MB. Monitor with:
```python
import psutil
mem = psutil.Process().memory_info().rss / 1024 / 1024
if mem > 400:
    logger.warning('Memory usage %.0fMB approaching Railway limit', mem)
```

### Step 6: Two-Mode Testing

Every PR must pass in both modes:

```bash
# Test Railway mode (no PyTorch)
DEPLOY_MODE=railway python manage.py test apps.notebook

# Test Local mode (with PyTorch)
DEPLOY_MODE=local python manage.py test apps.notebook
```

### Step 7: Modal Dispatch

Heavy compute runs on Modal, triggered from RQ tasks:

```python
# In tasks.py
@django_rq.job('default', timeout=60)
def dispatch_to_modal(task_name, payload):
    import httpx
    resp = httpx.post(
        f'{MODAL_ENDPOINT}/{task_name}',
        json=payload,
        timeout=30,
    )
    # Ingest results when get_started.py calls back
```

See PATTERNS-modal-gpu.md for the full Modal dispatch pattern.

## Critical Constraints

- Never let an ImportError escape to the caller -- always catch and degrade
- The API response shape is identical across all modes (fewer results, not different shape)
- Railway must boot and serve requests without PyTorch installed
- Never check `HAS_PYTORCH` as a proxy for environment -- use `IS_RAILWAY` for gating
- Memory budget on Railway is 512MB; never load SBERT or FAISS in production
- compose_engine must work on Railway (it uses only production-safe passes)
- Every new dependency must be placed in the correct requirements file
- Two-mode tests must pass before merging any engine change
