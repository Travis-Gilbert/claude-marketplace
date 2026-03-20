# Performance Budget

3D rendering performance is constrained by triangles, draw calls, texture memory, and shader complexity. Establish budgets before building and monitor continuously. Frame time target: 16ms for 60fps, 33ms for 30fps.

## Triangle Budget

### Target: Under 200K Triangles Total

This is a safe budget for desktop browsers. Mobile should target under 100K.

### Measuring

```ts
useFrame(({ gl }) => {
  const info = gl.info;
  console.log('Triangles:', info.render.triangles);
  console.log('Draw calls:', info.render.calls);
  console.log('Geometries:', info.memory.geometries);
  console.log('Textures:', info.memory.textures);
});
```

`renderer.info` resets each frame. Read it at the end of the frame (after all rendering) for accurate numbers.

### Reducing Triangles

**Lower subdivision.** A sphere with 32x32 segments has 1,984 triangles. Drop to 16x16 (480 triangles) for distant or small objects.

```tsx
<sphereGeometry args={[0.5, 16, 16]} />
```

**Simplify models.** Use modeling tools (Blender Decimate modifier, gltf-transform) to reduce triangle counts before loading. Target 5K to 20K triangles per character model.

**LOD (Level of Detail).** Switch to lower-polygon versions based on camera distance.

```tsx
import { Detailed } from '@react-three/drei';

<Detailed distances={[0, 10, 30]}>
  <HighPolyModel />
  <MedPolyModel />
  <LowPolyModel />
</Detailed>
```

## Draw Call Budget

### Target: Under 100 Draw Calls

Each unique geometry + material combination produces one draw call. 100 draw calls is comfortable for desktop; 50 or fewer for mobile.

### Reducing Draw Calls

**Instancing.** 1,000 copies of the same mesh: 1 draw call with InstancedMesh vs 1,000 without.

**Geometry merging.** Combine static meshes that share a material into a single BufferGeometry.

```ts
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const geometries = meshes.map(m => {
  const geo = m.geometry.clone();
  geo.applyMatrix4(m.matrixWorld);
  return geo;
});

const merged = mergeGeometries(geometries);
```

Only merge static geometry. Merged geometry cannot be individually transformed or culled.

**Material sharing.** Reuse material instances across meshes. Create materials once at module level or in useMemo.

**Texture atlases.** Combine multiple textures into one atlas. Adjust UV coordinates to sample the correct region.

## Texture Memory

### Format Selection

| Format | Bits/pixel | Use Case |
|--------|-----------|----------|
| RGBA (uncompressed) | 32 | Development only |
| JPEG (via TextureLoader) | 24 (disk), 32 (GPU) | Photos, diffuse maps |
| PNG (via TextureLoader) | 32 (disk), 32 (GPU) | Transparency needed |
| Basis/KTX2 (compressed) | 4 to 8 | Production; stays compressed on GPU |

### GPU Texture Compression

Use KTX2 with Basis Universal for production. Textures remain compressed in GPU memory, reducing memory by 4x to 8x.

```tsx
import { useKTX2 } from '@react-three/drei';

const texture = useKTX2('/texture.ktx2');
```

### Texture Size Guidelines

| Resolution | GPU Memory (RGBA) | Use Case |
|-----------|------------------|----------|
| 256x256 | 256 KB | Icons, small props |
| 512x512 | 1 MB | Standard objects |
| 1024x1024 | 4 MB | Hero objects, characters |
| 2048x2048 | 16 MB | Maximum for most scenes |
| 4096x4096 | 64 MB | Avoid unless essential |

Total texture memory budget: under 64 MB for desktop, under 32 MB for mobile.

## Geometry Optimization

### BufferGeometry

Always use BufferGeometry (the default in modern Three.js). The deprecated `Geometry` class is slower and no longer supported.

### Index Buffers

Indexed geometry shares vertices between triangles, reducing vertex count. Three.js geometry primitives are indexed by default.

### Geometry Disposal

Dispose geometry when no longer needed. GPU memory is not freed until `.dispose()` is called.

```ts
useEffect(() => {
  return () => {
    geometry.dispose();
    material.dispose();
    texture.dispose();
  };
}, []);
```

### Draco Compression

Compress GLTF geometry with Draco for smaller file sizes (70% to 90% reduction). This reduces download time, not GPU memory.

```tsx
import { useGLTF } from '@react-three/drei';

const { scene } = useGLTF('/model.glb');
useGLTF.preload('/model.glb');
```

## Material Optimization

### Material Complexity

| Material | Cost | Use Case |
|----------|------|----------|
| MeshBasicMaterial | Lowest | Unlit objects, always-visible indicators |
| MeshLambertMaterial | Low | Diffuse-only lighting, large scenes |
| MeshStandardMaterial | Medium | Standard PBR, default choice |
| MeshPhysicalMaterial | High | Clearcoat, subsurface, transmission |
| ShaderMaterial | Varies | Custom effects |

Use the cheapest material that achieves the desired look.

### Avoid Transparency When Possible

Transparent objects disable depth-buffer optimizations and require sorting. Use alpha test (`alphaTest: 0.5`) instead of full transparency when possible.

```ts
const material = new THREE.MeshStandardMaterial({
  map: texture,
  alphaTest: 0.5,
});
```

## Lazy Loading 3D Chunks

### React.lazy + Suspense

Load heavy 3D components on demand instead of including them in the initial bundle.

```tsx
import { Suspense, lazy } from 'react';

const Heavy3DScene = lazy(() => import('./Heavy3DScene'));

function App() {
  return (
    <Canvas>
      <Suspense fallback={<LoadingPlaceholder />}>
        <Heavy3DScene />
      </Suspense>
    </Canvas>
  );
}
```

### Model Preloading

```ts
useGLTF.preload('/model.glb');
useTexture.preload('/texture.jpg');
```

### Progressive Loading

Load a low-poly placeholder first, then swap to the high-poly version when ready.

```tsx
function Model() {
  const lowPoly = useGLTF('/model-low.glb');
  const [highPoly, setHighPoly] = useState(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load('/model-high.glb', (gltf) => setHighPoly(gltf));
  }, []);

  return <primitive object={highPoly?.scene ?? lowPoly.scene} />;
}
```

## Profiling

### Chrome DevTools Performance Tab

Record a performance trace while the 3D scene is running. Look for long frames (>16ms in the flame chart), JavaScript cost in `useFrame` callbacks, and GPU time.

### Spector.js

Spector.js captures and inspects individual WebGL draw calls. Install the browser extension, capture a frame, and inspect which draw calls are most expensive, which textures are bound, and what shaders are compiled.

### Drei Perf Component

```tsx
import { Perf } from 'r3f-perf';

<Canvas>
  <Perf position="top-left" />
</Canvas>
```

Displays FPS, frame time, GPU time, draw calls, triangles, and memory in a compact overlay.

## Mobile-Specific Budgets

| Metric | Desktop | Mobile |
|--------|---------|--------|
| Triangles | < 200K | < 100K |
| Draw calls | < 100 | < 50 |
| Texture memory | < 64 MB | < 32 MB |
| Active lights | < 4 | < 2 |
| Shadow maps | 1024x1024 | 512x512 or disable |
| Pixel ratio | Device native | Cap at 2 |
| Physics bodies (active) | < 500 | < 100 |

### Mobile-Specific Optimizations

Cap the pixel ratio to reduce fragment shader workload.

```tsx
<Canvas dpr={[1, 2]}>
```

Disable shadows on mobile. They are expensive and often imperceptible on small screens.

```tsx
<directionalLight castShadow={!isMobile} />
```

Reduce geometry subdivision, texture resolution, and post-processing passes. Test on actual devices, not just Chrome DevTools device emulation (which does not throttle GPU).
