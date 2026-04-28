# PATTERNS-epignn.md

How to extend the base GNN with epistemic awareness: heterophily-aware
convolution, curvature-weighted aggregation, and two-state output channels.

## Problem

Standard R-GCN treats all edge types symmetrically during message passing.
A "supports" edge and a "contradicts" edge deliver the same aggregation
pattern. This washes out epistemic signal. Opposition edges should preserve
differences between neighbors, not smooth them away. Bridge nodes connecting
distinct communities should amplify, not dampen.

## When to Use

- The GNN is trained and producing structural embeddings but fails to
  separate contradicting claims (cosine similarity between opposites
  stays above 0.85).
- Bridge nodes (high betweenness centrality) produce embeddings
  indistinguishable from their intra-cluster neighbors.
- The GL-Fusion architecture needs both content and epistemic state
  vectors per node.

## The Pattern

### Extension 1: HeterophilyAwareConv

Relation-class-conditioned message passing that applies different
aggregation logic based on edge epistemic class.

```python
# Classify relations into three epistemic classes
AGREEMENT = {'supports', 'entailment', 'similarity', 'shared_entity', 'structural'}
OPPOSITION = {'contradicts'}
NEUTRAL = {'causal', 'mentions'}  # plus any not listed above

class HeterophilyAwareConv(MessagePassing):
    """
    For agreement edges: standard mean aggregation (smooth toward consensus).
    For opposition edges: difference-preserving aggregation (push apart).
    For neutral edges: standard aggregation with dampened weight.
    """
    def __init__(self, in_channels, out_channels, num_relations, num_bases=4):
        super().__init__(aggr='add')
        self.W_agree = RGCNConv(in_channels, out_channels, len(AGREEMENT), num_bases)
        self.W_oppose = nn.Linear(in_channels * 2, out_channels)
        self.W_neutral = RGCNConv(in_channels, out_channels, len(NEUTRAL), num_bases)

    def forward(self, x, edge_index, edge_type, relation_class):
        # Split edges by epistemic class
        agree_mask = relation_class == 0
        oppose_mask = relation_class == 1
        neutral_mask = relation_class == 2

        h_agree = self.W_agree(x, edge_index[:, agree_mask], edge_type[agree_mask])
        h_oppose = self._oppose_aggregate(x, edge_index[:, oppose_mask])
        h_neutral = self.W_neutral(x, edge_index[:, neutral_mask], edge_type[neutral_mask])

        return h_agree + h_oppose + h_neutral

    def _oppose_aggregate(self, x, edge_index):
        """Difference-preserving: h_v = W * [h_v || h_v - mean(h_neighbors)]"""
        src, dst = edge_index
        diff = x[dst] - x[src]  # difference, not sum
        agg = scatter_mean(diff, dst, dim=0, dim_size=x.size(0))
        return self.W_oppose(torch.cat([x, agg], dim=-1))
```

Key decision: opposition edges compute `h_v - h_u` (not `h_v + h_u`).
This preserves separation between contradicting nodes. The standard
mean aggregation would push them together.

### Extension 2: ORC-Weighted Aggregation

Ollivier-Ricci Curvature (ORC) measures the geometry of each edge.
Negative curvature indicates a bridge between clusters. Positive
curvature indicates intra-cluster redundancy.

```python
def compute_orc_weights(edge_index, community_labels):
    """
    Bridge amplification: negative ORC edges get higher weight.
    Intra-cluster dampening: positive ORC edges get lower weight.

    ORC is precomputed by graph-theory agent via GraphRicciCurvature.
    """
    orc = compute_ollivier_ricci(edge_index)  # per-edge float

    weights = torch.ones(edge_index.size(1))
    for i, curv in enumerate(orc):
        if curv < -0.1:
            weights[i] = 1.0 + abs(curv)  # amplify bridges (1.1 to 2.0)
        elif curv > 0.3:
            weights[i] = max(0.5, 1.0 - curv)  # dampen intra-cluster (0.5 to 0.7)

    return weights

# Usage in message passing:
# h_v = sum_u( orc_weight(v,u) * W * h_u ) / sum_u( orc_weight(v,u) )
```

Bridge amplification target: bridge node embeddings should have >= 10%
higher L2 norm than their intra-cluster neighbors.

Computation: ORC is expensive (O(N^2) per edge for optimal transport).
Precompute via Leiden community detection, then use community membership
to approximate. Only recompute when graph structure changes > 10%.

### Extension 3: Two-State Output

Each node produces two embedding vectors instead of one.

```
h_content:   128d  (what the node is about)
h_epistemic: 32d   (what the node's epistemic status is)
```

Separate update channels:
- `h_content` updates from ALL edge types (standard message passing)
- `h_epistemic` updates ONLY from agreement edges (propagate confidence,
  not disagreement through the epistemic channel)

```python
class TwoStateGNN(nn.Module):
    def __init__(self, in_dim, content_dim=128, epistemic_dim=32, num_rels=14):
        super().__init__()
        self.content_conv1 = HeterophilyAwareConv(in_dim, content_dim, num_rels)
        self.content_conv2 = HeterophilyAwareConv(content_dim, content_dim, num_rels)
        self.epistemic_conv1 = RGCNConv(in_dim, epistemic_dim, len(AGREEMENT), num_bases=2)
        self.epistemic_conv2 = RGCNConv(epistemic_dim, epistemic_dim, len(AGREEMENT), num_bases=2)

    def forward(self, x, edge_index, edge_type, relation_class, orc_weights):
        # Content path: all edges, heterophily-aware
        h_c = self.content_conv1(x, edge_index, edge_type, relation_class).relu()
        h_c = self.content_conv2(h_c, edge_index, edge_type, relation_class)

        # Epistemic path: agreement edges only
        agree_mask = relation_class == 0
        h_e = self.epistemic_conv1(x, edge_index[:, agree_mask], edge_type[agree_mask]).relu()
        h_e = self.epistemic_conv2(h_e, edge_index[:, agree_mask], edge_type[agree_mask])

        return h_c, h_e  # 128d + 32d = 160d total per node
```

## Evaluation Metrics

**Contradiction separation:** Compute cosine similarity between all
pairs of nodes connected by "contradicts" edges. After training, the
average cosine similarity should decrease by >= 0.10 compared to the
base R-GCN.

**Bridge amplification:** Compute L2 norm of bridge node embeddings
(nodes with betweenness centrality > 90th percentile). After training,
bridge embeddings should have >= 10% higher L2 norm than their
intra-cluster neighbors.

## Key Decisions

1. Opposition edges use difference aggregation, not negation. Negation
   would flip the embedding entirely; difference preserves both identities
   while encoding the disagreement.
2. ORC is precomputed, not learned. Learning curvature end-to-end would
   add training instability. Precomputed ORC is a stable geometric signal.
3. Epistemic channel uses agreement-only propagation. Propagating
   contradiction through the epistemic channel would corrupt confidence
   estimation. Contradictions are captured in the content channel via
   HeterophilyAwareConv.

## Common Mistakes

- Training both states from all edge types. The epistemic channel must
  only see agreement edges.
- Using ORC weights without normalization. Weights must be normalized
  per-node so the aggregation scale is consistent.
- Forgetting to export both h_content and h_epistemic separately for
  GL-Fusion Stream A.

## Related Patterns

- PATTERNS-gnn-training.md (base pipeline this extends)
- PATTERNS-learned-scorer.md (both states become scorer features)
- PATTERNS-gl-fusion-three-stream.md (Stream A consumes both states)
