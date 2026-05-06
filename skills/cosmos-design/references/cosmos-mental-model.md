# cosmos.gl mental model

cosmos.gl is a GPU force-simulation engine, not a generic graph library
and not a React component library. Holding the right mental model
prevents almost every common bug.

## What cosmos.gl IS

- A WebGL renderer that owns Float32Arrays for points and links.
- A force simulation engine running in JavaScript, with the rendering
  pipeline running in WebGL.
- An imperative API: you call `setPointPositions`, `setPointColors`,
  `setLinks` to push data; the engine renders.
- Lifecycle-managed: a `Graph` instance allocates GPU resources that
  must be released via `graph.destroy()`.

## What cosmos.gl is NOT

- NOT a chart library. It draws nodes and edges, period. Charts are
  vgplot's job.
- NOT a 3D engine. It draws 2D node-link graphs. R3F (three-pro) is
  the 3D engine.
- NOT a React component out of the box. The `@cosmograph/react`
  wrapper exists but is forbidden by cosmos-pro (N1) — write a
  native React canvas component that owns the imperative `Graph`.
- NOT object-oriented. There are no node objects. There are
  Float32Arrays of positions, plus a parallel array of domain ids
  registered separately via `setPointIds`.

## The data contract

Every setter takes a flat Float32Array. Positions are
`[x1, y1, x2, y2, ...]`. Links are
`[srcIndex1, tgtIndex1, srcIndex2, tgtIndex2, ...]`. There are no
node id strings at this layer; ids exist only because you registered
them via `setPointIds`.

This means `cosmos.gl` doesn't know what your data means. It knows
geometry (positions, sizes, colors) and topology (links by index). All
domain reasoning happens upstream in DuckDB / Mosaic / your application.

## v1 vs v2 — what changed

cosmos.gl v2 (the current open-source engine) replaces the v1 `setData`
call with a set of granular setters. This is not a cosmetic change —
it enables partial updates without rebuilding the whole graph. Most
tutorials and Stack Overflow answers describe v1; trust the v2 source
in cosmos-pro's `refs/cosmos-gl/` over training data.

| v1 (legacy) | v2 (current) |
|---|---|
| `graph.setData({ nodes, links })` | `setPointPositions` + `setLinks` + `setPointColors` + ... |
| Object-array data | Flat Float32Array data |
| Node objects with ids | Indices + parallel `setPointIds` for domain ids |

## Why this matters for design

When designing a cosmos.gl scene, think in:

- **Geometry** (positions, sizes, shapes) — what determines layout.
- **Color** (per-point and per-link) — what differentiates.
- **Topology** (which nodes connect) — what the structure is.
- **Camera** (zoom, target) — what's in view.
- **Simulation** (forces, friction, alpha) — how the layout evolves.

Each of these maps to a setter or a config knob. Each is independent;
designing a scene is composing these dimensions.

## Where this goes wrong

- Treating cosmos.gl like a charting library and trying to add axes,
  legends, or grid lines. Use vgplot for those.
- Treating cosmos.gl like a React-state-driven view. The imperative
  setters live outside React's render cycle by design.
- Trying to encode "this node is selected" in cosmos.gl state. Encode
  it via color/size; cosmos.gl doesn't have a notion of selection.
- Trying to mix simulation frames with React renders. Run the
  simulation in cosmos.gl's own loop; React renders the canvas
  element wrapper, nothing else.
