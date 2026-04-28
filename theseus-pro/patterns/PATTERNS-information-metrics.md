# PATTERNS-information-metrics.md

## Information-Theoretic Evaluation for Theseus

### What This Pattern Covers

Using entropy, mutual information, and MDL to evaluate signal quality,
embedding effectiveness, feature redundancy, and optimal cluster count.

### Signal Independence Check

```python
import numpy as np
from sklearn.metrics import mutual_info_score

def evaluate_signal_independence(retrieval_results, n_bins=10):
    """Measure redundancy between retrieval signals.

    High MI = signals capture similar information (redundant).
    Low MI = signals capture different information (complementary).
    """
    signals = {
        'bm25': [r['bm25_score'] for r in retrieval_results],
        'sbert': [r['sbert_score'] for r in retrieval_results],
        'graph': [r['graph_score'] for r in retrieval_results],
        'entity': [r['entity_score'] for r in retrieval_results],
    }
    # Discretize each signal into quantile bins
    binned = {}
    for name, values in signals.items():
        arr = np.array(values)
        edges = np.quantile(arr, np.linspace(0, 1, n_bins + 1)[1:-1])
        binned[name] = np.digitize(arr, edges)

    # Pairwise MI
    pairs = [('bm25', 'sbert'), ('bm25', 'graph'), ('bm25', 'entity'),
             ('sbert', 'graph'), ('sbert', 'entity'), ('graph', 'entity')]
    results = {}
    for a, b in pairs:
        mi = mutual_info_score(binned[a], binned[b]) / np.log(2)
        results[f'MI({a},{b})'] = round(mi, 3)
    return results
    # Interpretation:
    # MI > 1.5 bits: heavy redundancy, consider downweighting in RRF
    # MI < 0.3 bits: independent signals, RRF benefits maximally
```

### Feature Redundancy for the Scorer

```python
def scorer_feature_redundancy(feature_matrix, feature_names):
    """Identify redundant features in the scorer's feature vector.

    Returns pairs of features with NMI > threshold.
    """
    n_features = feature_matrix.shape[1]
    redundant_pairs = []
    for i in range(n_features):
        for j in range(i + 1, n_features):
            # Discretize continuous features
            fi = np.digitize(feature_matrix[:, i],
                             np.quantile(feature_matrix[:, i],
                                         np.linspace(0, 1, 11)[1:-1]))
            fj = np.digitize(feature_matrix[:, j],
                             np.quantile(feature_matrix[:, j],
                                         np.linspace(0, 1, 11)[1:-1]))
            mi = mutual_info_score(fi, fj) / np.log(2)
            hi = -np.sum(np.bincount(fi, minlength=1) / len(fi) *
                         np.log2(np.bincount(fi, minlength=1) / len(fi) + 1e-12))
            hj = -np.sum(np.bincount(fj, minlength=1) / len(fj) *
                         np.log2(np.bincount(fj, minlength=1) / len(fj) + 1e-12))
            nmi = 2 * mi / (hi + hj + 1e-12)
            if nmi > 0.8:
                redundant_pairs.append((feature_names[i], feature_names[j], nmi))
    return redundant_pairs
```

### MDL Cluster Count Selection

```python
def mdl_optimal_k(embeddings, k_range=range(5, 50)):
    """Find optimal cluster count via MDL.

    The best K minimizes total description length:
    model_cost (K centroids) + data_cost (encoding residuals).
    """
    from sklearn.cluster import KMeans
    n, d = embeddings.shape
    scores = []
    for k in k_range:
        km = KMeans(n_clusters=k, n_init=5, random_state=42)
        labels = km.fit_predict(embeddings)
        # Model cost: K centroids in d dimensions
        model_cost = k * d * 32  # 32 bits per float
        # Assignment encoding
        assign_cost = n * np.log2(k)
        # Data cost: sum of squared distances
        data_cost = km.inertia_
        total = model_cost + assign_cost + data_cost
        scores.append((k, total))
    best_k = min(scores, key=lambda x: x[1])[0]
    return best_k, scores
```

### Edge-Type Entropy Per Node

```python
def compute_node_diversity(graph):
    """Compute edge-type entropy for each node.

    High entropy = structurally diverse (connected by many edge types).
    Low entropy = structurally homogeneous (dominated by one edge type).
    """
    from collections import Counter
    node_entropies = {}
    for node_pk in graph.nodes:
        edge_types = [e.edge_type for e in node_pk.edges.all()]
        if not edge_types:
            node_entropies[node_pk] = 0.0
            continue
        counts = Counter(edge_types)
        total = sum(counts.values())
        probs = np.array([c / total for c in counts.values()])
        entropy = -np.sum(probs * np.log2(probs + 1e-12))
        node_entropies[node_pk] = entropy
    return node_entropies
    # Mean entropy across substantive nodes -> IQ Organization sub-metric
```

### Agents Involved

1. information-theory: all metrics in this pattern
2. learned-scoring: feature vector analysis
3. retrieval-engineering: signal independence
4. graph-theory: cluster evaluation
