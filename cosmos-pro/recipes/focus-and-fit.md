# focus-and-fit

`fitViewOfPoints([ids])` + `zoomToPointByIndex` + camera ease-in. The
SceneDirective focus mechanism lands here. When a directive's
`focus_node_ids` change, the camera transitions smoothly to frame the
focused subgraph.

## Minimal working code

```ts
import { Graph } from "@cosmos.gl/graph";

// In the applyDirective adapter, Build phase:
function fitToFocus(graph: Graph, focusIds: string[]) {
  if (focusIds.length === 0) return;
  if (focusIds.length === 1) {
    // Single focus: center on the node and zoom in.
    graph.zoomToPointById(focusIds[0], { duration: 600, zoomLevel: 4 });
    return;
  }
  // Multiple focus: fit the bounding box with padding.
  graph.fitViewOfPoints(focusIds, {
    duration: 600,
    paddingFactor: 1.2,
  });
}
```

The exact method signatures must be verified against `refs/cosmos-gl/`.
Some methods are camera-async (return a promise) and some are
camera-sync; the adapter must handle both.

## Tuning notes

- 600ms is the Theseus default ease duration. Faster feels jumpy;
  slower (>1000ms) tests user patience.
- Padding factor 1.2 leaves visible context around the focus. Drop to
  1.0 for tight framing, raise to 1.5 for "answer in context."
- Zoom level 4 for single-node focus is a starting point; tune by
  data density.
- Avoid chaining focus transitions. If a new directive arrives while
  the camera is mid-transition, cancel the old transition and start
  the new one fresh (cosmos.gl v2 supports this; verify).
- Don't ease the camera during phase transitions that already animate
  the data (e.g., Filter -> Build): the user's eye will lose track.
  Either animate one or the other.

## When to use this

- A SceneDirective has non-empty `focus_node_ids` and the user expects
  the camera to follow.
- After a click-to-focus interaction.
- After a rectangle-select that produced a focused subgraph.

## When NOT to use this

- The graph is currently in Galaxy phase (showing the whole universe).
  Don't fit to focus until the directive transitions to Build.
- The focus is a single node and the user is currently mid-drag on
  another node. The drag would be interrupted.
- The user just performed a manual zoom or pan. Respect the manual
  view; resume auto-fit on the next directive change.
