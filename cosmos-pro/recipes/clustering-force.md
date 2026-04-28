# clustering-force

Combine user-provided cluster centers (typically from Leiden community
detection) with a live force simulation, so points are visually grouped
near their cluster center but the simulation still resolves local
overlap and link tension. This is how "SBERT-position + Leiden-cluster"
views work without the two layers fighting.

## Minimal working code

```ts
const graph = new Graph(canvas, {
  enableSimulation: true,
  initialZoomLevel: 1,
  simulationRepulsion: 0.3,
  simulationGravity: 0.0,        // gravity comes FROM clusters, not center
  simulationFriction: 0.85,
  simulationLinkSpring: 0.5,
  simulationLinkDistance: 8,
});

// Initial positions can be the SBERT embedding (preferred) or random.
graph.setPointPositions(initialPositions);
graph.setLinks(links);

// Cluster wiring.
graph.setPointClusters(pointToClusterIndex);   // length N
graph.setClusterPositions(clusterCentersXY);   // length 2 * C

// pointClusterStrength is the lever:
//   0    = ignore clusters entirely
//   0.5  = visible grouping but simulation can override
//   0.7  = tight grouping; this is the typical Theseus default
//   1.0  = forces points exactly to cluster centers (no simulation freedom)
graph.setConfigPartial({ pointClusterStrength: 0.7 });
```

## Tuning notes

- Cluster strength 0.7 is the Theseus default for Leiden + SBERT views.
  It produces visible groupings while letting the simulation find good
  local layouts inside each cluster.
- If clusters look like solid disks with no internal structure, the
  strength is too high. Drop to 0.5.
- If clusters look invisible (points scattered uniformly), the strength
  is too low or `simulationRepulsion` is too high relative to it.
- The cluster centers are static for the lifetime of the layer — if
  the upstream computes new centers, swap the layer rather than
  animating between them.
- Cluster index is per-point; a point cannot belong to multiple
  clusters at once. For overlapping community membership, render
  multiple views or use color encoding instead.

## When to use this

- The user has both an embedding layout (SBERT, KGE) AND a clustering
  result (Leiden, HDBSCAN) and wants both visible at once.
- Cluster boundaries should be perceivable but the simulation should
  still reconcile link tension and local overlap.
- The view is the default "galaxy + community" exploration mode in
  Theseus.

## When NOT to use this

- The clusters are the only signal and there is no embedding layout —
  use `pinned-layer-positions.md` with cluster centers as the positions.
- The user is asking about relevance ranking rather than community
  structure — use the relevance composition (PageRank weight, structural
  edges) from `mixed-position-weight-edges.md` instead.
- Cluster count is very high (>50) and per-point cluster encoding
  becomes visual noise — switch to a hierarchical clustering rendering
  (treemap or sunburst owned by d3-pro).
