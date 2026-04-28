---
name: cosmos-performance
description: >-
  How to keep cosmos.gl smooth at 50K+ points: Float32Array reuse, batched
  setter calls, label budgeting, simulation warmup, GPU memory budget,
  capability detection (iOS EXT_float_blend, Android OES_texture_float),
  and instance lifecycle. Most cosmos.gl bugs are performance bugs dressed
  as visual bugs. Trigger on: "cosmos.gl performance", "janky animation",
  "missing nodes", "flashing colors", "Float32Array reuse", "label
  performance", "GPU memory", "graph.destroy", "WebGL fallback",
  "iOS Safari graph", "Android low-end graph", or any cosmos.gl perf
  question.
version: 1.0.0
---

# cosmos.gl performance

The diagnostic rule: most cosmos.gl bugs are performance bugs dressed as
visual bugs.

- Janky animation -> GC pressure (reallocating Float32Arrays).
- Missing nodes -> Float32Array length mismatch with point count.
- Flashing colors -> `setConfig` called instead of `setConfigPartial`.
- Frozen scene -> simulation friction at 1.0 with `enableSimulation` left on.
- Crashes on iOS -> EXT_float_blend regression or capability not detected.

When a cosmos.gl integration "feels off," start here before reaching for
visual changes.

## Float32Array discipline (the biggest lever)

Allocate once per data-size bucket, mutate in place. Allocating fresh
`Float32Array` instances inside per-frame loops is the single most common
source of jank, because each allocation pressures the GC and cosmos.gl
interleaves rendering with GC pauses.

Wrong:

```ts
function onFilterChange(rows) {
  // Allocates a new Float32Array every time the filter moves
  const positions = new Float32Array(rows.length * 2);
  rows.forEach((r, i) => {
    positions[i * 2] = r.x;
    positions[i * 2 + 1] = r.y;
  });
  graph.setPointPositions(positions);
}
```

Right:

```ts
class PositionsBuffer {
  private buffer = new Float32Array(0);
  ensure(size: number) {
    if (this.buffer.length < size * 2) {
      // grow geometrically; common bucket sizes 1K, 10K, 100K
      const next = nextBucket(size * 2);
      this.buffer = new Float32Array(next);
    }
    return this.buffer.subarray(0, size * 2);
  }
}

function onFilterChange(rows) {
  const positions = positionsBuffer.ensure(rows.length);
  for (let i = 0; i < rows.length; i++) {
    positions[i * 2] = rows[i].x;
    positions[i * 2 + 1] = rows[i].y;
  }
  graph.setPointPositions(positions);
}
```

The buffer grows only when crossing a size bucket. The hot path mutates a
slice of the buffer with no allocation.

## Batching: one setter call beats N

A single `setPointColors(wholeArray)` is cheap. 50K individual
color-by-index mutations are catastrophic — each one notifies the GPU and
triggers a buffer upload.

If filter changes touch a small subset of indices, still batch:

```ts
// Build a delta array, apply it once
for (const idx of changedIndices) {
  const off = idx * 4;
  colors[off] = newR; colors[off+1] = newG; colors[off+2] = newB; colors[off+3] = newA;
}
graph.setPointColors(colors);
```

One `setPointColors` per visible interaction, never one per index.

## Label rendering — the silent killer

cosmos.gl draws point labels via a separate HTML overlay layer (DOM
elements positioned by world-to-screen projection). DOM scales O(N).
5K labels chugs; 50K labels destroys the page.

Pattern: render labels for the top-K visible points by zoom level and
importance. Re-evaluate which K to show on zoom and on filter change, not
on every frame.

```ts
function selectVisibleLabels(zoom: number, k: number): string[] {
  if (zoom < 1.5) return [];                    // overview: no labels
  if (zoom < 3.0) return topKByPageRank(k);     // medium: K by importance
  return visibleByImportance(k * 2);            // detail: 2K by importance
}
```

Hard cap from N4: never render more than 5000 labels simultaneously. If
the design wants every-node labels, the design must adapt — see the
"IF CONFLICT" rule in `CLAUDE.md`.

## Simulation warmup

Run the simulation hot for ~200 ticks on data load (alpha = 1.0, low
friction), then drop to friction 0.85 for interactive exploration. The
`alpha` lever:

```ts
graph.setConfigPartial({
  simulationAlpha: 1.0,
  simulationFriction: 0.5,
});

// after warmup window (e.g., setTimeout 1500ms or onSimulationEnd):
graph.setConfigPartial({
  simulationFriction: 0.85,
});
```

Without warmup, the user watches the layout slowly find itself over the
first 5+ seconds of interaction. With warmup, the layout settles before
the user starts brushing histograms.

## GPU memory budget — one Graph per canvas (N3)

A cosmos.gl `Graph` allocates GPU resources. Two `Graph` instances against
one canvas means leaked allocations and undefined behavior. Two `Graph`
instances on one page (different canvases) is fine but doubles VRAM
budget — usually only the most-recent rendered graph matters; destroy the
old ones eagerly.

The lifecycle pattern:

```ts
useEffect(() => {
  const graph = new Graph(canvasRef.current!, initialConfig);
  graphRef.current = graph;
  return () => {
    graph.destroy();
    graphRef.current = null;
  };
}, []);
```

In React StrictMode (dev), components mount twice. Without `destroy()`,
the first instance leaks, claims the canvas, and the second instance
silently no-ops or flickers. This is "works in prod, broken in dev" for
cosmos.gl. Always test in StrictMode.

For hot-reload paths: dispose all `Graph` instances on module reload. If
the dev server keeps the page alive across edits, the leak compounds
until the GPU runs out of buffer slots.

## Capability detection

Check WebGL capabilities on page load. Two known regressions to handle:

- **iOS Safari EXT_float_blend regression** — historically broken on iOS
  15.4, since resolved. Detect by trying to enable the extension and
  checking the result. If unavailable, fall back to Sigma 2D.
- **Android devices without OES_texture_float** — common on low-end
  Android. Same fallback.

```ts
function canRunCosmos(): boolean {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) return false;
  if (!gl.getExtension("EXT_float_blend")) return false;
  if (!gl.getExtension("OES_texture_float")) return false;
  return true;
}
```

If `canRunCosmos()` returns false, mount the Sigma 2D fallback component
instead of `CosmosGraphCanvas`. See `recipes/degraded-fallback-2d.md`.

## Update granularity by interaction type

| Interaction | What changes | Setter to call |
|---|---|---|
| Hover | Nothing on the graph (DOM tooltip only) | None |
| Click (highlight) | Color of one node + neighbors | `setPointColors` once |
| Brush filter (small subset) | Color/size of changed indices | `setPointColors` + `setPointSizes` once each |
| Filter change (subset) | Positions of remaining points | `setPointPositions` once, then `setLinks` |
| Layer change | All positions | `setPointPositions` once |
| Phase transition | Multiple sets | sequence per `applyDirective` phase |

Hover does not touch the graph; it only positions a DOM tooltip. Putting
a `setConfigPartial` call inside an `onPointMouseOver` is a frequent
performance footgun — every mouse move hits the GPU.

## Diagnosing in practice

Symptom -> most likely cause:

| Symptom | First thing to check |
|---|---|
| Animation stutters | Float32Array allocation in hot path |
| Some nodes missing | `pointPositions.length !== 2 * pointCount` |
| Flashing colors | `setConfig` called instead of `setConfigPartial` |
| Frozen scene | `simulationFriction` too high or `enableSimulation` mismatched |
| Layout never settles | `simulationFriction` too low; no warmup |
| Crash on iPhone | Capability check missing |
| Janky on dev, fine in prod | StrictMode double-mount; missing `destroy()` |
| Dev server slowdown over time | `Graph` leaks on hot reload |

## VERIFY checks (runnable as a node script or vitest)

V-perf-1. `graph.destroy()` is called in every component unmount path.
Grep for `new Graph(` and verify a matching `destroy(` in the same file.
V-perf-2. No `new Float32Array(...)` appears inside a `useEffect` whose
deps include data props. Allocations belong outside hot paths.
V-perf-3. `setPointColors` / `setPointSizes` / `setLinkColors` calls in
loops are flagged. They should be called once per interaction with a
prebuilt array.
V-perf-4. Label cap is enforced (max 5000 active labels at any moment).
V-perf-5. WebGL capability check runs before mounting `CosmosGraphCanvas`.
V-perf-6. No `setConfig` calls outside the initial `new Graph(...)`
construction. All runtime updates use `setConfigPartial`.

## Where to look in refs/

- Performance section: `refs/cosmos-gl/README.md`
- Renderer internals: `refs/cosmos-gl/packages/graph/src/renderer/`
- Luma.gl GPU memory primer: `refs/luma-gl/docs/`

## Anti-patterns

- Never allocate Float32Arrays in render loops or hot paths.
- Never apply per-index setter calls in a loop.
- Never render >5000 labels simultaneously.
- Never skip `graph.destroy()` in cleanup.
- Never call `setConfig` for runtime updates.
- Never put graph mutations in `onPointMouseOver`.
- Never deploy without a WebGL capability check.
