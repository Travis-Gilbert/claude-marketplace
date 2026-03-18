# Clustering Algorithms

Reference for statistical clustering algorithms and their D3 visualization implications.

## Algorithm Comparison

| Algorithm | Type | Parameters | Shape | Noise | Scalability |
|---|---|---|---|---|---|
| K-Means | Centroid | k | Convex/spherical | No | O(nk) per iter |
| DBSCAN | Density | eps, minPts | Arbitrary | Yes | O(n log n) |
| HDBSCAN | Density | min_cluster_size | Arbitrary | Yes | O(n log n) |
| Agglomerative | Hierarchical | linkage, cut | Any (linkage-dependent) | No | O(n^2 log n) |
| Spectral | Graph | k, affinity | Non-convex | No | O(n^3) |
| GMM | Model-based | k, cov type | Elliptical | Soft | O(nk) per EM iter |

## K-Means

**What it finds**: Spherical (Voronoi) partitions. Each point belongs to the nearest centroid. Boundaries are linear (perpendicular bisectors between centroids).

**Algorithm**:
1. Initialize k centroids (random or k-means++)
2. Assign each point to nearest centroid
3. Recompute centroids as cluster means
4. Repeat until convergence

**Key properties**:
- Guaranteed to converge (but may find local minimum)
- Sensitive to initialization (use k-means++ or multiple restarts)
- Assumes equal-variance spherical clusters
- Inertia (within-cluster sum of squares) measures quality

**Visualization mapping**:
- Points → colored by assignment
- Centroids → larger markers (hollow circle, cross, diamond)
- Decision boundaries → Voronoi cells from `d3.Delaunay`
- Quality → elbow plot (k vs. inertia) or silhouette plot

## DBSCAN

**What it finds**: Dense regions of arbitrary shape. Sparse regions are noise.

**Algorithm**:
1. For each point, find all neighbors within eps radius
2. Points with ≥ minPts neighbors are core points
3. Core points within eps of each other form clusters
4. Non-core points within eps of a core point are border points
5. Remaining points are noise (label = -1)

**Key properties**:
- Does not require specifying k
- Finds arbitrary-shaped clusters
- Identifies outliers as noise
- Sensitive to eps and minPts choice
- Struggles with varying-density clusters (use HDBSCAN)

**Visualization mapping**:
- Core points → full opacity, colored
- Border points → reduced opacity (0.5-0.6)
- Noise points → gray, small, low opacity (0.3)
- Boundaries → convex hulls or alpha shapes per cluster
- Eps → optional circle on hover showing neighborhood radius

## HDBSCAN

Extension of DBSCAN that handles varying density. Uses a hierarchy of
density levels to find stable clusters.

**Key advantage**: Only requires min_cluster_size, not eps.
**Visualization**: Similar to DBSCAN but with cluster persistence scores
that can encode opacity or saturation.

## Agglomerative / Hierarchical

**What it finds**: A dendrogram (binary merge tree) at every possible
granularity. A horizontal cut produces k clusters.

**Algorithm**:
1. Start with each point as its own cluster
2. Find two closest clusters (by linkage criterion)
3. Merge them, record merge distance
4. Repeat until one cluster remains

**Linkage methods**:

| Method | Distance between clusters | Character |
|---|---|---|
| Single | min(pairwise distances) | Long chains, straggling |
| Complete | max(pairwise distances) | Compact, spherical |
| Average (UPGMA) | mean(pairwise distances) | Balanced |
| Ward | min variance increase | Even sizes, most intuitive |

**Default to Ward** unless specified otherwise.

**Visualization mapping**:
- Dendrogram with y-axis = merge distance
- Elbow connectors (horizontal + vertical segments)
- Cut line at chosen height colors branches by cluster
- Leaf ordering affects readability (use optimal leaf ordering)

## Gaussian Mixture Models

**What it finds**: Overlapping elliptical distributions. Soft assignments (probabilities per cluster).

**Key properties**:
- Each cluster is a multivariate Gaussian (mean + covariance)
- Fit via Expectation-Maximization (EM)
- Covariance types: full, diagonal, spherical, tied
- BIC/AIC for model selection

**Visualization mapping**:
- Points → colored by most likely cluster, opacity = max probability
- Ellipses → 1σ, 2σ, 3σ confidence contours per component
- Contour density overlay for mixture probability surface

## Spectral Clustering

**What it finds**: Non-convex cluster shapes via graph Laplacian.

**Algorithm**:
1. Build affinity graph (k-nearest neighbors or RBF kernel)
2. Compute graph Laplacian
3. Find bottom k eigenvectors
4. Run k-means on eigenvector coordinates

**Visualization**: Often visualized after dimensionality reduction since
the spectral embedding itself is meaningful.

## Choosing an Algorithm

| Situation | Recommended |
|---|---|
| Known k, convex clusters | K-Means |
| Unknown k, arbitrary shapes | DBSCAN or HDBSCAN |
| Need dendrogram / hierarchy | Agglomerative (Ward) |
| Overlapping clusters | GMM |
| Non-convex, graph structure | Spectral |
| Very large dataset (>100k) | Mini-batch K-Means |
