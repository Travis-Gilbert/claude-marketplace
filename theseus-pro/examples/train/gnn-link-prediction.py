"""
GNN Link Prediction Training

Demonstrates the graph neural network pipeline for structural
embeddings: export the knowledge graph to PyTorch Geometric format,
define an R-GCN model for link prediction over 14 relation types,
train with negative sampling, extract node embeddings, and store
them in a FAISS index for fast similarity search.

This is a get_started.py GPU job -- it never runs in Railway production.
The resulting embeddings are downloaded and used as an additional
engine pass signal, giving the system structural awareness beyond
what text similarity provides.

Two-mode note: the FAISS index and embeddings are the only artifacts
that cross into production. PyTorch Geometric stays on get_started.py.
"""

import logging
import os
import sys

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "research_api.settings")
django.setup()

import faiss
import numpy as np
import torch
import torch.nn.functional as F
from torch_geometric.data import Data
from torch_geometric.nn import RGCNConv
from torch_geometric.utils import negative_sampling

from apps.notebook.models import Edge, Object

logger = logging.getLogger("theseus.train.gnn")

# 14 edge types in the Index knowledge graph.
EDGE_TYPE_MAP = {
    "semantic_similarity": 0, "lexical_overlap": 1,
    "shared_entity": 2, "entailment": 3,
    "contradiction": 4, "structural_prediction": 5,
    "manual": 6, "citation": 7,
    "temporal_influence": 8, "causal": 9,
    "supports": 10, "contradicts": 11,
    "elaborates": 12, "structural_similarity": 13,
}
NUM_RELATIONS = len(EDGE_TYPE_MAP)
EMBEDDING_DIM = 128
HIDDEN_DIM = 256


def export_graph():
    """Export the knowledge graph to PyTorch Geometric Data format.

    Node features are SBERT embeddings (384d) concatenated with
    a one-hot object type vector (11d) and topology features (2d),
    giving 397-dimensional node features.
    """
    objects = list(Object.objects.filter(is_deleted=False).order_by("id"))
    edges = Edge.objects.select_related("from_object", "to_object").all()

    node_id_map = {obj.id: i for i, obj in enumerate(objects)}

    # Build node features: SBERT (384d) + type one-hot (11d) + topology (2d)
    object_types = sorted(set(obj.object_type for obj in objects))
    type_to_idx = {t: i for i, t in enumerate(object_types)}
    num_types = max(len(type_to_idx), 11)

    node_features = []
    for obj in objects:
        # SBERT embedding -- zeros if not available (two-mode safe)
        sbert = getattr(obj, "sbert_embedding", None)
        sbert_vec = torch.tensor(sbert, dtype=torch.float) if sbert else torch.zeros(384)

        # Object type one-hot
        type_oh = torch.zeros(num_types)
        type_oh[type_to_idx.get(obj.object_type, 0)] = 1.0

        # Topology: degree and centrality
        degree = Edge.objects.filter(from_object=obj).count()
        centrality = getattr(obj, "centrality", 0.0) or 0.0
        topo = torch.tensor([float(degree), centrality])

        node_features.append(torch.cat([sbert_vec, type_oh, topo]))

    x = torch.stack(node_features)

    # Build edge index and edge type tensors.
    src, dst, edge_types = [], [], []
    for edge in edges:
        if edge.from_object_id in node_id_map and edge.to_object_id in node_id_map:
            src.append(node_id_map[edge.from_object_id])
            dst.append(node_id_map[edge.to_object_id])
            edge_types.append(EDGE_TYPE_MAP.get(edge.edge_type, 0))

    edge_index = torch.tensor([src, dst], dtype=torch.long)
    edge_type = torch.tensor(edge_types, dtype=torch.long)

    data = Data(x=x, edge_index=edge_index, edge_type=edge_type)
    logger.info("Exported graph: %d nodes, %d edges", data.num_nodes, data.num_edges)
    return data, node_id_map


class RGCN(torch.nn.Module):
    """Relational Graph Convolutional Network for link prediction.

    Two R-GCN layers with basis decomposition (num_bases=4) to keep
    parameter count manageable across 14 relation types. Deeper models
    risk over-smoothing on small graphs.
    """

    def __init__(self, in_channels, hidden, out_channels, num_relations):
        super().__init__()
        self.conv1 = RGCNConv(in_channels, hidden, num_relations, num_bases=4)
        self.conv2 = RGCNConv(hidden, out_channels, num_relations, num_bases=4)

    def forward(self, x, edge_index, edge_type):
        x = self.conv1(x, edge_index, edge_type).relu()
        x = F.dropout(x, p=0.2, training=self.training)
        x = self.conv2(x, edge_index, edge_type)
        return x

    def predict_link(self, z, src, dst):
        """Score candidate links via dot product of embeddings."""
        return (z[src] * z[dst]).sum(dim=-1)


def train(data, epochs=200, lr=0.001):
    """Train the R-GCN with link prediction objective and negative sampling."""
    model = RGCN(data.x.size(1), HIDDEN_DIM, EMBEDDING_DIM, NUM_RELATIONS)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-5)

    # Use all edges for training (small graph regime).
    pos_edge_index = data.edge_index
    best_loss = float("inf")
    patience, patience_counter = 20, 0

    for epoch in range(1, epochs + 1):
        model.train()
        optimizer.zero_grad()

        z = model(data.x, data.edge_index, data.edge_type)

        # Positive edges
        pos_score = model.predict_link(z, pos_edge_index[0], pos_edge_index[1])

        # Negative sampling: 5x the number of positive edges
        neg_edge_index = negative_sampling(
            pos_edge_index, num_nodes=data.num_nodes,
            num_neg_samples=pos_edge_index.size(1) * 5,
        )
        neg_score = model.predict_link(z, neg_edge_index[0], neg_edge_index[1])

        # Binary cross-entropy loss
        pos_loss = F.binary_cross_entropy_with_logits(pos_score, torch.ones_like(pos_score))
        neg_loss = F.binary_cross_entropy_with_logits(neg_score, torch.zeros_like(neg_score))
        loss = pos_loss + neg_loss

        loss.backward()
        optimizer.step()

        # Early stopping on training loss (use validation MRR in production).
        if loss.item() < best_loss - 0.001:
            best_loss = loss.item()
            patience_counter = 0
        else:
            patience_counter += 1

        if epoch % 20 == 0:
            logger.info("Epoch %3d | Loss %.4f", epoch, loss.item())

        if patience_counter >= patience:
            logger.info("Early stopping at epoch %d", epoch)
            break

    return model


def extract_and_store_embeddings(model, data, node_id_map):
    """Extract final embeddings and build a FAISS index for similarity search."""
    model.set_to_inference_mode = lambda: None  # no-op for clarity
    with torch.no_grad():
        embeddings = model(data.x, data.edge_index, data.edge_type)

    emb_np = embeddings.numpy().astype("float32")

    # L2-normalize for cosine similarity via inner product.
    faiss.normalize_L2(emb_np)
    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    index.add(emb_np)

    # Save artifacts
    os.makedirs("models", exist_ok=True)
    faiss.write_index(index, "models/gnn_embeddings.faiss")
    torch.save(embeddings, "models/gnn_embeddings.pt")
    np.save("models/gnn_node_id_map.npy", node_id_map)

    logger.info("Stored %d embeddings (%dd) in FAISS index", len(emb_np), EMBEDDING_DIM)
    return index


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    data, node_id_map = export_graph()
    if data.num_edges == 0:
        print("No edges in graph. Nothing to train on.")
        sys.exit(1)

    model = train(data)
    extract_and_store_embeddings(model, data, node_id_map)
    print("\nGNN training complete. Embeddings ready for engine integration.")
