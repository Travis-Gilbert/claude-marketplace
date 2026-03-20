# D3 to Three.js Pipeline

D3 computes layouts; Three.js renders geometry. This separation keeps D3's force simulation, hierarchy, and data-join logic independent of the rendering engine. The pipeline feeds position arrays from D3 into Three.js meshes, updating transforms each frame or on simulation tick.

## Architecture Overview

```
Data (JSON/API)
    |
    v
D3 Force Simulation (computes x, y, z per node)
    |
    v
Position Transfer (write to InstancedMesh matrices or BufferGeometry attributes)
    |
    v
Three.js Render (InstancedMesh for nodes, LineSegments for edges)
    |
    v
useFrame loop (read simulation state, update GPU buffers)
```

D3 runs on the main thread (or in a worker for large graphs). Three.js reads the computed positions and writes them into GPU-friendly data structures. The two systems communicate through shared typed arrays or plain objects.

## d3-force-3d for 3D Layouts

The standard `d3-force` module operates in 2D. Use `d3-force-3d` for layouts with a z-axis.

```bash
npm install d3-force-3d
```

```ts
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
} from 'd3-force-3d';

const simulation = forceSimulation(nodes, 3) // 3 = three dimensions
  .force('link', forceLink(links).id(d => d.id).distance(50))
  .force('charge', forceManyBody().strength(-100))
  .force('center', forceCenter(0, 0, 0));
```

The second argument to `forceSimulation` sets the number of dimensions. Nodes receive `x`, `y`, `z`, `vx`, `vy`, `vz` properties.

## Warm-Up Ticks Before First Render

Force simulations start with high energy and settle over hundreds of ticks. Running the simulation silently before the first render produces a stable initial layout.

```ts
simulation.stop(); // Prevent automatic ticking
for (let i = 0; i < 300; i++) {
  simulation.tick();
}
// Now nodes have stable x, y, z positions
```

Choose 200 to 500 ticks depending on graph complexity. More ticks produce a more settled layout but increase initialization time. For graphs with 1,000+ nodes, consider running warm-up in a Web Worker to avoid blocking the main thread.

## Position Array Transfer

### To InstancedMesh

InstancedMesh is the primary renderer for large node sets. Each node is an instance with its own transform matrix.

```ts
const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();

function updateInstancePositions(mesh, nodes) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    tempPosition.set(node.x, node.y, node.z);
    tempMatrix.makeTranslation(tempPosition.x, tempPosition.y, tempPosition.z);
    mesh.setMatrixAt(i, tempMatrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}
```

Always set `instanceMatrix.needsUpdate = true` after modifying matrices. Reuse the temporary `Matrix4` and `Vector3` objects to avoid allocation per frame.

### To BufferGeometry (for edges)

Render edges as `LineSegments`. Each edge consumes two positions (source and target).

```ts
const edgePositions = new Float32Array(links.length * 6); // 2 vec3 per edge

function updateEdgePositions(links, nodes) {
  for (let i = 0; i < links.length; i++) {
    const source = typeof links[i].source === 'object'
      ? links[i].source
      : nodes.find(n => n.id === links[i].source);
    const target = typeof links[i].target === 'object'
      ? links[i].target
      : nodes.find(n => n.id === links[i].target);

    const offset = i * 6;
    edgePositions[offset] = source.x;
    edgePositions[offset + 1] = source.y;
    edgePositions[offset + 2] = source.z;
    edgePositions[offset + 3] = target.x;
    edgePositions[offset + 4] = target.y;
    edgePositions[offset + 5] = target.z;
  }

  edgeGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(edgePositions, 3)
  );
  edgeGeometry.attributes.position.needsUpdate = true;
}
```

After `forceLink` resolves, `link.source` and `link.target` become node objects (not IDs). Handle both cases during initialization.

## Update Strategies

### Full Rebuild

Replace all geometry and instance data when the dataset changes. Simple and correct, but expensive for large graphs.

```ts
useEffect(() => {
  const sim = forceSimulation(nodes, 3)
    .force('link', forceLink(links).id(d => d.id))
    .force('charge', forceManyBody().strength(-80))
    .force('center', forceCenter());

  sim.stop();
  for (let i = 0; i < 300; i++) sim.tick();

  updateInstancePositions(meshRef.current, nodes);
  updateEdgePositions(links, nodes);

  return () => sim.stop();
}, [nodes, links]);
```

Use full rebuild when the data changes infrequently (on page load, on filter change) and the node count is under 5,000.

### Incremental (Live Simulation)

Keep the simulation running and update positions each frame. Use this for interactive, draggable graphs.

```ts
const simRef = useRef(null);

useEffect(() => {
  simRef.current = forceSimulation(nodes, 3)
    .force('link', forceLink(links).id(d => d.id).distance(40))
    .force('charge', forceManyBody().strength(-60))
    .force('center', forceCenter())
    .alphaDecay(0.02);

  return () => simRef.current.stop();
}, [nodes, links]);

useFrame(() => {
  const sim = simRef.current;
  if (!sim || sim.alpha() < 0.001) return;

  sim.tick();
  updateInstancePositions(meshRef.current, sim.nodes());
  updateEdgePositions(links, sim.nodes());
});
```

Check `sim.alpha()` before ticking. When alpha drops below a threshold, the simulation has settled and can stop updating, saving CPU cycles.

### Hybrid: Warm-Up Then Incremental

Combine both strategies. Run warm-up ticks for the initial layout, then switch to incremental updates for interaction.

```ts
useEffect(() => {
  const sim = forceSimulation(nodes, 3)
    .force('link', forceLink(links).id(d => d.id))
    .force('charge', forceManyBody().strength(-80))
    .force('center', forceCenter());

  sim.stop();
  for (let i = 0; i < 300; i++) sim.tick();

  updateInstancePositions(meshRef.current, nodes);
  updateEdgePositions(links, nodes);

  sim.alpha(0.3).restart();
  simRef.current = sim;

  return () => sim.stop();
}, [nodes, links]);
```

## Memory Management for Large Datasets

### Typed Array Reuse

Pre-allocate typed arrays at the maximum expected size. Avoid creating new `Float32Array` objects on every update.

```ts
const MAX_NODES = 10000;
const MAX_EDGES = 50000;

const nodePositions = new Float32Array(MAX_NODES * 3);
const edgePositions = new Float32Array(MAX_EDGES * 6);
```

When the actual count is smaller, set `geometry.setDrawRange(0, actualCount)` to render only the active portion.

### Dispose Geometry on Unmount

```ts
useEffect(() => {
  return () => {
    meshRef.current?.geometry.dispose();
    edgeRef.current?.geometry.dispose();
  };
}, []);
```

### Web Worker for Large Simulations

For graphs with 10,000+ nodes, offload the force simulation to a Web Worker. Transfer position arrays using `postMessage` with transferable buffers.

```ts
// worker.js
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force-3d';

self.onmessage = (e) => {
  const { nodes, links } = e.data;
  const sim = forceSimulation(nodes, 3)
    .force('link', forceLink(links).id(d => d.id))
    .force('charge', forceManyBody().strength(-60))
    .force('center', forceCenter())
    .stop();

  for (let i = 0; i < 300; i++) sim.tick();

  const positions = new Float32Array(nodes.length * 3);
  nodes.forEach((n, i) => {
    positions[i * 3] = n.x;
    positions[i * 3 + 1] = n.y;
    positions[i * 3 + 2] = n.z;
  });

  self.postMessage({ positions }, [positions.buffer]);
};
```

Transfer the `Float32Array` buffer (not a copy) for zero-copy performance.

## React Integration Pattern

### useEffect for D3, useFrame for Three.js

Separate concerns cleanly. `useEffect` manages the simulation lifecycle (create, configure, destroy). `useFrame` reads simulation state and writes to GPU buffers.

```tsx
function ForceGraph({ nodes, links }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const edgeRef = useRef<THREE.LineSegments>(null);
  const simRef = useRef(null);

  useEffect(() => {
    const sim = forceSimulation(nodes, 3)
      .force('link', forceLink(links).id(d => d.id).distance(30))
      .force('charge', forceManyBody().strength(-50))
      .force('center', forceCenter());

    sim.stop();
    for (let i = 0; i < 300; i++) sim.tick();
    sim.alpha(0.3).restart();

    simRef.current = sim;
    return () => sim.stop();
  }, [nodes, links]);

  useFrame(() => {
    const sim = simRef.current;
    if (!sim || !meshRef.current) return;

    const simNodes = sim.nodes();
    updateInstancePositions(meshRef.current, simNodes);
    updateEdgePositions(links, simNodes);
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[null, null, nodes.length]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#4488ff" />
      </instancedMesh>
      <lineSegments ref={edgeRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#666666" opacity={0.5} transparent />
      </lineSegments>
    </group>
  );
}
```

### Node Interaction (Drag)

Implement node dragging by raycasting to InstancedMesh, identifying the instance index, and fixing that node's position in the simulation.

```ts
function onPointerDown(event) {
  const intersects = raycaster.intersectObject(meshRef.current);
  if (intersects.length > 0) {
    const idx = intersects[0].instanceId;
    const node = simRef.current.nodes()[idx];
    node.fx = node.x;
    node.fy = node.y;
    node.fz = node.z;
    simRef.current.alphaTarget(0.3).restart();
    draggedNode = node;
  }
}

function onPointerUp() {
  if (draggedNode) {
    draggedNode.fx = null;
    draggedNode.fy = null;
    draggedNode.fz = null;
    simRef.current.alphaTarget(0);
    draggedNode = null;
  }
}
```

Setting `fx`, `fy`, `fz` pins a node. Setting them to `null` releases it. Temporarily boost `alphaTarget` during drag to keep the simulation responsive.

## Performance Guidelines

| Node Count | Strategy | Notes |
|-----------|----------|-------|
| < 500 | Individual meshes or InstancedMesh | Either works |
| 500 to 5,000 | InstancedMesh + LineSegments | Standard approach |
| 5,000 to 50,000 | InstancedMesh + worker simulation | Offload D3 to worker |
| > 50,000 | Custom shader + compute | Consider GPU-based force simulation |

Keep force strengths moderate (charge: -30 to -100, link distance: 20 to 80). Extreme values cause oscillation that never settles.
