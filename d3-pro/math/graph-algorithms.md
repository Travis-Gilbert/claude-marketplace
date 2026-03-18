# Graph Algorithms

Reference for network analysis algorithms and their D3 visualization implications.

## Community Detection

### Louvain Method

**What it finds**: Dense groups of nodes (communities) by optimizing modularity.

**Modularity** Q measures how much more connected the network is within
communities than expected by random chance. Range: -0.5 to 1.0.
Values > 0.3 indicate significant community structure.

**Algorithm**:
1. Start with each node as its own community
2. Move nodes to neighboring community that maximizes modularity gain
3. Aggregate communities into super-nodes
4. Repeat on the coarsened graph

**D3 visualization**: Color nodes by community assignment. Use
`d3.schemeObservable10` for ≤10 communities.

### Girvan-Newman

**What it finds**: Communities by iteratively removing highest-betweenness edges.

**Slower but interpretable**: The removed edges show exactly which
connections separate communities.

**D3 visualization**: Animate edge removal. Color links by removal
order (early = between communities, late = within).

## Centrality Measures

| Measure | What It Finds | Visual Encoding |
|---|---|---|
| Degree | Most connected | Node size |
| Betweenness | Bridges between groups | Node size or color intensity |
| Closeness | Most central (shortest paths) | Node position (closer to center) |
| Eigenvector | Connected to important nodes | Node size |
| PageRank | Importance (directed graphs) | Node size |

### Degree Centrality

```javascript
// Compute degree
const degree = new Map();
links.forEach(l => {
    degree.set(l.source, (degree.get(l.source) || 0) + 1);
    degree.set(l.target, (degree.get(l.target) || 0) + 1);
});

// Map to node radius
const rScale = d3.scaleSqrt()
    .domain([0, d3.max(degree.values())])
    .range([3, 20]);

node.attr("r", d => rScale(degree.get(d.id) || 0));
```

### Betweenness Centrality

Number of shortest paths passing through a node, normalized.
High betweenness = node is a bridge between clusters.

**D3 visualization**: Size nodes by betweenness. Bridges appear as
large nodes between clusters in a force layout.

## Shortest Paths

### Dijkstra's Algorithm

For weighted graphs. Finds shortest path from source to all other nodes.

**D3 visualization**: Highlight the shortest path between two nodes.
Animate path discovery from source outward.

### BFS (Breadth-First Search)

For unweighted graphs. Each step explores one hop further.

**D3 visualization**: Color nodes by distance from source.
Animate wavefront expansion.

## Graph Properties

| Property | Formula | What It Means |
|---|---|---|
| Density | 2m / n(n-1) | Fraction of possible edges present |
| Diameter | max shortest path | Longest distance between any two nodes |
| Clustering coefficient | triangles / triplets | Local clustering tendency |
| Average path length | mean shortest path | How "small-world" the network is |
| Degree distribution | P(k) | Shape reveals network type (random, scale-free, etc.) |

## Graph Types and Force Tuning

| Graph Type | Characteristic | Force Tuning |
|---|---|---|
| Random (Erdős-Rényi) | Even degree distribution | Default params work well |
| Scale-free (Barabási-Albert) | Few hubs, many leaves | Increase manyBody strength, highlight hubs |
| Small-world (Watts-Strogatz) | High clustering, short paths | Default params, emphasize clusters |
| Bipartite | Two node types | Use forceY to separate types vertically |
| Directed | Asymmetric links | Arrow markers, forceX for flow direction |

## Bipartite Layout

For two-node-type networks, separate types on different axes:

```javascript
simulation
    .force("x", d3.forceX(d => d.type === "A" ? width * 0.25 : width * 0.75).strength(0.5))
    .force("y", d3.forceY(height / 2).strength(0.1))
    .force("collide", d3.forceCollide(8));
```

## Directed Graph Arrows

```javascript
svg.append("defs").selectAll("marker")
    .data(["arrow"])
    .join("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#999");

link.attr("marker-end", "url(#arrow)");
```
