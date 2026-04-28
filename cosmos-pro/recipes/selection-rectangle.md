# selection-rectangle

Rectangle-select a subgraph for the "these nodes, expand their
neighborhood" workflow. The user drags a box over the graph, releases,
and a follow-up SceneDirective Build phase loads the neighborhood.

## Minimal working code

```ts
import { Graph } from "@cosmos.gl/graph";

const graph = new Graph(canvas, {
  enableSimulation: true,
  enableRectangleSelection: true,   // v2 feature; verify in refs/cosmos-gl/
});

graph.onRectangleSelectionEnd = (selectedIndices: number[]) => {
  if (selectedIndices.length === 0) return;
  const ids = graph.getPointIdsByIndices(selectedIndices);
  // Emit upstream so the scene intelligence can build a directive
  // for the neighborhood.
  window.dispatchEvent(
    new CustomEvent("cosmos:rectangle-selection", { detail: { ids } }),
  );
};
```

The handler does NOT mutate the graph. It surfaces the selection
upstream, the scene intelligence module produces a new SceneDirective
("focus + Build phase + active edge layer = structural"), and the
adapter applies it.

## Tuning notes

- Rectangle selection conflicts with pan-on-drag. Pick one as the
  default gesture; expose the other via modifier (e.g., shift+drag for
  rectangle).
- Visual feedback during drag matters. A semi-transparent rectangle
  outline that follows the cursor confirms the gesture.
- Selection across phases: a selection captured in Galaxy phase should
  trigger a Build phase. A selection in Explore phase might just
  highlight without rebuilding (depending on UX intent).
- For very dense graphs, rectangle selection can capture thousands of
  nodes. Cap visually (e.g., "1000+ selected") rather than freezing
  the page when computing the neighborhood.
- Empty rectangle (zero selection) should be a no-op, not an error.

## When to use this

- The user wants to express "I'm interested in this region of the
  layout."
- The follow-up action is a neighborhood expansion or a focused
  Build phase.
- The graph layout is meaningful enough that a region corresponds to
  a coherent subgroup (clusters, embedding regions).

## When NOT to use this

- The layout is random or unstable; a region doesn't mean anything.
- The intended interaction is per-node click. Rectangle conflicts.
- The graph is small enough that the user could just click each node
  directly.
- The view is a histogram-driven filter view rather than an
  exploratory graph view. Use the histogram brush.
