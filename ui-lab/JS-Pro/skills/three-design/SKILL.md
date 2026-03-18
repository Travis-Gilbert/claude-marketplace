---
name: three-design
description: >-
  3D web development planning and coding standards for Three.js, React Three
  Fiber, and D3+Three.js hybrid visualizations. Auto-loads when working with
  Three.js, R3F, or 3D visualization code. Covers scene setup patterns,
  performance rules, NPR rendering, D3-Three wiring, and the pmndrs ecosystem.
  Trigger on: "Three.js," "R3F," "React Three Fiber," "3D," "WebGL,"
  "shader," "scene," "d3-force-3d," or any 3D web development work.
version: 1.0.0
---

# Three.js / R3F Development Standards

Standards for all Three.js and React Three Fiber code.

## Scene Setup

Every R3F scene must include:

```tsx
'use client';
<Canvas dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 50 }}>
  <Suspense fallback={null}>
    {/* Scene content */}
    <Preload all />
  </Suspense>
</Canvas>
```

- Always `'use client'` on R3F components
- Always `dpr={[1, 2]}` for retina support
- Always wrap async content in Suspense
- Always `dispose={null}` on GLTF groups

## Performance

- **useFrame never allocates.** No `new THREE.Vector3()` per frame.
  Pre-allocate in useMemo or at module scope.
- **InstancedMesh** for > 20 identical objects (one draw call)
- **Single BufferGeometry** for edge lines (update positions, not count)
- Frustum culling enabled (default — verify not disabled)
- Post-processing tested on target hardware before shipping

## D3 + Three.js Rule

**D3 computes, Three.js renders.** Never re-implement D3 layout algorithms.
Never use D3 for rendering when Three.js is available.

- D3 forceSimulation → node positions → InstancedMesh.setMatrixAt()
- D3 scaleTime → axis mapping → Three.js geometry positioning
- D3 scaleOrdinal → color mapping → material.color.set()

## WebGL Fallback

Every 3D component must handle WebGL absence:

```tsx
if (!hasWebGL()) return <ExistingTwoDComponent />;
return (
  <Suspense fallback={<ExistingTwoDComponent />}>
    <ThreeScene />
  </Suspense>
);
```

## NPR Default

Non-photorealistic rendering is the default for sketch-aesthetic sites.
Use Sobel edge detection post-processing, not bloom/DOF.

## API Verification

Before using any Three.js, R3F, or Drei API, check `refs/` to confirm
method signatures. Do not rely on training data for parameter order or
default values.

## Anti-Patterns

- Never allocate in useFrame (`new Vector3()`, `new Color()`, etc.)
- Never mix React JSX rendering and D3 DOM manipulation in the same subtree
- Never skip Suspense for async loads (GLTF, textures, environments)
- Never use photorealistic effects (bloom, DOF) when NPR is the design direction
- Never skip the 2D fallback for 3D views
- Never re-implement Drei helpers — check the library first
- Never update geometry count per frame — update positions in existing buffers
