---
name: cosmos-foundations
description: >-
  Canonical cosmos.gl v2 API and the mental model for it as a GPU force-simulation
  engine, not a generic graph library. Auto-loads when working with cosmos.gl.
  Trigger on: "cosmos.gl", "cosmosgl", "@cosmos.gl/graph", "force graph",
  "WebGL graph", "setPointPositions", "setLinks", "setConfig",
  "setConfigPartial", "setPointClusters", "simulationRepulsion", "Float32Array",
  "PointShape", "graph.destroy", "@cosmograph/react migration", or any
  question about cosmos.gl configuration, data contract, or event model.
version: 1.0.0
---

# cosmos.gl foundations

cosmos.gl is a GPU force-simulation engine. Treat it as such. Unlike D3 or
graphology, it does not maintain JavaScript objects per node; it owns
Float32Arrays and pushes them through WebGL. Almost every cosmos.gl bug is
either a Float32Array shape error, a config-vs-config-partial confusion, or
an init-only field being mutated after init.

Before answering any cosmos.gl API question, grep `refs/cosmos-gl/` and
verify the signature in source. Do not rely on training data — cosmos.gl v2
changed many APIs from v1.

## Data contract: Float32Arrays, not objects

Point positions are flat Float32Arrays interleaved as `[x1, y1, x2, y2, ...]`.
Links are flat Float32Arrays interleaved as
`[sourceIndex1, targetIndex1, sourceIndex2, targetIndex2, ...]`.

Invariants Claude MUST verify before any setter call:

```ts
console.assert(pointPositions.length === 2 * pointCount, "positions invariant");
console.assert(links.length === 2 * linkCount, "links invariant");
```

There are no objects, no ids, no domain keys at this layer. Mapping a
cosmos.gl `pointIndex` back to a domain id requires `getPointIdsByIndices`.
Ids only exist if they were registered via `setPointIds`.

## Primary data-update surface (v2)

These are the setters that move bytes into the engine. They REPLACE the v1
`setData` method.

| Setter | Float32Array shape | Purpose |
|---|---|---|
| `setPointPositions` | `[x1, y1, ...]`, length `2 * N` | Spatial layout |
| `setPointColors` | `[r1, g1, b1, a1, ...]`, length `4 * N` | Per-point color |
| `setPointSizes` | `[s1, s2, ...]`, length `N` | Per-point radius |
| `setPointShapes` | `[shapeCode1, ...]`, length `N` | Per-point glyph |
| `setLinks` | `[src1, tgt1, src2, tgt2, ...]`, length `2 * E` | Topology |
| `setLinkColors` | `[r1, g1, b1, a1, ...]`, length `4 * E` | Per-link color |
| `setLinkWidths` | `[w1, w2, ...]`, length `E` | Per-link width |
| `setPointIds` | `string[]`, length `N` | Domain ids for index resolution |
| `setPointClusters` | `[clusterIndex1, ...]`, length `N` | Cluster membership |
| `setClusterPositions` | `[cx1, cy1, ...]`, length `2 * C` | Cluster centers |

Always allocate Float32Arrays once per data-size bucket and mutate in place
with `.set()`. Allocating fresh arrays per frame is the single most common
cause of cosmos.gl jank.

## setConfig vs setConfigPartial — the most expensive bug

`setConfig` resets cosmos.gl to defaults and applies the given object on top.
`setConfigPartial` updates individual keys and leaves all other config alone.

Calling `setConfig` for a runtime update silently erases prior configuration:
forces revert to defaults, point shapes flip back, opacity rules disappear.
The bug is invisible because the rendering "works" — it just no longer
reflects the prior intent.

Rule: use `setConfig` exactly once per `Graph` lifetime, in the initial
construction. Use `setConfigPartial` for every subsequent update.

```ts
// Init
const graph = new Graph(canvas, {
  enableSimulation: true,
  initialZoomLevel: 1,
  randomSeed: 42,
  // ... full initial config
});

// Update (correct)
graph.setConfigPartial({ simulationRepulsion: 0.5 });

// Update (wrong — wipes everything else)
graph.setConfig({ simulationRepulsion: 0.5 });
```

## Init-only fields (cannot be changed after construction)

These fields can ONLY be set on the initial config. Changing them via either
`setConfig` or `setConfigPartial` is a no-op or a silent reset. To change
them, call `graph.destroy()` and construct a new `Graph`.

- `enableSimulation`
- `initialZoomLevel`
- `randomSeed`
- `attribution`

If a UI control needs to flip simulation on/off at runtime, the right
pattern is to keep `enableSimulation: true` and use
`setConfigPartial({ simulationFriction: 1.0 })` (max friction freezes
motion) rather than toggling the init field.

## Clustering forces

`setPointClusters` + `setClusterPositions` + `setPointClusterStrength` is
how upstream layer positions (SBERT UMAP, KGE UMAP, GeoGCN) get rendered as
visible clusters while the live force simulation still runs.

Pattern:

```ts
graph.setPointClusters(pointToClusterIndex);   // Float32Array, length N
graph.setClusterPositions(clusterCentersXY);   // Float32Array, length 2*C
graph.setConfigPartial({ pointClusterStrength: 0.7 });  // 0..1
```

`pointClusterStrength` 0 = ignore clusters, 1 = force points exactly to
their cluster centers. 0.5–0.7 is the typical sweet spot: clusters are
visually grouped but the force simulation still resolves overlap.

## Simulation physics — what each parameter does

Each parameter has a visible failure mode at the extremes. Read the source
in `refs/cosmos-gl/` for exact defaults; the qualitative effects:

| Parameter | Too low | Too high |
|---|---|---|
| `simulationRepulsion` | Nodes overlap | Nodes scatter, fly off |
| `simulationGravity` | Components drift apart | Graph collapses to center |
| `simulationFriction` | Oscillates forever | Frozen, no motion |
| `simulationLinkSpring` | Links slack | Links snap rigidly |
| `simulationLinkDistance` | Crowded | Sparse |
| `simulationCenter` | Off-center drift | Centered but flat |

Default approach: start from a recipe in `recipes/`. Tune by single-parameter
A/B against the recipe baseline.

## Point shapes

`pointDefaultShape` accepts the `PointShape` enum (`circle`, `square`,
`triangle`, `cross`, `diamond`, `star`, `pentagon`, `hexagon`). Per-point
shape is a Float32Array of numeric codes — read the enum-to-code mapping
from `refs/cosmos-gl/` rather than guessing.

## Event model: index-based, not object-based

Events deliver `pointIndex` (a number), not the original node object. To
resolve back to a domain id:

```ts
graph.onClick = (pointIndex) => {
  if (pointIndex == null) return;
  const [id] = graph.getPointIdsByIndices([pointIndex]);
  // id is the string registered via setPointIds, or undefined
};
```

`getPointIdsByIndices` is async-safe but synchronous; it just reads the
internal id table. Hover events can fire faster than any downstream fetch
the id triggers — see `recipes/hover-detail-panel.md` for the cancel
pattern.

## Lifecycle — graph.destroy() is mandatory

A cosmos.gl `Graph` allocates GPU resources that the JS GC cannot free.
Every component owning a `Graph` MUST call `graph.destroy()` in its effect
cleanup:

```ts
useEffect(() => {
  const graph = new Graph(canvasRef.current!, initialConfig);
  return () => graph.destroy();
}, []);
```

In React StrictMode (dev), components mount twice. Without `destroy()` the
first instance leaks, claims the canvas, and the second instance silently
no-ops or flickers. This is the most common "it works in prod but not in
dev" bug for cosmos.gl integrations.

Never construct a second `Graph` against a canvas that already has one. The
behavior is undefined.

## Migration: @cosmograph/react -> @cosmos.gl/graph

The `@cosmograph/react` package is a branded wrapper that bundles
proprietary glue and re-exports `Cosmograph`, `prepareCosmographData`, and
`CosmographRef`. It is not the open-source engine.

The contract for cosmos-pro (per N1): never import from `@cosmograph/react`
or `@cosmograph/cosmograph`. Use `@cosmos.gl/graph` directly. Imports look
like:

```ts
import { Graph, type GraphConfig } from "@cosmos.gl/graph";
```

`prepareCosmographData` does not exist in the open engine. Replace it with
the explicit Float32Array allocation pattern in `templates/CosmosGraphClient.ts`.

## VERIFY checks (run after any cosmos.gl config change)

V-foundations-1. `enableSimulation` is not toggled after init.
V-foundations-2. `pointPositions.length === 2 * pointCount` and
`links.length === 2 * linkCount` for every setter call.
V-foundations-3. `setConfig` appears at most once per `Graph` instance;
all subsequent updates use `setConfigPartial`.
V-foundations-4. No `@cosmograph/react` or `@cosmograph/cosmograph` imports
remain in the codebase.
V-foundations-5. Every `new Graph(...)` has a matching `graph.destroy()` in
the same effect's cleanup.

Run the checks by grepping the touched files. They are cheap and they catch
the bugs that are otherwise invisible until the user reports a regression.

## Where to look in refs/

- Engine entry: `refs/cosmos-gl/packages/graph/src/index.ts`
- Config interface: `refs/cosmos-gl/packages/graph/src/config.ts`
- PointShape enum: `refs/cosmos-gl/packages/graph/src/types/`

If `refs/cosmos-gl/` is empty, run `install.sh`. Do not invent an API from
memory.

## Anti-patterns (never do these)

- Never call `setData` (v1 API; gone in v2).
- Never pass JS objects to setters expecting Float32Arrays.
- Never call `setConfig` for a runtime update.
- Never mutate `enableSimulation` / `initialZoomLevel` / `randomSeed` /
  `attribution` after init.
- Never construct two `Graph` instances against the same canvas.
- Never skip `graph.destroy()` in cleanup.
- Never allocate a fresh Float32Array inside a per-frame loop.
- Never wrap cosmos.gl in `@cosmograph/react` to "make it React-ier."
  Write a native React component that owns the `Graph` lifecycle.
