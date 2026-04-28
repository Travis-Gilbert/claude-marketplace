# pinned-layer-positions

Render points at positions computed upstream (SBERT UMAP, KGE UMAP,
GeoGCN, anything stored in `Object.layer_positions[layerName]`) and
keep them pinned. The simulation either does not run, or runs with very
low repulsion to nudge overlap without disturbing the pinned shape.

## Minimal working code

Disabling simulation entirely is the simplest case:

```ts
const graph = new Graph(canvas, {
  enableSimulation: false,    // init-only; cannot be flipped later
  initialZoomLevel: 1,
  randomSeed: 42,
});

// positions come from Object.layer_positions["sbert_umap_v3"]
graph.setPointPositions(layerPositions);
graph.setLinks(links);
```

Running the simulation gently to resolve overlap while preserving the
shape:

```ts
const graph = new Graph(canvas, {
  enableSimulation: true,
  simulationRepulsion: 0.05,    // very low — only push overlap apart
  simulationGravity: 0.0,       // no pull to center; positions are truth
  simulationFriction: 0.95,     // nearly frozen
  simulationLinkSpring: 0.0,    // links should not pull positions
  simulationLinkDistance: 0,
});

graph.setPointPositions(layerPositions);
graph.setLinks(links);
```

## Tuning notes

`enableSimulation: false` vs gentle simulation:

- `false` is faster, fully deterministic, and the right choice when the
  upstream layer is high quality and points should never move.
- Gentle simulation is correct when the upstream layer has slight
  overlaps you want resolved, or when you plan to run interactive
  re-layouts (drag-to-reshape).

If you start with `enableSimulation: false` and later need motion, the
`Graph` must be destroyed and recreated — `enableSimulation` is
init-only.

## When to use this

- Upstream layer positions exist and are the truth (SBERT UMAP,
  KGE UMAP, GeoGCN, custom Leiden-on-spectral-projection).
- The goal is to show the user "this is what the embedding model
  thinks." The visual must reflect the algorithm output, not a fresh
  force-directed layout.
- The view is a galaxy snapshot or a static answer image.

## When NOT to use this

- The active layer is something the user is allowed to reshape by
  dragging — combine with `drag-to-reshape.md` and run the simulation.
- You want both an embedding layout AND visible cluster boundaries
  from a separate algorithm — use `clustering-force.md` to combine
  the two without fighting them.
- The position data is missing for some points — combine with
  pending-state visual rules from `cosmos-scene-directive` skill.
  Never drop points (M7).
