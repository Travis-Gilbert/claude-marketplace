# Dimensionality Reduction

Reference for projecting high-dimensional data to 2D for D3 visualization.

## When to Reduce

When cluster or structure data has > 2 dimensions and needs to be
visualized as a scatter plot or force layout.

## Method Comparison

| Method | Type | Preserves | Speed | Axes Meaningful? |
|---|---|---|---|---|
| PCA | Linear | Global variance | Fast | Yes (% variance explained) |
| t-SNE | Non-linear | Local structure | Slow | No |
| UMAP | Non-linear | Local + global | Fast | No |
| MDS | Non-linear | Pairwise distances | Moderate | No |

## PCA (Principal Component Analysis)

**What it does**: Finds orthogonal directions (principal components)
that maximize variance in the data.

**Output**: Projected coordinates along PC1, PC2, ..., PCn.

**Key properties**:
- Linear transformation — preserves global structure
- Axes are meaningful (labeled "PC1 (X% variance)")
- Fast (eigendecomposition of covariance matrix)
- Best for linear separability and quick overview

**D3 visualization notes**:
- **Label axes** with component number and variance explained
- Show variance explained per component as a scree plot
- First 2 PCs may miss non-linear cluster structure

```javascript
// Axes with variance labels
svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .text(`PC1 (${(variance[0] * 100).toFixed(1)}% variance)`);
```

## t-SNE (t-distributed Stochastic Neighbor Embedding)

**What it does**: Preserves local neighborhood structure by matching
probability distributions in high-D and low-D space.

**Key parameter**: Perplexity (typical: 5-50)
- Lower perplexity → emphasizes local structure, tighter clusters
- Higher perplexity → emphasizes global structure

**Critical caveats for D3 visualization**:
1. **Distances between clusters are NOT meaningful** — only within-cluster structure is preserved
2. **Axis values are arbitrary** — do NOT label axes with numbers
3. **Non-deterministic** without fixed random seed
4. **Must converge** — check KL divergence before trusting layout
5. **Cluster sizes are NOT meaningful** — t-SNE normalizes local density

**D3 visualization rules**:
- Do NOT draw axis lines or tick marks
- Do NOT add grid lines
- Color by cluster label, not by position
- Add a note: "t-SNE projection — distances between clusters are approximate"
- Use same perplexity for comparable visualizations

## UMAP (Uniform Manifold Approximation and Projection)

**What it does**: Preserves both local and global structure better
than t-SNE, based on topological data analysis.

**Key parameters**:
- `n_neighbors` (typical: 5-50): controls local vs global preservation
- `min_dist` (typical: 0.0-0.99): controls how tightly points pack

**Advantages over t-SNE**:
- Faster (especially for large datasets)
- Better preserves global structure (cluster distances more meaningful)
- More consistent across runs

**D3 visualization**: Similar rules to t-SNE, but inter-cluster
distances are somewhat more interpretable.

## MDS (Multi-Dimensional Scaling)

**What it does**: Finds 2D positions that preserve pairwise distances
as faithfully as possible.

**Variants**:
- Classical MDS: Uses eigendecomposition (like PCA on distance matrix)
- Metric MDS: Minimizes stress (distortion of distances)
- Non-metric MDS: Preserves rank order of distances only

**Best for**: When you have a distance matrix (not raw features).

## Implementation Notes

### Python (scikit-learn) to D3

Compute projections in Python, pass to D3 as JSON:

```python
from sklearn.manifold import TSNE
from sklearn.decomposition import PCA

# PCA
pca = PCA(n_components=2)
coords_pca = pca.fit_transform(X)

# t-SNE
tsne = TSNE(n_components=2, perplexity=30, random_state=42)
coords_tsne = tsne.fit_transform(X)

# Export
result = [{
    "pca_x": float(pca[0]), "pca_y": float(pca[1]),
    "tsne_x": float(tsne[0]), "tsne_y": float(tsne[1]),
    "cluster": int(label)
} for pca, tsne, label in zip(coords_pca, coords_tsne, labels)]
```

### Browser-Side Options

For small datasets (< 5000 points):
- `druid-js` (npm): PCA, t-SNE, UMAP in JavaScript
- `umap-js` (npm): UMAP only, fast

For larger datasets: precompute in Python.
