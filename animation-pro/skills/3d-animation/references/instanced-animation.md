# Instanced Animation

InstancedMesh renders thousands of copies of the same geometry in a single draw call. Each instance has its own transform matrix and optionally its own color. Use instancing whenever the scene contains many objects that share geometry and material.

## InstancedMesh Basics

Create an InstancedMesh with shared geometry, shared material, and a maximum instance count.

```tsx
<instancedMesh ref={meshRef} args={[null, null, 1000]}>
  <sphereGeometry args={[0.5, 16, 16]} />
  <meshStandardMaterial color="#4488ff" />
</instancedMesh>
```

The third argument (`count`) allocates the instance matrix buffer. Set it to the maximum expected number of instances. Rendering fewer instances than the allocated count is fine (use `mesh.count = actualCount`). Rendering more requires creating a new InstancedMesh.

In imperative Three.js:

```ts
const geometry = new THREE.SphereGeometry(0.5, 16, 16);
const material = new THREE.MeshStandardMaterial({ color: '#4488ff' });
const mesh = new THREE.InstancedMesh(geometry, material, 1000);
scene.add(mesh);
```

## Setting Per-Instance Transforms with setMatrixAt

Each instance's position, rotation, and scale are encoded in a 4x4 matrix. Use `setMatrixAt(index, matrix)` to write transforms.

```ts
const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3(1, 1, 1);

function initializeInstances(mesh, data) {
  data.forEach((datum, i) => {
    tempPosition.set(datum.x, datum.y, datum.z);
    tempQuaternion.setFromEuler(new THREE.Euler(0, datum.rotation, 0));
    tempScale.set(datum.scale, datum.scale, datum.scale);

    tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
    mesh.setMatrixAt(i, tempMatrix);
  });

  mesh.instanceMatrix.needsUpdate = true;
}
```

**Critical**: always set `mesh.instanceMatrix.needsUpdate = true` after modifying any matrices. Without this flag, the GPU buffer is not re-uploaded.

Reuse temporary objects (`tempMatrix`, `tempPosition`, etc.) as module-level constants. Allocating them inside loops or per-frame callbacks creates garbage collection pressure.

## Per-Instance Color with setColorAt

```ts
const tempColor = new THREE.Color();

function setInstanceColors(mesh, data) {
  data.forEach((datum, i) => {
    tempColor.set(datum.color);
    mesh.setColorAt(i, tempColor);
  });

  mesh.instanceColor.needsUpdate = true;
}
```

`setColorAt` requires the material to support vertex colors. `MeshStandardMaterial` and `MeshBasicMaterial` handle this automatically when `instanceColor` is present. The first call to `setColorAt` creates the `instanceColor` buffer.

Set `mesh.instanceColor.needsUpdate = true` after modifying colors.

## Animating Instances in useFrame

Update instance matrices every frame for animation. This is the core pattern for instanced animation.

### Position Animation

```ts
const tempMatrix = new THREE.Matrix4();

useFrame(({ clock }) => {
  const mesh = meshRef.current;
  if (!mesh) return;

  const t = clock.getElapsedTime();

  for (let i = 0; i < count; i++) {
    const x = positions[i].x + Math.sin(t + i * 0.1) * 0.5;
    const y = positions[i].y + Math.cos(t * 0.7 + i * 0.2) * 0.3;
    const z = positions[i].z;

    tempMatrix.makeTranslation(x, y, z);
    mesh.setMatrixAt(i, tempMatrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
});
```

### Rotation Animation

```ts
const tempQuat = new THREE.Quaternion();
const tempEuler = new THREE.Euler();

useFrame(({ clock }) => {
  const mesh = meshRef.current;
  if (!mesh) return;
  const t = clock.getElapsedTime();

  for (let i = 0; i < count; i++) {
    mesh.getMatrixAt(i, tempMatrix);
    tempMatrix.decompose(tempPosition, tempQuat, tempScale);

    tempEuler.set(0, t * speeds[i], 0);
    tempQuat.setFromEuler(tempEuler);

    tempMatrix.compose(tempPosition, tempQuat, tempScale);
    mesh.setMatrixAt(i, tempMatrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
});
```

Use `getMatrixAt` to read the current transform before modifying it. This preserves position and scale while changing rotation.

### Scale Animation (Pulsing)

```ts
useFrame(({ clock }) => {
  const t = clock.getElapsedTime();

  for (let i = 0; i < count; i++) {
    const s = 1 + Math.sin(t * 2 + i * 0.5) * 0.2;

    mesh.getMatrixAt(i, tempMatrix);
    tempMatrix.decompose(tempPosition, tempQuat, tempScale);
    tempScale.set(s, s, s);
    tempMatrix.compose(tempPosition, tempQuat, tempScale);
    mesh.setMatrixAt(i, tempMatrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
});
```

### Performance Note on Per-Frame Updates

Updating all instance matrices every frame is CPU-intensive for large counts. Strategies to reduce cost:

1. Only update instances that are actually animating (maintain an "active" index set).
2. Use a shader-based approach for uniform animations (see Custom Attributes below).
3. Batch updates: update a subset of instances per frame in a round-robin fashion.

## Custom Attributes via InstancedBufferAttribute

Add per-instance data beyond transform and color. Use `InstancedBufferAttribute` to pass custom values to shaders.

```ts
const offsets = new Float32Array(count);
const speeds = new Float32Array(count);

for (let i = 0; i < count; i++) {
  offsets[i] = Math.random() * Math.PI * 2;
  speeds[i] = 0.5 + Math.random() * 1.5;
}

geometry.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 1));
geometry.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(speeds, 1));
```

Then animate in a vertex shader instead of JavaScript:

```glsl
attribute float aOffset;
attribute float aSpeed;
uniform float uTime;

void main() {
  vec3 pos = position;
  pos.y += sin(uTime * aSpeed + aOffset) * 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
}
```

This moves the per-instance animation to the GPU, eliminating the per-frame JavaScript loop entirely. The CPU only updates a single `uTime` uniform.

### Updating Custom Attributes

If custom attribute values change at runtime:

```ts
const attr = geometry.getAttribute('aOffset');
attr.array[index] = newValue;
attr.needsUpdate = true;
```

Set `needsUpdate = true` on the attribute to trigger a GPU re-upload.

## GPU Instancing Performance Characteristics

### Draw Calls

InstancedMesh renders all instances in a single draw call. This is the primary performance benefit. For comparison, 1,000 individual meshes produce 1,000 draw calls; 1,000 instances produce 1.

### Memory

All instances share geometry and material. Memory usage is: `geometry memory + material memory + (16 floats * count * 4 bytes)` for the instance matrix buffer, plus `(3 floats * count * 4 bytes)` for the optional color buffer.

### CPU Cost

Setting matrices with `setMatrixAt` is a CPU operation. For 10,000+ instances animated every frame, this becomes the bottleneck. Move per-instance animation to the vertex shader via custom attributes to reduce CPU load.

### Frustum Culling

By default, InstancedMesh frustum-culls the entire group based on a single bounding sphere. If instances are spread across a large area, the bounding sphere may be too large to ever cull, wasting GPU time on off-screen instances.

Compute a tight bounding box:

```ts
mesh.computeBoundingSphere();
```

Or disable frustum culling and handle it manually:

```ts
mesh.frustumCulled = false;
```

For very large instance sets spread across a wide area, consider splitting into multiple InstancedMesh objects with smaller spatial extents.

## When to Use InstancedMesh vs Individual Meshes

| Criterion | InstancedMesh | Individual Meshes |
|-----------|--------------|-------------------|
| Object count > 50 | Preferred | Avoid |
| Same geometry and material | Required | Not required |
| Different geometries | Not possible | Required |
| Per-object material changes | Limited (color only without shaders) | Full flexibility |
| Raycasting | Returns `instanceId` | Returns mesh reference |
| React event handling | `onClick` with `e.instanceId` | Standard `onClick` per mesh |
| Memory efficiency | Excellent | Poor for high counts |
| Draw calls | 1 per InstancedMesh | 1 per mesh |

### Hybrid Approach

Use InstancedMesh for the bulk of identical objects and individual meshes for objects that need unique geometry or materials (highlighted items, selected items, special cases).

## Drei Instances Helper Component

Drei provides an `<Instances>` component that wraps InstancedMesh with a declarative API.

```tsx
import { Instances, Instance } from '@react-three/drei';

function ParticleField({ data }) {
  return (
    <Instances limit={data.length}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshStandardMaterial color="#4488ff" />
      {data.map((d, i) => (
        <Instance
          key={i}
          position={[d.x, d.y, d.z]}
          scale={d.scale}
          color={d.color}
        />
      ))}
    </Instances>
  );
}
```

Each `<Instance>` maps to one entry in the InstancedMesh. Props like `position`, `rotation`, `scale`, and `color` are written to the instance buffers.

### Animated Instances with Drei

```tsx
function AnimatedInstance({ basePosition, index }) {
  const ref = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.position.y = basePosition[1] + Math.sin(t + index) * 0.5;
  });

  return <Instance ref={ref} position={basePosition} />;
}
```

The Drei wrapper handles matrix composition from the `Instance` ref's transform properties. This is convenient for small to medium instance counts (under 2,000). For larger counts, the overhead of individual React components per instance becomes significant. Switch to the imperative `setMatrixAt` pattern at that point.

## Disposal

Dispose the InstancedMesh geometry and material on unmount.

```ts
useEffect(() => {
  return () => {
    meshRef.current?.geometry.dispose();
    meshRef.current?.material.dispose();
  };
}, []);
```

If using custom `InstancedBufferAttribute` objects, they are disposed with the geometry. No separate cleanup is needed.
