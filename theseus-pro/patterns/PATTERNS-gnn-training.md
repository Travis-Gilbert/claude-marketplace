# PATTERNS-gnn-training.md

How to train and deploy a Graph Neural Network for structural embeddings.

## Pipeline

### Step 1: Export Graph

Management command: `export_graph_for_gnn`

```python
import torch
from torch_geometric.data import Data

objects = Object.objects.filter(is_deleted=False)
edges = Edge.objects.all()

# Node features: SBERT (384d) + type one-hot (11d) + topology (2d)
node_features = []
node_id_map = {}
for i, obj in enumerate(objects):
    node_id_map[obj.id] = i
    sbert = get_sbert_embedding(obj)     # 384d, or zeros if unavailable
    type_oh = one_hot(obj.object_type)   # 11d
    topo = [obj.edge_count, obj.centrality or 0.0]  # 2d
    node_features.append(torch.cat([sbert, type_oh, torch.tensor(topo)]))

x = torch.stack(node_features)  # [N, 397]

# Edge index and types
src, dst, edge_types = [], [], []
for edge in edges:
    if edge.from_object_id in node_id_map and edge.to_object_id in node_id_map:
        src.append(node_id_map[edge.from_object_id])
        dst.append(node_id_map[edge.to_object_id])
        edge_types.append(EDGE_TYPE_MAP[edge.edge_type])

edge_index = torch.tensor([src, dst], dtype=torch.long)
edge_type = torch.tensor(edge_types, dtype=torch.long)

data = Data(x=x, edge_index=edge_index, edge_type=edge_type)
torch.save(data, 'graph_export.pt')
```

### Step 2: Train on Modal

```python
# modal_gnn_train.py
import modal

app = modal.App("theseus-gnn")
vol = modal.Volume.from_name("theseus-models", create_if_missing=True)

@app.function(gpu="A100", volumes={"/models": vol}, timeout=3600)
def train_rgcn(graph_path: str):
    from torch_geometric.nn import RGCNConv
    import torch

    data = torch.load(graph_path)

    class RGCN(torch.nn.Module):
        def __init__(self, in_channels, hidden, out_channels, num_relations):
            super().__init__()
            self.conv1 = RGCNConv(in_channels, hidden, num_relations, num_bases=4)
            self.conv2 = RGCNConv(hidden, out_channels, num_relations, num_bases=4)

        def forward(self, x, edge_index, edge_type):
            x = self.conv1(x, edge_index, edge_type).relu()
            x = self.conv2(x, edge_index, edge_type)
            return x

    model = RGCN(data.x.size(1), 256, 128, num_relations=14)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    # Train with link prediction objective
    # Split edges 80/10/10
    # Negative sampling: 5x positives
    # Early stopping on val MRR
    # ...

    # Extract embeddings
    model.eval()
    with torch.no_grad():
        embeddings = model(data.x, data.edge_index, data.edge_type)

    torch.save(embeddings, '/models/gnn_embeddings.pt')
    torch.save(model.state_dict(), '/models/gnn_model.pt')
```

### Step 3: Import Embeddings

```python
# In vector_store.py
def load_gnn_embeddings():
    embeddings = torch.load('gnn_embeddings.pt')
    index = faiss.IndexFlatIP(128)
    index.add(embeddings.numpy())
    return index
```

### Step 4: New Engine Pass

```python
# In engine.py
def _run_gnn_engine(obj, config):
    """Structural similarity from GNN embeddings. get_started.py-only."""
    if not _GNN_AVAILABLE:
        return []
    threshold = config.get('gnn_threshold', 0.5)
    embedding = gnn_store.get_embedding(obj.id)
    if embedding is None:
        return []
    similar = gnn_store.find_similar(embedding, top_k=20, threshold=threshold)
    new_edges = []
    for match_id, score in similar:
        if match_id == obj.id:
            continue
        match_obj = Object.objects.get(id=match_id)
        reason = f"Structurally similar graph position (GNN score {score:.2f})"
        edge, created = Edge.objects.get_or_create(
            from_object=obj, to_object=match_obj,
            edge_type='structural_similarity',
            defaults={'reason': reason, 'strength': score, 'is_auto': True, 'engine': 'gnn'}
        )
        if created:
            new_edges.append(edge)
    return new_edges
```

## Key Constraints

- GNN training is Modal GPU only (never production)
- R-GCN with basis decomposition (B=4) for 14 relation types
- Max 2-3 layers (over-smoothing beyond 3)
- GraphSAGE variant needed for real-time embedding of new Objects
- Retrain periodically as graph grows (weekly or when edge count changes >10%)
