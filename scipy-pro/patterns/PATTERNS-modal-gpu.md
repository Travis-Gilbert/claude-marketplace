# Pattern: Modal GPU Dispatch

Modal provides serverless GPU compute for batch jobs that exceed local
resources: re-encoding embeddings, KGE training, SAM-2 image analysis,
and corpus-wide NLI scoring.

## Architecture

```
Railway (Production)          Modal (GPU)
┌──────────────────┐         ┌──────────────────┐
│  RQ Task         │         │  Modal Function   │
│  ┌────────────┐  │  httpx  │  ┌────────────┐  │
│  │ dispatch() │──┼────────>│  │ gpu_task()  │  │
│  └────────────┘  │  POST   │  └────────────┘  │
│                  │         │        │         │
│  ┌────────────┐  │  poll/  │        ▼         │
│  │ poll or    │<─┼─webhook─│  GPU execution   │
│  │ webhook()  │  │         │        │         │
│  └────────────┘  │         │        ▼         │
│        │         │         │  Return result   │
│        ▼         │         └──────────────────┘
│  Process result  │
│  Update DB       │
└──────────────────┘
```

## Dispatch Pattern

RQ tasks dispatch to Modal via httpx. Never call Modal directly from
a Django view (it blocks the gunicorn worker).

```python
import httpx
from django.conf import settings

MODAL_BASE_URL = settings.MODAL_ENDPOINT  # e.g., 'https://your-app--func.modal.run'
MODAL_TOKEN = settings.MODAL_TOKEN

def dispatch_to_modal(task_name, payload, timeout=600):
    """
    Dispatch a GPU task to Modal from an RQ worker.

    Args:
        task_name: Modal function name (e.g., 'encode_batch', 'train_kge')
        payload: JSON-serializable dict with task parameters
        timeout: Max wait time in seconds (default 10 min)

    Returns:
        dict: Modal function result

    Raises:
        ModalDispatchError: If Modal returns non-200 or times out
    """
    url = f"{MODAL_BASE_URL}/{task_name}"

    with httpx.Client(timeout=timeout) as client:
        response = client.post(
            url,
            json=payload,
            headers={'Authorization': f'Bearer {MODAL_TOKEN}'},
        )

    if response.status_code != 200:
        raise ModalDispatchError(
            f"Modal {task_name} failed: {response.status_code} {response.text}"
        )

    return response.json()
```

## Modal Function Template

On the Modal side, define GPU functions with explicit resource specs:

```python
import modal

app = modal.App("research-api-gpu")

# Shared image with dependencies
gpu_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "sentence-transformers>=2.2.0",
        "torch>=2.0",
        "faiss-gpu>=1.7",
        "pykeen>=1.10",
        "numpy>=1.24",
    )
)

@app.function(
    image=gpu_image,
    gpu="T4",            # or "A10G" for larger jobs
    timeout=1800,        # 30 min max
    memory=16384,        # 16GB RAM
    secrets=[modal.Secret.from_name("research-api-secrets")],
)
def encode_batch(payload: dict) -> dict:
    """Re-encode a batch of texts with SBERT on GPU."""
    from sentence_transformers import SentenceTransformer
    import numpy as np

    model = SentenceTransformer(payload['model_name'])
    texts = payload['texts']
    pks = payload['pks']

    embeddings = model.encode(texts, batch_size=128, show_progress_bar=False)

    return {
        'embeddings': embeddings.tolist(),
        'pks': pks,
        'model_name': payload['model_name'],
        'count': len(texts),
    }
```

## GPU Task Types

### 1. Batch Re-Encoding

When the SBERT model changes or new Objects are added in bulk.

```python
@rq_job('gpu')
def task_reencode_embeddings(notebook_id=None, model_name='all-MiniLM-L6-v2'):
    """Re-encode all Object embeddings via Modal GPU."""
    queryset = Object.objects.filter(is_deleted=False)
    if notebook_id:
        queryset = queryset.filter(notebook_id=notebook_id)

    texts = list(queryset.values_list('body', flat=True))
    pks = list(queryset.values_list('pk', flat=True))

    # Batch into chunks of 1000 (Modal memory limits)
    CHUNK_SIZE = 1000
    all_embeddings = []

    for i in range(0, len(texts), CHUNK_SIZE):
        chunk_texts = texts[i:i + CHUNK_SIZE]
        chunk_pks = pks[i:i + CHUNK_SIZE]

        result = dispatch_to_modal('encode_batch', {
            'texts': chunk_texts,
            'pks': chunk_pks,
            'model_name': model_name,
        })
        all_embeddings.extend(zip(result['pks'], result['embeddings']))

    # Rebuild local FAISS index from returned embeddings
    _rebuild_faiss_from_embeddings(all_embeddings, notebook_id)
```

### 2. KGE Training

Knowledge Graph Embedding model training with PyKEEN.

```python
@rq_job('gpu')
def task_train_kge(notebook_id):
    """Train KGE model on notebook's graph via Modal GPU."""
    edges = Edge.objects.filter(
        from_object__notebook_id=notebook_id,
        from_object__is_deleted=False,
    ).values_list('from_object_id', 'edge_type', 'to_object_id')

    triples = [
        [str(h), r, str(t)]
        for h, r, t in edges
    ]

    result = dispatch_to_modal('train_kge', {
        'triples': triples,
        'model': 'TransE',
        'epochs': 100,
        'embedding_dim': 128,
    })

    # Store trained embeddings
    _store_kge_embeddings(result['entity_embeddings'], notebook_id)
```

### 3. SAM-2 Image Analysis

Segment Anything 2 for image Objects.

```python
@rq_job('gpu')
def task_analyze_images(object_ids):
    """Run SAM-2 analysis on image Objects via Modal GPU."""
    objects = Object.objects.filter(pk__in=object_ids, type='image')

    for obj in objects:
        image_url = obj.metadata.get('image_url')
        if not image_url:
            continue

        result = dispatch_to_modal('sam2_analyze', {
            'image_url': image_url,
            'task': 'segment_and_describe',
        })

        obj.metadata['segments'] = result['segments']
        obj.metadata['visual_description'] = result['description']
        obj.save()
```

### 4. Corpus-Wide NLI

Pairwise NLI scoring across large claim sets.

```python
@rq_job('gpu')
def task_corpus_nli(claim_pairs):
    """Score NLI for large claim pair sets via Modal GPU."""
    # Batch into chunks (CrossEncoder memory limits)
    CHUNK_SIZE = 5000
    all_scores = []

    for i in range(0, len(claim_pairs), CHUNK_SIZE):
        chunk = claim_pairs[i:i + CHUNK_SIZE]
        result = dispatch_to_modal('batch_nli', {
            'pairs': [[p['text_a'], p['text_b']] for p in chunk],
        })
        all_scores.extend(result['scores'])

    return all_scores
```

## Error Handling and Fallback

```python
class ModalDispatchError(Exception):
    pass

def dispatch_to_modal_safe(task_name, payload, timeout=600, fallback=None):
    """
    Dispatch with fallback on failure.

    Args:
        fallback: Callable that produces a degraded result locally.
                  If None, the error propagates.
    """
    try:
        return dispatch_to_modal(task_name, payload, timeout)
    except (httpx.TimeoutException, ModalDispatchError) as exc:
        logger.warning("Modal dispatch failed for %s: %s", task_name, exc)
        if fallback:
            logger.info("Using local fallback for %s", task_name)
            return fallback(payload)
        raise
```

## Memory and Timeout Guidelines

| Task | GPU | Memory | Timeout | Chunk Size |
|------|-----|--------|---------|------------|
| SBERT encoding | T4 | 8GB | 10 min | 1000 texts |
| KGE training | T4 | 8GB | 30 min | Full graph |
| SAM-2 analysis | A10G | 16GB | 5 min/image | 1 image |
| NLI scoring | T4 | 8GB | 15 min | 5000 pairs |
| SBERT fine-tuning | A10G | 16GB | 60 min | Full dataset |

## Key Rules

1. **Never call Modal from a Django view.** Always dispatch from RQ tasks.
   Modal calls can take minutes; gunicorn workers must stay free.

2. **Chunk large payloads.** Modal functions have memory limits. Split
   into chunks and aggregate results locally.

3. **Idempotent tasks.** Modal functions may be retried. Design them
   to produce the same result if called twice with the same input.

4. **Store results in DB, not Modal.** Modal is ephemeral. Results must
   be written back to Django models or local index files.

5. **Timeout awareness.** Set httpx timeout >= Modal function timeout.
   A 30-minute Modal function needs a 30-minute+ httpx timeout.

6. **Secrets management.** Modal secrets are configured via
   `modal secret create`. Never hardcode API keys in Modal functions.

7. **Cost awareness.** GPU time costs money. Log dispatch events and
   monitor usage. Don't dispatch trivially small jobs to Modal.
