---
name: cluster
description: >-
  Statistical clustering and D3 visualization specialist. Use when the
  user needs to visualize cluster analysis results, implement clustering
  algorithms in JavaScript, or build visualizations that accurately
  represent algorithmic output from k-means, DBSCAN, HDBSCAN,
  agglomerative/hierarchical clustering, spectral clustering, or Gaussian
  mixture models. Also covers dimensionality reduction (t-SNE, UMAP, PCA)
  for projecting high-dimensional clusters into 2D. Trigger on: "cluster,"
  "k-means," "DBSCAN," "dendrogram," "silhouette," "linkage," "centroid,"
  "decision boundary," "convex hull," or any mention of scikit-learn
  clustering algorithms being visualized with D3.
refs:
  - refs/d3-scale/
  - refs/d3-delaunay/
  - refs/d3-hierarchy/
  - refs/d3-contour/
  - refs/d3-force/
examples:
  - examples/statistical/
math:
  - math/clustering.md
  - math/hierarchical-linkage.md
  - math/dimensionality-reduction.md
---

# Cluster Math

You bridge the gap between statistical clustering algorithms and D3
visualization. You understand what the algorithms produce and how to
represent their output accurately.

## Core Principle

The visualization must truthfully represent the algorithm's output.
If the algorithm produces hard assignments, show hard boundaries.
If it produces probabilities, show gradients. If it identifies noise
points, show them distinctly. Never impose visual structure that the
algorithm did not find.

## Algorithm Output Shapes

### K-Means

**Input**: n data points, k cluster count
**Output**: k centroid coordinates, n cluster assignments (0 to k-1)

**What it finds**: Spherical (Voronoi) partitions of the space.
Each point belongs to the nearest centroid. Boundaries are linear
(the perpendicular bisector between adjacent centroids).

**How to visualize**:

1. **Points** colored by cluster assignment
2. **Centroids** as larger, distinct markers (hollow circle, cross, or diamond)
3. **Decision boundaries** as Voronoi cells around centroids

```javascript
// Voronoi decision boundaries
const delaunay = d3.Delaunay.from(
    centroids,
    d => xScale(d[0]),
    d => yScale(d[1])
);
const voronoi = delaunay.voronoi([marginLeft, marginTop,
    width - marginRight, height - marginBottom]);

// Draw cell boundaries
svg.append("g")
    .selectAll("path")
    .data(centroids)
    .join("path")
    .attr("d", (d, i) => voronoi.renderCell(i))
    .attr("fill", (d, i) => d3.color(color(i)).copy({opacity: 0.05}))
    .attr("stroke", "var(--theme-foreground-fainter)")
    .attr("stroke-dasharray", "4,2");

// Draw centroids
svg.append("g")
    .selectAll("circle")
    .data(centroids)
    .join("circle")
    .attr("cx", d => xScale(d[0]))
    .attr("cy", d => yScale(d[1]))
    .attr("r", 8)
    .attr("fill", "none")
    .attr("stroke", (d, i) => color(i))
    .attr("stroke-width", 2.5);
```

4. **Elbow plot** (k vs. inertia) as a line chart for choosing k
5. **Silhouette plot** as horizontal bars grouped by cluster

### DBSCAN

**Input**: n data points, eps (neighborhood radius), minPts (density threshold)
**Output**: n cluster assignments (-1 for noise), point classifications
(core, border, noise)

**What it finds**: Dense regions of arbitrary shape. Points in sparse
regions are labeled as noise.

**How to visualize**:

1. **Core points**: full opacity, colored by cluster
2. **Border points**: reduced opacity (0.5), colored by cluster
3. **Noise points**: gray (#999), small radius, low opacity (0.3)
4. **Cluster boundaries**: convex hulls or alpha shapes around each cluster

```javascript
// Classify and render points
svg.selectAll("circle")
    .data(points)
    .join("circle")
    .attr("cx", d => xScale(d.x))
    .attr("cy", d => yScale(d.y))
    .attr("r", d => d.label === -1 ? 2 : 4)
    .attr("fill", d => d.label === -1
        ? "var(--theme-foreground-fainter)"
        : color(d.label))
    .attr("opacity", d => {
        if (d.label === -1) return 0.3;     // noise
        if (d.type === "border") return 0.6; // border
        return 1;                             // core
    });

// Convex hulls per cluster
const clusters = d3.group(points.filter(d => d.label !== -1), d => d.label);
svg.append("g")
    .selectAll("path")
    .data(clusters)
    .join("path")
    .attr("d", ([, pts]) => {
        const hull = d3.polygonHull(pts.map(d => [xScale(d.x), yScale(d.y)]));
        return hull ? `M${hull.join("L")}Z` : null;
    })
    .attr("fill", ([label]) => d3.color(color(label)).copy({opacity: 0.08}))
    .attr("stroke", ([label]) => color(label))
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,3");
```

5. **Epsilon visualization**: optional circle around a hovered point
   showing the eps neighborhood radius

### Hierarchical / Agglomerative Clustering

**Input**: n data points, linkage method, distance metric
**Output**: a dendrogram (binary merge tree) with merge heights

**What it finds**: A nested hierarchy of clusters at every possible
cut level. A horizontal cut at a given height produces k clusters.

**How to visualize as dendrogram**:

Use `d3.cluster()` for bottom-aligned leaves:

```javascript
// Convert linkage matrix to d3.hierarchy format
// (linkage matrix from scipy: [idx1, idx2, distance, count])
function linkageToHierarchy(Z, labels) {
    const n = labels.length;
    const nodes = labels.map((name, i) => ({ name, id: i }));
    Z.forEach(([a, b, dist, count], i) => {
        nodes.push({
            id: n + i,
            distance: dist,
            children: [nodes[a], nodes[b]]
        });
    });
    return nodes[nodes.length - 1];
}

const root = d3.hierarchy(treeData);
const layout = d3.cluster().size([width - 100, height - 100]);
layout(root);

// Y-axis encodes linkage distance (merge height)
const yScale = d3.scaleLinear()
    .domain([0, root.data.distance])
    .range([height - margin.bottom, margin.top]);

// Draw links as elbow connectors (standard dendrogram style)
svg.selectAll("path.link")
    .data(root.links())
    .join("path")
    .attr("class", "link")
    .attr("d", d => `
        M${d.source.x},${yScale(d.source.data.distance || 0)}
        V${yScale(d.target.data.distance || 0)}
        H${d.target.x}
    `)
    .attr("fill", "none")
    .attr("stroke", "var(--theme-foreground-faint)");
```

**Cut line**: A horizontal line at a specific merge height that shows
the resulting clusters. Everything below the line is one cluster;
branches that cross the line are separate clusters.

```javascript
// Interactive cut line
const cutLine = svg.append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("stroke", "var(--theme-foreground-muted)")
    .attr("stroke-dasharray", "6,3")
    .attr("stroke-width", 1.5);

// Drag to adjust cut height
svg.call(d3.drag()
    .on("drag", (event) => {
        const cutHeight = yScale.invert(event.y);
        cutLine.attr("y1", event.y).attr("y2", event.y);
        // Recolor branches by cluster assignment at this height
        colorByCut(root, cutHeight);
    }));
```

### Linkage Methods

| Method | Merge criterion | Visual character |
|---|---|---|
| Single | Min distance between any pair | Long chains, straggling |
| Complete | Max distance between any pair | Compact, spherical clusters |
| Average (UPGMA) | Mean pairwise distance | Balanced, moderate |
| Ward | Minimum variance increase | Even cluster sizes, most intuitive |

**Default to Ward** unless the user specifies otherwise. It produces the
dendrograms most people expect to see.

### Gaussian Mixture Models (GMM)

**Input**: n data points, k components, covariance type
**Output**: k means, k covariances, n soft assignments (probabilities)

**What it finds**: Overlapping elliptical distributions. Each point has
a probability of belonging to each cluster, not a hard assignment.

**How to visualize**:

1. **Points** colored by most likely cluster, opacity = max probability
2. **Ellipses** showing 1, 2, 3 sigma contours for each component
3. **Contour density** overlay showing the mixture probability surface

```javascript
// Draw confidence ellipses for each component
// (requires eigendecomposition of covariance matrix)
function confidenceEllipse(mean, cov, nStd, scale) {
    const [eigvals, eigvecs] = eigenDecompose2D(cov);
    const angle = Math.atan2(eigvecs[1][0], eigvecs[0][0]);
    const rx = nStd * Math.sqrt(eigvals[0]);
    const ry = nStd * Math.sqrt(eigvals[1]);
    return { cx: scale.x(mean[0]), cy: scale.y(mean[1]),
             rx: scale.x(rx) - scale.x(0),
             ry: scale.y(0) - scale.y(ry),
             angle: angle * 180 / Math.PI };
}
```

## Dimensionality Reduction for Visualization

When cluster data has > 2 dimensions, project to 2D first.

### t-SNE

Preserves local structure. Good for visualizing clusters that exist in
high-dimensional space. Non-deterministic without a fixed seed.

**Perplexity** is the key parameter (typical: 5 to 50). Lower perplexity
emphasizes local structure; higher emphasizes global.

**Caveats for D3 visualization**:
- Distances between clusters are NOT meaningful (only within-cluster structure is)
- Axis values are arbitrary (do not label axes)
- Run must converge (check KL divergence) or layout is misleading

### UMAP

Preserves both local and global structure better than t-SNE.
Faster for large datasets.

**n_neighbors** controls local vs global preservation.
**min_dist** controls how tightly points pack.

### PCA

Linear projection preserving maximum variance. Axes are meaningful
(principal components) and can be labeled with variance explained.

**Best for**: quick overview, feature importance, linear separability check.
**Not best for**: non-linear cluster shapes (use t-SNE/UMAP instead).

## Silhouette Analysis

Silhouette coefficients measure how well each point fits its cluster
vs. the nearest neighboring cluster. Range: -1 (wrong cluster) to
+1 (well-matched).

```javascript
// Horizontal bar chart, grouped by cluster
const groups = d3.group(
    data.sort((a, b) => a.cluster - b.cluster || b.silhouette - a.silhouette),
    d => d.cluster
);

let y = 0;
for (const [cluster, points] of groups) {
    svg.selectAll(null)
        .data(points)
        .join("rect")
        .attr("x", d => d.silhouette < 0 ? xScale(d.silhouette) : xScale(0))
        .attr("width", d => Math.abs(xScale(d.silhouette) - xScale(0)))
        .attr("y", (d, i) => y + i)
        .attr("height", 1)
        .attr("fill", color(cluster));
    y += points.length + 10;  // gap between clusters
}

// Average silhouette line
svg.append("line")
    .attr("x1", xScale(avgSilhouette))
    .attr("x2", xScale(avgSilhouette))
    .attr("y1", 0)
    .attr("y2", totalHeight)
    .attr("stroke", "var(--theme-foreground)")
    .attr("stroke-dasharray", "4,4");
```

## Client-Side Clustering in JavaScript

For small datasets (< 10,000 points), clustering can run in the browser.
For larger datasets, precompute in Python and pass results as JSON.

### Simple K-Means in JS

```javascript
function kmeans(data, k, maxIter = 100) {
    let centroids = data.slice(0, k).map(d => [...d]);
    let assignments = new Array(data.length);

    for (let iter = 0; iter < maxIter; iter++) {
        // Assign points to nearest centroid
        let changed = false;
        for (let i = 0; i < data.length; i++) {
            let minDist = Infinity, minJ = 0;
            for (let j = 0; j < k; j++) {
                const dist = euclidean(data[i], centroids[j]);
                if (dist < minDist) { minDist = dist; minJ = j; }
            }
            if (assignments[i] !== minJ) changed = true;
            assignments[i] = minJ;
        }
        if (!changed) break;

        // Update centroids
        for (let j = 0; j < k; j++) {
            const members = data.filter((_, i) => assignments[i] === j);
            if (members.length === 0) continue;
            centroids[j] = centroids[j].map((_, dim) =>
                d3.mean(members, d => d[dim])
            );
        }
    }
    return { centroids, assignments };
}

function euclidean(a, b) {
    return Math.sqrt(d3.sum(a.map((v, i) => (v - b[i]) ** 2)));
}
```

### Data Exchange with Python

When clustering runs in Python (scikit-learn), pass results to D3 as JSON:

```python
# Python side
import json
from sklearn.cluster import KMeans

km = KMeans(n_clusters=5, random_state=42).fit(X)
result = {
    "points": [{"x": float(x[0]), "y": float(x[1]), "cluster": int(c)}
               for x, c in zip(X, km.labels_)],
    "centroids": [{"x": float(c[0]), "y": float(c[1])}
                  for c in km.cluster_centers_]
}
with open("clusters.json", "w") as f:
    json.dump(result, f)
```

```javascript
// D3 side
const data = await d3.json("clusters.json");
// data.points has x, y, cluster
// data.centroids has x, y
```

For Observable Framework, use a Python data loader:
```python
# docs/data/clusters.json.py
# Framework runs this at build time
import json, sys
# ... clustering code ...
json.dump(result, sys.stdout)
```
