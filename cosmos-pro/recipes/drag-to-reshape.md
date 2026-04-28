# drag-to-reshape

Use cosmos.gl v2's point-dragging feature to let the user manually nudge
a cluster. Capture the resulting positions and write them back to
`Object.layer_positions` as a new user-defined layer. This is how
"the user can curate the layout" works without losing the ability to
return to algorithmic layouts.

## Minimal working code

```ts
import { Graph } from "@cosmos.gl/graph";

const graph = new Graph(canvas, {
  enableSimulation: true,
  enablePointDrag: true,         // v2 feature; verify in refs/cosmos-gl/
  simulationFriction: 0.85,
});

const dragHistory: Array<{ id: string; x: number; y: number }> = [];

graph.onPointDragStart = (pointIndex: number) => {
  // Optional: grow the dragged node visually
};

graph.onPointDragEnd = (pointIndex: number) => {
  const [id] = graph.getPointIdsByIndices([pointIndex]);
  if (!id) return;
  const positions = graph.getPointPositionsByIds([id]);
  dragHistory.push({ id, x: positions[0], y: positions[1] });
};

// "Save my layout" button writes dragHistory to a new layer
async function saveAsLayer(layerName: string) {
  await fetch("/api/v1/notebook/layers/", {
    method: "POST",
    body: JSON.stringify({
      name: layerName,
      positions: dragHistory,
    }),
  });
}
```

The new layer becomes available as a Position pick in the ControlDock.
Dragging is local and ephemeral until the user saves.

## Tuning notes

- Drag friction and snap are simulation parameters, not drag
  parameters. While dragging, the simulation is what makes nearby
  nodes give way. If the response feels rigid, lower
  `simulationFriction` temporarily on drag start, restore on drag end.
- Surface visual feedback on drag start (pulse the dragged node)
  and drag end (a subtle settle animation as the simulation
  reconciles). Otherwise the user wonders whether the drag did
  anything.
- Save layer naming defaults to `user_<timestamp>` but should be
  user-editable. Surface a "Name your layout" prompt before save.
- Saved layers are pinned (use `pinned-layer-positions.md` rules
  to render them). The simulation should not run on a saved layer
  unless the user explicitly enters drag-to-reshape on it again.

## When to use this

- The user wants to curate / annotate / explain a specific layout.
- The view is exploratory and the curated layout becomes a saveable
  artifact (e.g., "the layout I used in my essay").
- Reshape is intentional and infrequent — not a primary interaction.

## When NOT to use this

- Hovering is the primary interaction. Drag conflicts with hover and
  causes accidental reshapes.
- The graph is large (>10K points) and the user can only nudge a
  handful before the rest reflows in disorienting ways. Constrain to
  a focused subgraph first (use `selection-rectangle.md`).
- The simulation is disabled (`enableSimulation: false`). Drag works
  but the dragged node won't push neighbors out of the way. Either
  enable simulation or accept the static-feel behavior explicitly.
- The runtime project does not yet have a "save layer" backend
  endpoint. Reshape without persistence is just a fidget toy.
