# D3 + Three.js Hybrid Patterns

## The Cardinal Rule

**D3 computes. Three.js renders.**

D3 is a data transformation and layout library. Three.js is a rendering
engine. They are complements, not competitors. Never re-implement D3's
force layout in Three.js. Never use D3's SVG rendering when Three.js
is available.

## Pattern: Force Graph

1. **D3 layer**: `d3-force-3d` forceSimulation with forceLink, forceManyBody,
   forceCenter. Set `numDimensions(3)` for native x/y/z computation. The
   simulation outputs node positions as `.x`, `.y`, `.z` properties.

2. **Three.js layer**: InstancedMesh for nodes (one draw call for all),
   LineSegments with BufferGeometry for edges. Each frame, read D3's
   node positions and update the instance matrices and edge positions.

3. **Bridge**: `useFrame` calls `simulation.tick()` then reads positions.
   Pre-allocate a dummy Object3D for matrix computation. Never allocate
   in the render loop.

```tsx
// In useFrame:
simulation.tick();
nodes.forEach((node, i) => {
  dummy.position.set(node.x * SCALE, node.y * SCALE, node.z * SCALE);
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
});
mesh.instanceMatrix.needsUpdate = true;
```

## Pattern: Timeline Axis

1. **D3 layer**: `d3.scaleTime()` maps date range to a numeric range
   (the Z axis in 3D space). `d3.timeFormat()` generates tick labels.
   D3 computes where each data point sits on the time axis.

2. **Three.js layer**: Nodes rendered as instanced spheres at the
   D3-computed positions. The time axis itself is a simple line mesh.
   Tick labels rendered with Drei's `<Text>` component.

3. **Camera**: Scroll-driven movement along the Z axis (the time
   direction). The user scrolls to travel forward/backward in time.

## Pattern: Hierarchical Layout

1. **D3 layer**: `d3.hierarchy()` + `d3.treemap()` or `d3.pack()` or
   `d3.tree()` computes layout rectangles/circles/positions.

2. **Three.js layer**: Extrude D3's 2D layout into 3D. Treemap
   rectangles become boxes with height encoding an additional variable.
   Circle packing becomes spheres. Tree layouts become 3D node-link
   diagrams with depth.

## Key Libraries

| Library | Purpose | Install |
|---------|---------|---------|
| `d3` | Scales, formats, layouts (already installed) | (already in package.json) |
| `d3-force-3d` | 3D force simulation (drop-in replacement for d3-force) | `npm install d3-force-3d` |
| `three` | Rendering engine | `npm install three` |
| `@react-three/fiber` | React renderer for Three.js | `npm install @react-three/fiber` |
| `@react-three/drei` | Helper components | `npm install @react-three/drei` |

## Performance Considerations

- **InstancedMesh** for nodes: 1 draw call for N identical geometries.
  Use `setMatrixAt()` for position/scale/rotation, `setColorAt()` for
  per-instance color.

- **BufferGeometry** for edges: a single geometry with a Float32Array
  position attribute. Update the array values per frame, then set
  `posAttr.needsUpdate = true`. Do not recreate the geometry.

- **Pre-allocate everything**: dummy Object3D, Vector3, Color, Matrix4.
  Create them once (module scope or useMemo), reuse every frame.

- **Simulation warm-up**: run 50-100 simulation ticks before the first
  render so nodes start in a settled layout, not all at the origin.

- **Alpha decay**: set `simulation.alphaDecay(0.01)` for slower settling
  (smoother animation) or `0.05` for faster settling (less CPU after
  initial layout).

## Data Flow in CommonPlace

```
fetchFeed() / fetchGraph()
    |
    v
D3 transforms (scaleTime, forceSimulation, hierarchy)
    |
    v
Position arrays (x, y, z per node)
    |
    v
useFrame reads positions
    |
    v
InstancedMesh.setMatrixAt() + edge BufferGeometry update
    |
    v
Three.js renders the frame
```

The D3 layer is pure computation. It doesn't touch the DOM or the
Canvas. It produces numbers. Three.js consumes those numbers and
produces pixels.
