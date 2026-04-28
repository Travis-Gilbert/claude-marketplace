# PATTERNS-temporal-memory.md

How to integrate temporal graph memory using Temporal Graph Networks (TGN) to replace hand-tuned decay.

## Build Sequence

### Step 1: Export Event Stream from Django

The knowledge graph generates a stream of timestamped events. Export them
for TGN training:

```python
def export_event_stream(notebook_id: int) -> list[dict]:
    """Export graph events as a temporal edge stream for TGN training."""
    from .models import Edge, Node

    events = []

    # Edge creation events
    edges = Edge.objects.filter(
        from_object__notebook_id=notebook_id,
        from_object__is_deleted=False,
    ).order_by('created_at')

    for edge in edges:
        events.append({
            'src': edge.from_object_id,
            'dst': edge.to_object_id,
            'timestamp': edge.created_at.timestamp(),
            'edge_type': edge.edge_type,
            'strength': float(edge.strength or 0.5),
            'event_type': 'edge_created',
        })

    # Timeline node events (captures, modifications, promotions)
    nodes = Node.objects.filter(
        object_ref__notebook_id=notebook_id,
    ).order_by('occurred_at')

    for node in nodes:
        events.append({
            'src': node.object_ref_id,
            'dst': node.object_ref_id,  # Self-loop for node events
            'timestamp': node.occurred_at.timestamp(),
            'edge_type': node.node_type,
            'strength': 1.0,
            'event_type': node.node_type,
        })

    # Sort by timestamp
    events.sort(key=lambda e: e['timestamp'])
    return events
```

### Step 2: TGN Training on Modal

```python
# modal_functions/train_tgn.py
import modal

app = modal.App("theseus-tgn")

image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "torch>=2.0", "torch-geometric>=2.4", "tgn @ git+https://github.com/twitter-research/tgn",
)

@app.function(image=image, gpu="T4", timeout=3600)
def train_tgn(events: list[dict], config: dict) -> dict:
    """Train a Temporal Graph Network on the event stream."""
    import torch
    import numpy as np

    # Convert events to TGN format
    sources = np.array([e['src'] for e in events])
    destinations = np.array([e['dst'] for e in events])
    timestamps = np.array([e['timestamp'] for e in events])
    edge_features = np.array([[e['strength']] for e in events])

    # Node ID remapping (contiguous integers)
    unique_nodes = np.unique(np.concatenate([sources, destinations]))
    node_map = {old: new for new, old in enumerate(unique_nodes)}

    # Train TGN
    # ... model setup with config parameters ...
    # ... training loop with temporal batching ...

    # Extract temporal embeddings for all nodes at current time
    embeddings = {}
    for node_id in unique_nodes:
        emb = model.compute_embedding(node_map[node_id], timestamps[-1])
        embeddings[int(node_id)] = emb.detach().cpu().numpy().tolist()

    return {
        'embeddings': embeddings,
        'node_map': {int(k): int(v) for k, v in node_map.items()},
        'training_loss': float(final_loss),
        'num_events': len(events),
    }
```

### Step 3: Temporal Embedding Extraction

After training, extract embeddings that encode each object's temporal context:

```python
def ingest_temporal_embeddings(result: dict, notebook_id: int):
    """Store TGN embeddings for use by the engine."""
    import numpy as np
    from .vector_store import update_temporal_index

    embeddings = result['embeddings']
    object_ids = list(embeddings.keys())
    vectors = np.array([embeddings[str(oid)] for oid in object_ids], dtype=np.float32)

    # Store in FAISS index alongside SBERT embeddings
    update_temporal_index(object_ids, vectors, notebook_id)
    logger.info(
        'Ingested %d temporal embeddings for notebook %d',
        len(object_ids), notebook_id,
    )
```

### Step 4: Replace Hand-Tuned Decay

The current edge decay in self_organize.py uses a fixed half-life:

```python
# OLD: hand-tuned exponential decay
DECAY_HALF_LIFE_DAYS = 60
decay = math.exp(-0.693 * age_days / DECAY_HALF_LIFE_DAYS)
```

Replace with learned temporal relevance from TGN embeddings:

```python
# NEW: TGN-informed decay
def temporal_relevance(obj_id: int, notebook_id: int) -> float:
    """
    Compute temporal relevance using TGN embedding.
    Falls back to hand-tuned decay if no TGN embeddings available.
    """
    from .vector_store import get_temporal_embedding

    emb = get_temporal_embedding(obj_id, notebook_id)
    if emb is None:
        # Graceful fallback to hand-tuned decay
        return _hand_tuned_decay(obj_id)

    # TGN embedding norm correlates with temporal activity
    # Higher norm = more recently/frequently active = more relevant
    relevance = float(np.linalg.norm(emb))
    return min(1.0, relevance)  # Clip to [0, 1]
```

### Step 5: Integration with Engine Passes

Temporal embeddings become an additional feature for the learned scorer:

```python
def build_feature_vector(obj_a, obj_b):
    features = {
        # ... existing features ...
        'temporal_cosine': cosine_similarity(
            get_temporal_embedding(obj_a.pk),
            get_temporal_embedding(obj_b.pk),
        ),
        'temporal_relevance_a': temporal_relevance(obj_a.pk),
        'temporal_relevance_b': temporal_relevance(obj_b.pk),
    }
    return features
```

### Step 6: Dispatch and Scheduling

```python
# In tasks.py
@django_rq.job('default', timeout=60)
def dispatch_tgn_training(notebook_id: int):
    events = export_event_stream(notebook_id)
    if len(events) < 100:
        logger.info('Too few events (%d) for TGN training', len(events))
        return

    resp = httpx.post(
        f'{MODAL_ENDPOINT}/train_tgn',
        json={'events': events, 'config': {'embedding_dim': 64, 'epochs': 50}},
        timeout=30,
    )
    call_id = resp.json().get('call_id')
    poll_modal_result.delay(call_id, 'tgn', notebook_id)
```

Schedule weekly, after KGE training completes (they share the graph structure).

## Critical Constraints

- TGN training runs on Modal GPU, never on Railway or in the request thread
- Minimum 100 events before training (otherwise embeddings are meaningless)
- Temporal embeddings are stored in a separate FAISS index from SBERT embeddings
- Hand-tuned decay remains as fallback when TGN embeddings are unavailable (invariant 11)
- Event stream export must include all event types (edges, captures, modifications, promotions)
- Node IDs must be remapped to contiguous integers for TGN (restore original IDs on ingestion)
- Temporal embeddings update weekly; stale embeddings (>14 days) trigger re-training
- IQ Tracker Learning axis measures decay quality improvement after TGN integration
