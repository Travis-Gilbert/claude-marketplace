# Three-Pro Plugin

You have access to curated Three.js, React Three Fiber, and Drei source
files, annotated example patterns, and design references for building
3D web experiences. Use them.

## When to use reference source

Do NOT rely on training data for Three.js, R3F, or Drei internals.

- **Three.js renderer questions**: read `refs/three-core/WebGLRenderer.js`
  for how the render loop, state machine, and draw calls actually work.

- **Raycasting questions**: read `refs/three-core/Raycaster.js` for the
  actual intersection algorithm, including how it handles transparency,
  layers, and recursive scene traversal.

- **InstancedMesh questions**: read `refs/three-core/InstancedMesh.js`
  for how matrix updates, color updates, and bounding boxes work. This
  is critical for data visualization with many nodes.

- **Custom shaders**: read `refs/three-core/ShaderMaterial.js` for how
  uniforms are bound, how the vertex/fragment pipeline works, and what
  built-in uniforms Three.js provides.

- **R3F reconciler**: read `refs/r3f-core/renderer.ts` for how JSX maps
  to Three.js objects. `hooks.ts` has useFrame, useThree, useLoader.
  `events.ts` has the raycasting event system that maps onClick to
  Three.js intersection.

- **Drei helpers**: read `refs/drei-components/` before building custom
  solutions. Drei almost certainly already has what you need. Check
  `ScrollControls.tsx` for scroll-driven scenes, `Html.tsx` for HTML
  projected into 3D, `Instances.tsx` for instanced rendering.

- **D3 + Three.js hybrids**: read `references/d3-three-hybrid.md` for
  the wiring pattern. Check `examples/07-d3-force-to-three.tsx` and
  `examples/08-d3-timeline-to-three.tsx` for working code.

- **NPR/sketch rendering**: read `references/npr-techniques.md` for
  Sobel edge detection, pencil shader, and hatching patterns.
  Check `examples/09-sketch-postprocessing.tsx` for working code.

## When to use examples

The `examples/` directory contains 12 annotated patterns. Each file
has a header comment explaining what it demonstrates and when to use
it. Read the relevant example BEFORE writing code for that pattern.

## When to use agents

- Building R3F components, wiring D3 data, writing shaders:
  read `agents/three-developer.md`
- Designing how a scene looks and feels (lighting, materials, camera,
  NPR effects): read `agents/3d-scene-designer.md`

## Rules

1. Verify Three.js/R3F/Drei APIs against source in refs/ before writing
   code that depends on them. Training data may be outdated.

2. Check Drei for an existing helper before building from scratch.

3. For D3 hybrid work: D3 computes positions, Three.js renders geometry.
   Never mix these responsibilities.

4. Every 3D component must handle WebGL absence gracefully. Pattern:
   check capability, render fallback (the existing 2D component) if
   WebGL is missing or underpowered. See `examples/11-webgl-fallback.tsx`.

5. NPR/sketch rendering is the default visual direction for this site.
   Photorealistic scenes are not appropriate for the brand.

6. useFrame callbacks must never allocate. No `new THREE.Vector3()`
   per frame. Pre-allocate in useMemo or module scope.

7. All GLTF loads must be wrapped in Suspense with a fallback.
   Add `dispose={null}` to GLTF groups.

8. Set `dpr={[1, 2]}` on Canvas for retina support.
