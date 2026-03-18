# Hierarchical Linkage Methods

Reference for agglomerative clustering linkage criteria and their
impact on dendrogram shape.

## Linkage Matrix Format

Scipy's `linkage()` returns an (n-1) x 4 matrix Z where each row is:
`[idx1, idx2, distance, count]`

- idx1, idx2: indices of merged clusters (0..n-1 are original points, n+ are merged clusters)
- distance: merge distance (linkage height)
- count: number of points in the merged cluster

## Linkage Methods

### Single Linkage

**Distance**: min(all pairwise distances between clusters)

```
d(A, B) = min{ d(a, b) : a ∈ A, b ∈ B }
```

**Character**: Produces long, chaining dendrograms. Tends to merge
clusters incrementally one point at a time. Good for detecting
elongated or non-convex shapes.

**Visual signature**: Tall, narrow trees with many near-zero merges.

### Complete Linkage

**Distance**: max(all pairwise distances between clusters)

```
d(A, B) = max{ d(a, b) : a ∈ A, b ∈ B }
```

**Character**: Compact, spherical clusters. All points in a cluster
are within the merge distance of each other.

**Visual signature**: More balanced trees, clear separation between
clusters at different heights.

### Average Linkage (UPGMA)

**Distance**: mean of all pairwise distances between clusters

```
d(A, B) = (1 / |A||B|) Σ d(a, b)  for a ∈ A, b ∈ B
```

**Character**: Balanced between single and complete. Moderate cluster
shapes. Most commonly used in bioinformatics.

### Ward Linkage

**Distance**: increase in total within-cluster variance when merging

```
d(A, B) = √(2|A||B| / (|A|+|B|)) · ||c_A - c_B||
```

where c_A, c_B are cluster centroids.

**Character**: Produces the most visually intuitive dendrograms.
Even cluster sizes, compact shapes. Minimizes total within-cluster
variance at each step (like hierarchical k-means).

**Default choice** unless the user specifies otherwise.

## Converting Linkage to D3 Hierarchy

```javascript
function linkageToHierarchy(Z, labels) {
    const n = labels.length;
    const nodes = labels.map((name, i) => ({ name, id: i }));

    Z.forEach(([a, b, dist, count], i) => {
        nodes.push({
            id: n + i,
            distance: dist,
            count: count,
            children: [nodes[Math.round(a)], nodes[Math.round(b)]]
        });
    });

    return nodes[nodes.length - 1];  // root
}

// Then: d3.hierarchy(linkageToHierarchy(Z, labels))
```

## Dendrogram Y-Axis

The y-axis of a dendrogram should encode the actual merge distance,
not the depth in the tree. This is critical for accurate interpretation.

```javascript
const yScale = d3.scaleLinear()
    .domain([0, root.data.distance])
    .range([height - margin.bottom, margin.top]);
```

Leaf nodes have distance 0 (or undefined) and sit at the bottom.

## Cophenetic Distance

The cophenetic distance between two points is the height at which they
first merge in the dendrogram. A good clustering has cophenetic distances
that correlate with the original pairwise distances.

**Cophenetic correlation coefficient** ≥ 0.7 indicates a good fit.

## Optimal Leaf Ordering

Default leaf order in a dendrogram is arbitrary (within tree constraints).
Optimal leaf ordering minimizes the sum of adjacent leaf distances,
making the dendrogram easier to read.

scipy: `optimal_leaf_ordering(Z, distances)` or `dendrogram(Z, optimal_ordering=True)`
