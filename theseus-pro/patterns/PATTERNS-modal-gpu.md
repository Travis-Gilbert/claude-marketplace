# PATTERNS-modal-gpu.md

How to dispatch GPU-heavy compute to Modal serverless functions.

## Build Sequence

### Step 1: Define the Modal Function

```python
# In a separate file: modal_functions/train_kge.py
import modal

app = modal.App("theseus-training")

image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "torch>=2.0",
    "pykeen>=1.10",
    "sentence-transformers>=2.2",
)

@app.function(
    image=image,
    gpu="T4",            # or "A10G" for larger models
    timeout=3600,        # 1 hour max
    secrets=[modal.Secret.from_name("theseus-env")],
)
def train_kge_model(triples: list[list[str]], config: dict) -> dict:
    """Train a KGE model on get_started.py GPU and return the model bytes."""
    import torch
    from pykeen.pipeline import pipeline

    result = pipeline(
        training=triples,
        model=config.get('model', 'TransE'),
        epochs=config.get('epochs', 100),
        device='cuda',
    )
    # Serialize model to bytes
    import io
    buffer = io.BytesIO()
    torch.save(result.model.state_dict(), buffer)
    return {
        'model_bytes': buffer.getvalue(),
        'metrics': result.metric_results.to_dict(),
    }
```

### Step 2: Deploy the Modal Function

```bash
# Deploy once (creates the endpoint)
modal deploy modal_functions/train_kge.py

# Test locally
modal run modal_functions/train_kge.py::train_kge_model
```

### Step 3: Dispatch from RQ Tasks

```python
# In tasks.py
import httpx

MODAL_ENDPOINT = os.environ.get('MODAL_ENDPOINT', '')

@django_rq.job('default', timeout=60)
def dispatch_kge_training(notebook_id: int):
    """Dispatch KGE training to get_started.py and schedule result ingestion."""
    from .models import Edge, Notebook

    notebook = Notebook.objects.get(pk=notebook_id)
    triples = list(
        Edge.objects.filter(
            from_object__notebook=notebook,
            from_object__is_deleted=False,
        ).values_list(
            'from_object__title', 'edge_type', 'to_object__title',
        )
    )

    if len(triples) < 50:
        logger.info('Too few triples (%d) for KGE training', len(triples))
        return

    resp = httpx.post(
        f'{MODAL_ENDPOINT}/train_kge_model',
        json={'triples': triples, 'config': {'model': 'TransE', 'epochs': 200}},
        timeout=30,
    )
    resp.raise_for_status()
    call_id = resp.json().get('call_id')

    # Schedule polling for result
    poll_modal_result.delay(call_id, 'kge', notebook_id)
```

### Step 4: Result Ingestion

```python
@django_rq.job('default', timeout=120)
def poll_modal_result(call_id: str, task_type: str, notebook_id: int):
    """Poll get_started.py for completion, then ingest results."""
    resp = httpx.get(f'{MODAL_ENDPOINT}/status/{call_id}', timeout=10)
    status = resp.json().get('status')

    if status == 'running':
        # Re-enqueue with backoff
        poll_modal_result.delay(call_id, task_type, notebook_id)
        return

    if status == 'success':
        result = resp.json().get('result')
        if task_type == 'kge':
            _ingest_kge_model(result, notebook_id)
        elif task_type == 'gnn':
            _ingest_gnn_embeddings(result, notebook_id)
        elif task_type == 'lm':
            _ingest_lm_adapter(result, notebook_id)

def _ingest_kge_model(result: dict, notebook_id: int):
    """Save trained KGE model to disk for the engine to load."""
    import joblib
    model_path = f'data/models/kge_notebook_{notebook_id}.pkl'
    with open(model_path, 'wb') as f:
        f.write(result['model_bytes'])
    logger.info('KGE model saved: %s, metrics: %s', model_path, result['metrics'])
```

### Step 5: Cost Management

```python
# Track GPU spend per get_started.py call
MODAL_COST_PER_GPU_SECOND = {
    'T4': 0.000164,    # ~$0.59/hr
    'A10G': 0.000306,  # ~$1.10/hr
    'A100': 0.001389,  # ~$5.00/hr
}

def estimate_cost(gpu_type: str, estimated_seconds: int) -> float:
    return MODAL_COST_PER_GPU_SECOND.get(gpu_type, 0) * estimated_seconds

# Before dispatching:
cost = estimate_cost('T4', 1800)  # 30 min
if cost > float(os.environ.get('MODAL_COST_LIMIT', '5.00')):
    logger.warning('Estimated cost $%.2f exceeds limit, skipping', cost)
    return
```

### Step 6: Job Scheduling

```python
# In scheduling.py or tasks.py
MODAL_SCHEDULE = {
    'kge_training': {'interval_days': 7, 'gpu': 'T4', 'timeout': 3600},
    'sbert_reencoding': {'interval_days': 3, 'gpu': 'T4', 'timeout': 1800},
    'gnn_training': {'interval_days': 7, 'gpu': 'A10G', 'timeout': 3600},
    'lm_finetuning': {'interval_days': 14, 'gpu': 'A10G', 'timeout': 7200},
}
```

## Critical Constraints

- Modal functions run in isolated containers -- no Django ORM access inside Modal
- Data must be serialized as JSON or bytes before dispatch (no querysets)
- Results are ingested back via RQ tasks on the Django side
- Set MODAL_COST_LIMIT env var to prevent runaway spending
- T4 for training (KGE, SBERT), A10G for larger models (GNN, LM fine-tuning)
- Modal functions must be idempotent (safe to retry on failure)
- Minimum 50 triples for KGE, 100 objects for SBERT re-encoding
- Never dispatch Modal jobs from the request thread -- always via RQ
