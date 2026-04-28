# PATTERNS-sbert-enrichment.md

How to fine-tune the SBERT encoder for epistemic tasks, build multi-view
embeddings, and align graph structure with text representations.

## Problem

The default SBERT model (all-MiniLM-L6-v2) was trained on general web
text. It treats "X supports Y" and "X contradicts Y" as equally similar
(both are about X and Y). Domain-specific fine-tuning teaches the encoder
that epistemic relationships matter: supporting claims should be closer
than contradicting claims, and question-answer pairs should be closer
than question-question pairs.

## When to Use

- SBERT retrieval returns semantically related but epistemically wrong
  results (contradictions ranked as if they were agreements)
- Building multi-view embeddings for different retrieval contexts
- Aligning text embeddings with graph structure (contrastive learning)
- Preparing the semantic stream for GL-Fusion Stream B

## The Pattern

### Phase S1: Embedding Audit and Schema Migration

Before fine-tuning, audit the current embedding landscape.

```python
# Audit: what embedding types exist?
from apps.notebook.models import Object

# Add view_type field to embedding storage if not present
# Migration: add view_type CharField to EmbeddingRecord
# Values: 'global', 'claim', 'title', 'question', 'chain'
# Default: 'global' (backward compatible)
```

Schema migration adds `view_type` to the embedding storage model.
Existing embeddings become `view_type='global'`. New views are generated
alongside, not replacing, global embeddings.

### Phase S2: Six Triplet Sources

Training data for epistemic SBERT comes from six sources in the
knowledge graph, ordered by signal quality.

```python
TRIPLET_SOURCES = [
    # 1. User-confirmed edges (strongest signal)
    {
        'name': 'confirmed_edges',
        'anchor': 'from_object.body',
        'positive': 'to_object.body',
        'filter': Edge.objects.filter(is_auto=False),
        'weight': 1.0,
    },

    # 2. High-confidence auto edges (engine produced, not yet reviewed)
    {
        'name': 'high_confidence_auto',
        'anchor': 'from_object.body',
        'positive': 'to_object.body',
        'filter': Edge.objects.filter(is_auto=True, strength__gte=0.8),
        'weight': 0.7,
    },

    # 3. Claim entailment pairs (NLI score > 0.8)
    {
        'name': 'entailment_pairs',
        'anchor': 'claim_a.text',
        'positive': 'claim_b.text',
        'filter': 'nli_entailment > 0.8',
        'weight': 0.8,
    },

    # 4. Question-evidence pairs (Question -> addressing Objects)
    {
        'name': 'question_evidence',
        'anchor': 'question.text',
        'positive': 'evidence_object.body',
        'filter': 'question.evidence_links',
        'weight': 0.9,
    },

    # 5. Same-notebook co-occurrence (weak signal, high volume)
    {
        'name': 'notebook_cooccurrence',
        'anchor': 'object_a.body',
        'positive': 'object_b.body',
        'filter': 'same notebook, created within 7 days',
        'weight': 0.3,
    },

    # 6. Contradiction pairs (NEGATIVE training signal)
    {
        'name': 'contradiction_pairs',
        'anchor': 'claim_a.text',
        'negative': 'claim_b.text',
        'filter': Edge.objects.filter(edge_type='contradicts'),
        'weight': 1.0,
    },
]
```

Hard negatives: mine from same Louvain community but no connecting edge.
These are topically related but not epistemically linked. More valuable
than random negatives by 3-5x.

### Phase S3: Encoder Fine-Tuning

```python
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

# Base model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Build training examples from all six sources
train_examples = []
for source in TRIPLET_SOURCES:
    for anchor, positive in source['pairs']:
        train_examples.append(InputExample(texts=[anchor, positive]))

train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=32)

# Loss: MultipleNegativesRankingLoss
# In-batch negatives are free; hard negatives from source 6 are explicit
loss = losses.MultipleNegativesRankingLoss(model)

# Train
model.fit(
    train_objectives=[(train_dataloader, loss)],
    epochs=3,
    warmup_steps=100,
    evaluation_steps=500,
    output_path='sbert-epistemic-v1',
)
```

Iterative bootstrap: after the first fine-tuning round, re-encode the
corpus and mine harder negatives (pairs with high similarity but
known-different epistemic status). Repeat for 2-3 rounds. Each round
produces harder negatives, yielding a more discriminating encoder.

### Phase S4: Multi-View Embeddings

Generate five embedding views per Object, each optimized for a
different retrieval context.

| View | Input Text | Purpose |
|------|-----------|---------|
| `global` | Full object body | General semantic search |
| `claim` | Extracted claims joined | Claim-level retrieval |
| `title` | Object title only | Quick title matching |
| `question` | Generated question formulation | Question answering |
| `chain` | Provenance chain text | Lineage tracing |

```python
def encode_multi_view(obj, model):
    views = {
        'global': model.encode(obj.body),
        'claim': model.encode(' '.join(c.text for c in obj.claims.all())),
        'title': model.encode(obj.title),
        'question': model.encode(formulate_question(obj)),
        'chain': model.encode(obj.provenance_text()),
    }
    return views
```

Storage: each view gets its own FAISS index in vector_store.py. Retrieval
routes to the appropriate view based on query type.

### Phase S5: Graph-Text Contrastive Alignment

Align SBERT embeddings with GNN structural embeddings so that nodes
close in graph space are close in text space.

```python
# Projection heads (trained; encoders are frozen)
text_proj = nn.Linear(384, 256)   # SBERT dim -> shared space
graph_proj = nn.Linear(128, 256)  # GNN h_content dim -> shared space

def infonce_loss(text_emb, graph_emb, temperature=0.07):
    """
    InfoNCE contrastive loss.
    Positive pairs: same node's text and graph embeddings.
    Negative pairs: different nodes' embeddings within the batch.
    """
    text_z = F.normalize(text_proj(text_emb), dim=-1)
    graph_z = F.normalize(graph_proj(graph_emb), dim=-1)

    logits = text_z @ graph_z.T / temperature
    labels = torch.arange(len(text_z), device=text_z.device)

    loss_t2g = F.cross_entropy(logits, labels)
    loss_g2t = F.cross_entropy(logits.T, labels)
    return (loss_t2g + loss_g2t) / 2
```

Training: freeze both SBERT and GNN encoders. Only train the projection
heads. This prevents catastrophic forgetting in either encoder.

Quality gate: alignment is successful when:
- Cross-modal cosine similarity > 0.4 for connected node pairs
- Overlap@10 > 40% (top 10 text neighbors and top 10 graph neighbors
  share at least 4 nodes)

If either metric fails, check for data quality issues (stale embeddings,
mismatched entity IDs) before increasing training epochs.

## Key Decisions

1. MiniLM as base (not MPNet or E5) because it fits Railway CPU memory.
   Larger models would break the two-mode contract.
2. MultipleNegativesRankingLoss over TripletLoss because in-batch
   negatives scale better with batch size.
3. Projection heads only (not end-to-end) for contrastive alignment
   to avoid destabilizing pretrained encoders.
4. Five views (not more) to keep FAISS index count manageable. Each view
   adds ~50MB of index storage.

## Common Mistakes

- Fine-tuning on contradiction pairs as positives. Contradictions are
  NEGATIVE signal. Use them in source 6 explicitly.
- Rebuilding FAISS indexes during peak usage. Schedule re-indexing
  overnight or on Modal.
- Training contrastive alignment before both SBERT and GNN are
  individually trained. Align after, not during.
- Using cosine similarity threshold < 0.3 for the quality gate. Below
  0.3, the alignment is barely better than random.

## Related Patterns

- PATTERNS-gnn-training.md (GNN embeddings are one side of alignment)
- PATTERNS-gl-fusion-three-stream.md (Stream B consumes aligned SBERT)
