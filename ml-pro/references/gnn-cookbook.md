# GNN Cookbook (PyG)

## Data Format

```python
from torch_geometric.data import Data

data = Data(
    x=features,            # (N, D) float
    edge_index=edges,      # (2, E) long, COO format
    edge_type=types,       # (E,) long, for heterogeneous
    edge_attr=attrs,       # (E, D_e) float, optional
    y=labels,              # (N,) or (1,) depending on task
)
```

**edge_index must be**: dtype=torch.long, shape=(2, E), sorted is
optional but improves some operations. For undirected graphs, include
both directions: if edge (0,1) exists, (1,0) must also exist.

## Layer Selection

| Layer | `pyg.GCNConv` | `pyg.GATConv` | `pyg.SAGEConv` | `pyg.RGCNConv` | `pyg.GINConv` |
|---|---|---|---|---|---|
| Neighbor weighting | Degree-normalized | Learned attention | Sampled, aggregated | Per-relation weights | Sum + MLP |
| Edge types | Homogeneous | Homogeneous | Homogeneous | Heterogeneous | Homogeneous |
| Scalability | Medium | Medium | High (sampling) | Low (per-type params) | Medium |
| Best for | General node tasks | Varied importance | Large graphs | Knowledge graphs | Graph classification |
| Layers | 2-3 | 2-3 | 2-3 | 2 | 3-5 (less over-smoothing) |

## Layer Parameters

### GCNConv
```python
pyg.GCNConv(in_channels, out_channels,
    improved=False,      # A_hat = A + 2I instead of A + I
    add_self_loops=True, # auto-add self-loops
    normalize=True,      # symmetric normalization
)
```

### GATConv
```python
pyg.GATConv(in_channels, out_channels,
    heads=8,             # number of attention heads
    concat=True,         # concat heads (out = out_channels * heads)
    dropout=0.6,         # attention dropout (high for GAT)
    add_self_loops=True,
)
# If concat=True, next layer input = out_channels * heads
# Last layer typically uses concat=False and heads=1
```

### RGCNConv
```python
pyg.RGCNConv(in_channels, out_channels,
    num_relations=14,     # number of edge types
    num_bases=None,       # basis decomposition (reduces params)
    num_blocks=None,      # block-diagonal decomposition
)
# With many relations, use num_bases=30 to reduce parameters
```

### SAGEConv
```python
pyg.SAGEConv(in_channels, out_channels,
    aggr='mean',          # 'mean', 'max', 'sum'
    normalize=False,      # L2-normalize output
    project=False,        # project neighbors before aggregation
)
```

## Mini-Batch Training (Large Graphs)

```python
from torch_geometric.loader import NeighborLoader

train_loader = NeighborLoader(
    data,
    num_neighbors=[25, 10],    # sample counts per hop per layer
    batch_size=1024,
    input_nodes=data.train_mask,
    shuffle=True,
)

# In training loop
for batch in train_loader:
    batch = batch.to(device)
    out = model(batch.x, batch.edge_index)
    # batch.batch_size gives number of target nodes
    # out[:batch.batch_size] are the target node predictions
    loss = loss_fn(out[:batch.batch_size], batch.y[:batch.batch_size])
```

## Link Prediction Pipeline

```python
from torch_geometric.transforms import RandomLinkSplit

transform = RandomLinkSplit(
    num_val=0.1,
    num_test=0.1,
    is_undirected=True,
    add_negative_train_samples=True,
    neg_sampling_ratio=1.0,
)
train_data, val_data, test_data = transform(data)
# train_data.edge_label: 0/1 for negative/positive
# train_data.edge_label_index: edges to predict
```

## Graph Pooling (Graph-Level Tasks)

```python
from torch_geometric.nn import global_mean_pool, global_add_pool

# After GNN layers
x = gnn(data.x, data.edge_index)     # (N_total, D)
graph_emb = global_mean_pool(x, data.batch)  # (B, D)
out = classifier(graph_emb)           # (B, num_classes)
```

## Over-Smoothing Mitigation

### Residual Connections
```python
x_in = x
x = conv(x, edge_index)
x = x + x_in  # residual
x = torch.relu(x)
```

### JumpingKnowledge
```python
from torch_geometric.nn import JumpingKnowledge

self.jk = JumpingKnowledge(mode='cat')  # or 'max', 'lstm'
# In forward: collect outputs from each layer
xs = [layer_1_out, layer_2_out, layer_3_out]
x = self.jk(xs)  # concatenate all layer outputs
```

### DropEdge
```python
from torch_geometric.utils import dropout_edge
edge_index, edge_mask = dropout_edge(edge_index, p=0.3,
                                       training=self.training)
```

## Evaluation Metrics

### Node Classification
```python
pred = out.argmax(dim=1)
acc = (pred[mask] == data.y[mask]).float().mean()
```

### Link Prediction
```python
from sklearn.metrics import roc_auc_score, average_precision_score

scores = model.decode(z, edge_label_index).sigmoid()
auc = roc_auc_score(edge_label.cpu(), scores.cpu())
ap = average_precision_score(edge_label.cpu(), scores.cpu())
```

### KG Completion (Ranking)
```python
# MRR and Hits@K from PyKEEN
from pykeen.evaluation import RankBasedEvaluator
evaluator = RankBasedEvaluator()
# result.get_metric('both.realistic.inverse_harmonic_mean_rank')  # MRR
```

## Heterogeneous Graphs (HeteroData)

```python
from torch_geometric.data import HeteroData

data = HeteroData()
data['paper'].x = paper_features       # (N_paper, D)
data['author'].x = author_features     # (N_author, D)
data['paper', 'cites', 'paper'].edge_index = cite_edges
data['author', 'writes', 'paper'].edge_index = write_edges
```

Use `pyg.HeteroConv` to wrap convolutions per edge type:
```python
conv = pyg.HeteroConv({
    ('paper', 'cites', 'paper'): pyg.GCNConv(-1, hidden),
    ('author', 'writes', 'paper'): pyg.SAGEConv((-1, -1), hidden),
}, aggr='sum')
```
