# Spatial Mapping

Spatial mapping translates abstract data dimensions into physical 3D properties: position, size, color, proximity, and motion. Good spatial mapping makes data legible; poor mapping creates visual noise. Each dimension of the data should correspond to exactly one visual dimension, and the mapping should be consistent throughout the scene.

## Mapping Data Dimensions to 3D Axes

Assign axes deliberately. The y-axis has special status in 3D (it reads as "up" to most users), so reserve it for the most important quantitative dimension.

### Common Axis Assignments

| Data Dimension | 3D Axis | Rationale |
|---------------|---------|-----------|
| Primary metric (revenue, score, count) | Y (vertical) | Height is the most intuitive magnitude indicator |
| Time or sequence | Z (depth) or X (horizontal) | Depth creates a corridor; horizontal creates a timeline |
| Category or group | X (horizontal) | Side-by-side placement for comparison |
| Secondary metric | X or Z (whichever is unused) | Supports bivariate analysis |

### Implementation

```ts
function mapToPosition(datum, scales) {
  return new THREE.Vector3(
    scales.x(datum.category),
    scales.y(datum.value),
    scales.z(datum.timestamp),
  );
}
```

Use D3 scales (`d3.scaleLinear`, `d3.scaleBand`, `d3.scaleTime`) to map data ranges to spatial ranges. Wrap them in a utility that outputs `THREE.Vector3`.

## Category to Spatial Cluster

Group categorical data into spatial clusters. Each category occupies a distinct region of space.

### Grid Layout

Arrange categories in a grid on the XZ plane. Use `d3.scaleBand` for even spacing.

```ts
const categories = ['A', 'B', 'C', 'D'];
const xScale = d3.scaleBand()
  .domain(categories)
  .range([-10, 10])
  .padding(0.2);

function categoryPosition(category) {
  return xScale(category) + xScale.bandwidth() / 2;
}
```

### Force-Clustered Layout

Use D3 force simulation with a clustering force to group items by category while avoiding overlap.

```ts
import { forceSimulation, forceManyBody, forceCollide } from 'd3-force-3d';

const clusterCenters = {
  A: { x: -5, y: 0, z: -5 },
  B: { x: 5, y: 0, z: -5 },
  C: { x: -5, y: 0, z: 5 },
  D: { x: 5, y: 0, z: 5 },
};

function clusterForce(alpha) {
  nodes.forEach(node => {
    const center = clusterCenters[node.category];
    node.vx += (center.x - node.x) * alpha * 0.1;
    node.vy += (center.y - node.y) * alpha * 0.1;
    node.vz += (center.z - node.z) * alpha * 0.1;
  });
}

const sim = forceSimulation(nodes, 3)
  .force('cluster', clusterForce)
  .force('collide', forceCollide(1.5))
  .force('charge', forceManyBody().strength(-5));
```

Items cluster around their category center while collision forces prevent overlap within each cluster.

### Labeled Clusters

Place text labels at cluster centers using Drei's `Text` or `Html` component.

```tsx
{Object.entries(clusterCenters).map(([name, pos]) => (
  <Text
    key={name}
    position={[pos.x, pos.y + 3, pos.z]}
    fontSize={1}
    color="#333"
    anchorX="center"
    anchorY="bottom"
  >
    {name}
  </Text>
))}
```

Position labels above the cluster center (offset on y) so they remain visible when the cluster is populated.

## Magnitude to Height or Radius

Map quantitative values to vertical position (bar chart in 3D) or object radius (bubble chart in 3D).

### Height Mapping

```ts
const yScale = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.value)])
  .range([0, 10]);

// For bar-like objects, scale the mesh on Y and offset to sit on ground
tempMatrix.makeScale(1, yScale(datum.value), 1);
tempMatrix.setPosition(x, yScale(datum.value) / 2, z);
```

Divide height by 2 when positioning to keep the base at y=0.

### Radius Mapping

Use a square-root scale for radius to make area proportional to value (same principle as 2D bubble charts).

```ts
const rScale = d3.scaleSqrt()
  .domain([0, d3.max(data, d => d.value)])
  .range([0.2, 3]);

const r = rScale(datum.value);
tempMatrix.makeScale(r, r, r);
```

Never use a linear scale for radius. Linear radius produces quadratic area differences, which exaggerate large values.

## Time to Depth (Timeline Corridor)

Map temporal data along the z-axis to create a spatial timeline. Users move forward through time.

```ts
const zScale = d3.scaleTime()
  .domain([startDate, endDate])
  .range([10, -20]); // Positive z = near camera, negative z = far

function timeToDepth(date) {
  return zScale(date);
}
```

Place earlier events at positive z (closer to the viewer) and later events at negative z (deeper into the scene). This matches the reading metaphor of moving "forward" in time.

### Corridor Walls

Add visual context with translucent planes or gridlines on the xz plane to establish depth.

```tsx
<gridHelper args={[40, 40, '#444444', '#222222']} position={[0, -0.01, -5]} />
```

### Temporal Markers

Place date labels at regular intervals along the z-axis.

```tsx
{dateMarkers.map(date => (
  <Text
    key={date.toISOString()}
    position={[12, 0, zScale(date)]}
    fontSize={0.5}
    color="#888"
    rotation={[0, -Math.PI / 2, 0]}
  >
    {formatDate(date)}
  </Text>
))}
```

## Relationships to Edges and Proximity

### Edge Rendering

Draw lines between related items. Use `LineSegments` for large edge sets or `Line` (from Drei) for styled individual edges.

```tsx
import { Line } from '@react-three/drei';

function Edge({ sourcePos, targetPos, strength }) {
  return (
    <Line
      points={[sourcePos, targetPos]}
      color="#666"
      lineWidth={strength * 3}
      opacity={0.4}
      transparent
    />
  );
}
```

Map relationship strength to edge thickness or opacity. Avoid mapping it to color, as color is better reserved for categorical or state information.

### Proximity as Relationship

Position related items closer together. This works naturally with force-directed layouts (linked nodes attract). For non-force layouts, compute a similarity matrix and use MDS (multidimensional scaling) to produce spatial positions.

```ts
// Conceptual: similarity to distance
const distance = 1 / (similarity + 0.01); // Prevent division by zero
```

### Hierarchical Nesting

For tree structures, map hierarchy to spatial containment or radial distance from center.

```ts
const depthScale = d3.scaleLinear()
  .domain([0, maxDepth])
  .range([0, 15]); // Root at center, leaves at edge

function nodePosition(node) {
  const angle = (node.index / node.parent.children.length) * Math.PI * 2;
  const radius = depthScale(node.depth);
  return new THREE.Vector3(
    Math.cos(angle) * radius,
    node.depth * 2,
    Math.sin(angle) * radius,
  );
}
```

## Color Mapping in 3D

### Material Color

Assign category or state to material color. Use `MeshStandardMaterial` for objects that need lighting interaction.

```ts
const colorScale = d3.scaleOrdinal()
  .domain(['active', 'pending', 'archived'])
  .range(['#4488ff', '#ffaa44', '#888888']);

const material = new THREE.MeshStandardMaterial({
  color: new THREE.Color(colorScale(datum.status)),
});
```

### Emissive for Highlighting

Use emissive color for states that should glow or draw attention (selected, active, alert).

```ts
material.emissive = new THREE.Color('#ff4444');
material.emissiveIntensity = 0.5;
```

Emissive objects are visible even in shadow. Reserve this for a small number of highlighted items.

### Per-Instance Color with InstancedMesh

```ts
const color = new THREE.Color();

data.forEach((datum, i) => {
  color.set(colorScale(datum.category));
  mesh.setColorAt(i, color);
});
mesh.instanceColor.needsUpdate = true;
```

This is far cheaper than creating separate materials per instance.

### Color Considerations in 3D

Lighting affects perceived color. A red material in shadow looks dark brown. Account for this by using brighter base colors than in 2D, or by adding ambient light to ensure minimum visibility.

Depth attenuation (fog) desaturates distant objects. If color is load-bearing, add `scene.fog = new THREE.FogExp2('#000000', 0.02)` carefully, or use constant-brightness emissive materials for color-coded objects.

## Scale Considerations

### Depth Perception Problems

Objects farther from the camera appear smaller (perspective projection). This makes it difficult to compare sizes across depths. Mitigations:

1. Use orthographic projection for comparative visualizations.
2. Keep all comparison items at the same depth.
3. Add reference lines or a ground grid for scale context.

### Occlusion

3D objects block each other. Place important data in front. Make occluding objects translucent. Or provide orbit controls so users can rotate the view.

```ts
material.transparent = true;
material.opacity = 0.7;
material.depthWrite = false; // Prevents z-fighting with overlapping transparent objects
```

### Scale Normalization

Normalize all spatial dimensions to a consistent range (e.g., -10 to 10) to keep the scene navigable. Extreme scale differences (objects ranging from 0.001 to 10000) cause camera clipping and precision issues.

```ts
const scale = d3.scaleLinear()
  .domain(d3.extent(data, d => d.value))
  .range([0.5, 5]);
```

## Interaction Mapping (2D Click to 3D Raycast)

Convert mouse clicks on the 2D viewport to 3D object selection using raycasting.

### R3F onClick

R3F provides automatic raycasting on mesh click handlers.

```tsx
<instancedMesh
  ref={meshRef}
  args={[geometry, material, count]}
  onClick={(e) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    const datum = data[instanceId];
    onSelect(datum);
  }}
>
```

`e.instanceId` identifies which instance was clicked in an InstancedMesh. `e.point` gives the world-space intersection point.

### Manual Raycasting

For custom interaction logic outside of R3F's event system:

```ts
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerDown(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObject(mesh, true);

  if (intersects.length > 0) {
    const hit = intersects[0];
    // hit.instanceId for InstancedMesh
    // hit.point for world-space position
    // hit.face for face normal
  }
}
```

### Hover Feedback

Change instance color or emissive on hover, then restore on pointer leave.

```ts
onPointerOver={(e) => {
  const idx = e.instanceId;
  meshRef.current.setColorAt(idx, hoverColor);
  meshRef.current.instanceColor.needsUpdate = true;
}}
onPointerOut={(e) => {
  const idx = e.instanceId;
  meshRef.current.setColorAt(idx, originalColors[idx]);
  meshRef.current.instanceColor.needsUpdate = true;
}}
```

Store original colors in a parallel array at initialization time so they can be restored.
