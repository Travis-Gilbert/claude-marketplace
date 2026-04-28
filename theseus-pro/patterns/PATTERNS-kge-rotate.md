# PATTERNS-kge-rotate.md

How to train RotatE knowledge graph embeddings, integrate them at runtime,
wire them into the learned scorer, and generate structural tokens for
GL-Fusion.

## Problem

The engine discovers connections via text similarity (SBERT, BM25) and
entity overlap (NER). It has no signal for structural plausibility:
"given the existing graph topology, should this edge exist?" KGE fills
this gap by learning embeddings where geometric operations predict
missing links.

## When to Use

- Adding structural prediction to the engine (Pass 7+)
- Training knowledge graph embeddings for link prediction
- Generating structural token context for GL-Fusion Stream C
- Adding KGE features to the learned scorer
- Cold-starting embeddings for newly captured Objects

## The Pattern

### Phase K1: Triple Export

Export the knowledge graph as (head, relation, tail) triples.

```python
# kge_export.py
def export_triples(notebook_id=None):
    """
    Export edges as triples for KGE training.

    Output format: entity_to_id dict + relation_to_id dict + triples array
    """
    edges = Edge.objects.filter(is_deleted=False)
    if notebook_id:
        edges = edges.filter(from_object__notebook_id=notebook_id)

    entity_to_id = {}
    relation_to_id = {}
    triples = []

    # Filter: only relations with >= 10 instances (sparse relations hurt training)
    from collections import Counter
    rel_counts = Counter(edges.values_list('edge_type', flat=True))
    valid_rels = {r for r, c in rel_counts.items() if c >= 10}

    for edge in edges.select_related('from_object', 'to_object'):
        if edge.edge_type not in valid_rels:
            continue

        h = edge.from_object.sha_hash
        t = edge.to_object.sha_hash
        r = edge.edge_type

        if h not in entity_to_id:
            entity_to_id[h] = len(entity_to_id)
        if t not in entity_to_id:
            entity_to_id[t] = len(entity_to_id)
        if r not in relation_to_id:
            relation_to_id[r] = len(relation_to_id)

        triples.append([entity_to_id[h], relation_to_id[r], entity_to_id[t]])

    # Inverse materialization: add reverse triples for symmetric relations
    SYMMETRIC = {'similarity', 'shared_entity', 'structural'}
    inverse_triples = []
    for h, r, t in triples:
        rel_name = [k for k, v in relation_to_id.items() if v == r][0]
        if rel_name in SYMMETRIC:
            inverse_triples.append([t, r, h])

    triples.extend(inverse_triples)

    # Split: 80/10/10 train/val/test (temporal split preferred if timestamps available)
    return {
        'entity_to_id': entity_to_id,
        'relation_to_id': relation_to_id,
        'triples': np.array(triples),
    }
```

### Phase K2: RotatE Training

Train RotatE using PyKEEN on Modal GPU.

```python
# modal_app/train_kge.py
@app.function(gpu="A100", timeout=3600, volumes={"/models": vol})
def train_rotate(triples_path: str):
    from pykeen.pipeline import pipeline
    from pykeen.triples import TriplesFactory

    # Load exported triples
    triples = np.load(triples_path)
    tf = TriplesFactory.from_labeled_triples(triples)
    train, val, test = tf.split([0.8, 0.1, 0.1])

    result = pipeline(
        training=train,
        validation=val,
        testing=test,
        model='RotatE',
        model_kwargs={
            'embedding_dim': 128,
        },
        training_kwargs={
            'num_epochs': 300,
            'batch_size': 512,
        },
        negative_sampler='basic',
        negative_sampler_kwargs={
            'num_negs_per_pos': 5,
        },
        optimizer='Adam',
        optimizer_kwargs={
            'lr': 0.001,
        },
        stopper='early',
        stopper_kwargs={
            'patience': 30,
            'metric': 'mean_reciprocal_rank',
            'frequency': 10,
        },
    )

    # Save model and entity embeddings
    model = result.model
    entity_embeddings = model.entity_representations[0]().detach().cpu()
    torch.save(entity_embeddings, '/models/kge_embeddings.pt')
    torch.save(model.state_dict(), '/models/kge_model.pt')

    return {
        'mrr': result.metric_results.get_metric('mean_reciprocal_rank'),
        'hits_at_10': result.metric_results.get_metric('hits_at_10'),
        'num_entities': len(tf.entity_to_id),
        'num_relations': len(tf.relation_to_id),
    }
```

### Phase K3: Runtime Integration

The TheseusKGE class loads trained embeddings and predicts missing relations.

```python
# kge.py
class TheseusKGE:
    def __init__(self, embeddings_path, entity_to_id, relation_to_id):
        self.embeddings = torch.load(embeddings_path)
        self.entity_to_id = entity_to_id
        self.relation_to_id = relation_to_id

    def predict_missing_relations(self, entity_sha, top_k=20):
        """Score all (entity, relation, ?) triples."""
        if entity_sha not in self.entity_to_id:
            return self._cold_start_predict(entity_sha, top_k)

        idx = self.entity_to_id[entity_sha]
        h = self.embeddings[idx]

        scores = {}
        for rel_name, rel_idx in self.relation_to_id.items():
            # RotatE: score = -||h * r - t||
            # Score all tail entities
            r = self.relation_embeddings[rel_idx]
            all_scores = -torch.norm(h * r - self.embeddings, dim=-1)
            top = all_scores.topk(top_k)
            scores[rel_name] = list(zip(top.indices.tolist(), top.values.tolist()))

        return scores

    def _cold_start_predict(self, entity_sha, top_k):
        """
        Cold-start: average embeddings of known neighbors.
        If no neighbors, return empty predictions.
        """
        neighbor_shas = Edge.objects.filter(
            from_object__sha_hash=entity_sha
        ).values_list('to_object__sha_hash', flat=True)

        known = [self.entity_to_id[s] for s in neighbor_shas if s in self.entity_to_id]
        if not known:
            return {}

        h = self.embeddings[known].mean(dim=0)
        # ... same scoring as above with averaged embedding
```

### Phase K4: Scorer Integration

Five new features for the learned scorer from KGE predictions.

```python
# In learned_scorer.py feature construction:
KGE_FEATURES = [
    'kge_best_score',       # Highest RotatE score across all relations
    'kge_best_relation',    # Which relation scored highest (categorical)
    'kge_rank',             # Rank of the target among all candidates
    'kge_reciprocal_rank',  # 1 / rank (MRR-style feature)
    'kge_confidence_gap',   # Difference between best and second-best score
]

def extract_kge_features(from_sha, to_sha, kge_model):
    if kge_model is None:
        return [-1.0] * 5  # Imputation value for missing KGE

    predictions = kge_model.predict_pair(from_sha, to_sha)
    if not predictions:
        return [-1.0] * 5

    return [
        predictions['best_score'],
        predictions['best_relation_idx'],
        predictions['rank'],
        1.0 / max(predictions['rank'], 1),
        predictions['confidence_gap'],
    ]
```

Imputation: use -1.0 for all KGE features when the model is unavailable.
This signals "no information" to the GBT, which handles it natively via
split thresholds.

Shapley importance: after training, verify each KGE feature has
importance > 0.01. Drop features below this threshold; they add noise.

GNN co-training: when training the GNN, add an alignment loss between
GNN embeddings and frozen KGE embeddings:

```python
alignment_loss = alpha * F.mse_loss(gnn_emb, kge_emb.detach())  # alpha = 0.1
```

This encourages the GNN to respect the relational structure KGE learned,
without letting KGE gradients destabilize GNN training.

### Phase K5: GL-Fusion Structural Tokens

Generate bracket-format structural tokens for GL-Fusion Stream C.

```python
# kge_tokens.py
def generate_structural_tokens(entity_sha, kge_model, budget=150):
    """
    Format: [KGE rel:entity_name score:0.85] [KGE rel:entity_name score:0.72]

    Budget: 150 tokens total. Truncate lowest-scoring predictions first.
    Pre-compute BEFORE the LLM generation loop.
    """
    predictions = kge_model.predict_missing_relations(entity_sha, top_k=10)
    tokens = []

    for rel_name, candidates in predictions.items():
        for entity_idx, score in candidates[:3]:  # top 3 per relation
            entity_name = id_to_entity[entity_idx]
            token = f"[KGE {rel_name}:{entity_name} score:{score:.2f}]"
            tokens.append((score, token))

    # Sort by score descending, truncate to budget
    tokens.sort(reverse=True)
    result = []
    total_tokens = 0
    for score, token in tokens:
        token_count = len(token.split())
        if total_tokens + token_count > budget:
            break
        result.append(token)
        total_tokens += token_count

    return ' '.join(result)
```

Pre-computation is critical: structural tokens must be ready before the
LLM generation call. Never compute KGE predictions inside the generation
loop.

## Key Decisions

1. RotatE over TransE/DistMult because Index edges have complex
   relation patterns (symmetric, antisymmetric, compositional).
2. Embedding dim 128 matches GNN output dim for alignment loss.
3. Inverse materialization for symmetric relations doubles training
   signal without fabricating data.
4. Relation filtering (>= 10 instances) prevents the model from
   memorizing rare relation patterns.
5. Cold-start via neighbor averaging degrades gracefully. An Object with
   no graph neighbors simply gets no KGE signal.

## Common Mistakes

- Training on graphs with < 100 triples. Embeddings will be random.
- Forgetting inverse triples for symmetric relations. RotatE cannot
  infer symmetry without seeing both directions.
- Computing KGE tokens inside the generation loop. Each token generation
  call hits the embedding index; this must happen once, before the loop.
- Using 0.0 imputation instead of -1.0. Zero is a valid score;
  -1.0 is unambiguously "missing."

## Related Patterns

- PATTERNS-modal-gpu.md (KGE training dispatched to Modal)
- PATTERNS-learned-scorer.md (KGE features integrated into scorer)
- PATTERNS-gl-fusion-three-stream.md (Stream C consumes structural tokens)
