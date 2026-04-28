---
name: cosmos-scene-directive
description: >-
  Translation layer between Theseus's TF.js-driven scene intelligence and
  cosmos.gl's config surface. Owns the SceneDirective contract, the
  applyDirective adapter, the construction phasing (Galaxy, Filter, Build,
  Crystallize, Explore), and the pending-state visual for missing layer data.
  Trigger on: "SceneDirective", "applyDirective", "scene intelligence",
  "construction phase", "Galaxy view", "Crystallize", "active_position_layer",
  "active_weight_layer", "active_edge_layers", "focus_node_ids",
  "highlight_node_ids", "pending state", or any work that translates a
  Theseus directive into cosmos.gl setter calls.
version: 1.0.0
---

# SceneDirective adapter

cosmos.gl never decides what to show. Theseus's TF.js scene intelligence
decides — it produces a `SceneDirective`, and cosmos-pro renders it
faithfully. This is the entire operational meaning of "novel ideas
translate to images" in this system: an upstream module emits a directive,
the adapter reads it, and the right cosmos.gl setters fire.

The contract lives in `refs/theseus-viz-types/SceneDirective.ts`, synced
from `<runtime project>/src/lib/theseus-viz/SceneDirective.ts`. If the
contract drifts, the adapter must move with it. Always read the synced
file before implementing or modifying adapter behavior — do not paraphrase
field names or guess defaults.

## SceneDirective fields (high level)

The directive is the union of: which nodes, which layers, which camera,
which phase, which annotations.

| Field | Meaning |
|---|---|
| `focus_node_ids` | Nodes to ease the camera onto and visually privilege |
| `highlight_node_ids` | Nodes to emphasize (color/size boost) |
| `dim_node_ids` | Nodes to de-emphasize (lower opacity) |
| `active_position_layer` | Which `layer_positions[*]` to render |
| `active_weight_layer` | Which `layer_weights[*]` drives size/color |
| `active_edge_layers` | Which edge sets to draw (multi-select) |
| `camera_target` | World-space center for the camera |
| `camera_zoom` | Zoom level after transition |
| `construction_phase` | One of Galaxy / Filter / Build / Crystallize / Explore |
| `annotations` | Optional callouts, badges, threshold lines |

Read `refs/theseus-viz-types/SceneDirective.ts` for the exact field types,
optionals, and any newer fields not listed here. The adapter must handle
every defined field; missing handlers are a contract violation.

## applyDirective(graph, directive, data) — the adapter

`applyDirective` is the single entry point. UI components never call
cosmos.gl setters directly (M6); they hand a directive to the adapter,
the adapter reads `data` (point/link rows from DuckDB) and the directive,
and issues the right sequence of setters.

Skeleton (full version in `templates/applyDirective.ts`):

```ts
export function applyDirective(
  graph: Graph,
  directive: SceneDirective,
  data: GraphSnapshot,
): void {
  // 1. Validate: every directive field has a handler in this function.
  // 2. Branch by construction_phase. Each phase has its own setter sequence.
  // 3. Within each phase, resolve active layers and assemble Float32Arrays.
  // 4. Detect pending points (missing active layer data); apply pending visual.
  // 5. Issue setters in order: positions -> shapes -> sizes -> colors -> links.
  // 6. Camera transition last, via an interpolator.
}
```

Order of setter calls matters. Positions before colors means the GPU
doesn't render a frame with stale positions and new colors. Camera last
means the user sees the layout settle before the camera moves to it.

## Construction phasing

Each phase has its own cosmos.gl state. The adapter has one code path per
phase. The five phases:

### Galaxy
All points visible, low opacity, simulation running gently, no filter.

```ts
graph.setConfigPartial({
  simulationFriction: 0.85,
  simulationGravity: 0.05,
  pointGreyoutOpacity: 0.4,
});
graph.setPointColors(allPointsLowAlpha);
graph.setLinkColors(allLinksLowAlpha);
```

The "starting universe." User sees scope. No commitment to a particular
filter yet.

### Filter
`setPointColors` reduces opacity on non-relevant points and boosts
relevant ones; links dim to near-invisible.

```ts
graph.setPointColors(filterEmphasisColors);   // relevant: full alpha
                                              // others: 0.15 alpha
graph.setLinkColors(linksAtAlpha(0.05));
graph.setConfigPartial({ pointGreyoutOpacity: 0.15 });
```

The user sees what survived the filter without losing the surrounding
context.

### Build
Filtered subgraph fetched; `setPointPositions` updates to just the
relevant nodes; edges set to the active edge layer; `fitViewOfPoints`
on the new subgraph.

```ts
graph.setPointPositions(subgraphPositions);
graph.setLinks(subgraphLinks);
graph.setLinkColors(activeEdgeLayerColors);
graph.fitViewOfPoints(focusNodeIds, { duration: 600 });
```

The model becomes specific. Camera transitions to the subgraph extent.

### Crystallize
Simulation damped via `setConfigPartial({ simulationFriction: 0.3 })`;
labels appear; `onSimulationEnd` triggers the text-panel reveal.

```ts
graph.setConfigPartial({ simulationFriction: 0.3 });
graph.onSimulationEnd = () => {
  // emit "answer-ready" event for the text-panel layer
};
showLabelsForTopK(focusNodeIds, K = 8);
```

The answer holds still. Labels become readable. The text panel can join.

### Explore
Simulation held. User interactions (click, drag, rectangle-select) feed
back into new SceneDirectives via the upstream module.

```ts
graph.setConfigPartial({ simulationFriction: 1.0 });   // fully damped
graph.onClick = (idx) => emitInteraction(idx, "click");
graph.onPointDrag = (idx, dx, dy) => emitInteraction(idx, "drag", { dx, dy });
```

The adapter does not generate new directives; it surfaces interactions
upstream.

## Pending state — never drop points (M7)

If `active_position_layer` is "sbert_umap_v3" but some points don't have
`layer_positions["sbert_umap_v3"]`, the adapter MUST NOT silently drop
them. It MUST render them in the pending visual:

- Position: their cluster center (use `setPointClusters` for the cluster
  index, fall back to graph centroid if no cluster).
- Color: desaturated (e.g., `rgba(160, 160, 160, 0.4)`).
- Size: 0.6× of the active size.
- Shape: hollow circle (or whatever the design system has tokenized as
  "pending").

The pending state communicates "we have this node but not in this layer
yet." It is honest. Dropping silently means the user sees a smaller graph
than they expect and never learns why.

## Cross-plugin contract

cosmos-pro renders directives. It does not:
- Decide what to show (TF.js / scene intelligence does).
- Decide what colors to use (vie-design tokens do — pull via CSS variables).
- Decide what construction sequence to use for a given answer type
  (vie-design's design judgment does — but the directive carries the
  decision in `construction_phase`, and cosmos-pro implements it).

If the adapter receives an unfulfillable directive (e.g., active layer
doesn't exist at all in the data), it MUST log a structured error and
fall through to a safe state (Galaxy phase with pending visual on
everything), not throw a render-killing exception.

## Adding a new directive field

When the SceneDirective contract grows a new field:

1. Sync `refs/theseus-viz-types/SceneDirective.ts` from the runtime
   project. The plugin does not invent fields; the runtime owns the
   contract.
2. Add a handler in `applyDirective`. Pick the phase(s) the field
   participates in.
3. Add a VERIFY check that the field has a handler.
4. Add a recipe in `recipes/` if the field unlocks a new pattern.
5. Update the cosmos-design chat skill's `references/construction-phases.md`
   if the field changes the visual language.

Skipping any of these steps creates a silent contract drift.

## VERIFY checks

V-directive-1. Every field in `refs/theseus-viz-types/SceneDirective.ts`
has a handler in `applyDirective`.
V-directive-2. The adapter reads no data outside what `data: GraphSnapshot`
provides. It does not call `fetch`, does not touch DuckDB directly, does
not read from React state.
V-directive-3. UI components do not call cosmos.gl setters directly. Grep
for `setPointPositions`, `setLinks`, `setConfigPartial` in
`src/components/theseus/explorer/` — they should appear only inside the
adapter or its tests.
V-directive-4. The pending visual fires for any point missing
`layer_positions[directive.active_position_layer]`.
V-directive-5. Setter call order in each phase is positions -> shapes ->
sizes -> colors -> links -> camera.

## Where to look in refs/

- The contract: `refs/theseus-viz-types/SceneDirective.ts`
- cosmos.gl camera API: `refs/cosmos-gl/packages/graph/src/camera/`
- cosmos.gl setter signatures: grep `refs/cosmos-gl/` for `setPoint`
  and `setLink`

## Anti-patterns

- Never call cosmos.gl setters from a UI component. Always go through
  `applyDirective`.
- Never drop points missing active-layer data. Always pending-state them.
- Never throw from `applyDirective` on an unfulfillable directive. Log
  and fall back to Galaxy with full pending visual.
- Never invent SceneDirective fields. Sync from the runtime contract.
- Never reorder the setter sequence within a phase. The order matters
  for visual stability.
