# Spatial Indexing

Reference for spatial data structures used in D3 for collision detection,
nearest-neighbor search, and efficient rendering.

## Quadtree

D3's `d3.quadtree` recursively subdivides 2D space into four quadrants.
Used internally by `forceManyBody` (Barnes-Hut) and `forceCollide`.

### Basic Usage

```javascript
const quadtree = d3.quadtree()
    .x(d => d.x)
    .y(d => d.y)
    .addAll(points);

// Find nearest point to (mx, my) within radius 20
const nearest = quadtree.find(mx, my, 20);
```

### Hit Testing on Canvas

When rendering to canvas, SVG event handlers don't work. Use quadtree
for mouse interaction:

```javascript
canvas.on("mousemove", (event) => {
    const [mx, my] = d3.pointer(event);
    const hit = quadtree.find(mx, my, 20);
    if (hit) highlightNode(hit);
});
```

### Custom Traversal

`quadtree.visit()` traverses the tree, calling a function for each node.
Return `true` to skip a subtree (pruning).

```javascript
// Find all points within a rectangle
const results = [];
quadtree.visit((node, x0, y0, x1, y1) => {
    if (!node.length) {  // leaf node
        let d = node.data;
        if (d.x >= rx0 && d.x <= rx1 && d.y >= ry0 && d.y <= ry1) {
            results.push(d);
        }
    }
    // Prune if rectangle doesn't overlap this quadrant
    return x0 > rx1 || x1 < rx0 || y0 > ry1 || y1 < ry0;
});
```

## Delaunay Triangulation

`d3.Delaunay` computes the Delaunay triangulation of a set of points.
Each triangle's circumscribed circle contains no other points.

### Voronoi Diagram

The dual of Delaunay triangulation. Each cell contains all points
closer to its site than to any other site.

```javascript
const delaunay = d3.Delaunay.from(
    points,
    d => xScale(d.x),
    d => yScale(d.y)
);
const voronoi = delaunay.voronoi([0, 0, width, height]);

// Draw cells
svg.selectAll("path")
    .data(points)
    .join("path")
    .attr("d", (d, i) => voronoi.renderCell(i))
    .attr("fill", "none")
    .attr("stroke", "#ccc");
```

### Nearest Neighbor via Delaunay

Faster than quadtree for finding the closest point:

```javascript
const i = delaunay.find(mx, my);  // index of closest point
```

### Voronoi for Hover Targets

In dense scatter plots, direct hover on small circles is difficult.
Use Voronoi cells as invisible hover targets:

```javascript
svg.selectAll("path.voronoi")
    .data(points)
    .join("path")
    .attr("d", (d, i) => voronoi.renderCell(i))
    .attr("fill", "transparent")
    .on("mouseover", (event, d) => highlight(d))
    .on("mouseout", () => unhighlight());
```

## R-Tree

Not built into D3, but useful for range queries on rectangles
(e.g., finding which map features contain a point).

Available via `rbush` (npm). Used in geographic visualizations
and treemap interaction.

## Octree (3D)

Extension of quadtree to 3 dimensions. Used by `d3-force-3d` for
Barnes-Hut approximation in 3D force simulations.

## Performance Characteristics

| Structure | Build | Point Query | Range Query | Space |
|---|---|---|---|---|
| Quadtree | O(n log n) | O(log n) | O(√n + k) | O(n) |
| Delaunay | O(n log n) | O(1) amortized | O(k) | O(n) |
| R-Tree | O(n log n) | O(log n) | O(log n + k) | O(n) |

k = number of results returned.

## When to Use What

| Task | Structure |
|---|---|
| Force simulation collision | Quadtree (built-in) |
| Canvas hit testing | Quadtree.find() or simulation.find() |
| Nearest point in scatter | Delaunay.find() |
| Invisible hover targets | Voronoi cells |
| Decision boundaries (k-means) | Voronoi from centroids |
| Range selection | Quadtree.visit() with bounds check |
