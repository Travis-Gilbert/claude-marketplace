---
name: 3d-animation
description: >-
  This skill should be used when the user asks to "animate a 3D scene",
  "add Three.js animation", "animate with R3F", "implement useFrame animation",
  "play a GLTF animation", "add morph targets", "animate instanced meshes",
  "create a camera path", "add scroll-driven camera", "implement shader animation",
  "add 3D physics", "build a 3D data visualization", "convert to 3D", "make
  this 3D", "add depth to this visualization", or mentions Three.js,
  React Three Fiber, R3F, Drei, AnimationMixer, KeyframeTrack, Theatre.js,
  Rapier 3D, WebGL, GLSL, useFrame, or shader uniforms. Covers WebGL scene
  animation, camera choreography, physics-driven 3D, instanced animation,
  and D3+Three.js hybrid pipelines.
---

# 3D Animation

WebGL scene animation using Three.js, React Three Fiber, Drei helpers,
Theatre.js sequencing, and Rapier physics. Always verify APIs against
source code in `refs/`.

## Animation Approaches

| Approach | Source | When to use |
|----------|--------|-------------|
| `useFrame` loop | R3F | Continuous animation (rotation, floating, custom physics) |
| `AnimationMixer` | Three.js | GLTF/FBX embedded animations, clip playback |
| Drei `useAnimations` | Drei | Convenient wrapper around AnimationMixer for R3F |
| Drei `Float` | Drei | Simple floating/bobbing effect |
| Drei `ScrollControls` | Drei | Scroll-driven camera and object animation |
| `InstancedMesh` + `useFrame` | R3F | Animating many identical objects efficiently |
| Morph targets | Three.js | Smooth shape interpolation |
| Shader uniforms | GLSL | GPU-driven animation (vertex displacement, color) |
| Theatre.js | Theatre | Visual keyframe timeline for complex choreography |

## The D3 + Three.js Pipeline

For data-driven 3D visualization, D3 computes positions and Three.js
renders. Never re-implement D3 layout algorithms in Three.js.

```
Data (API/JSON)
  -> D3 Layout (force, hierarchy, scale)
  -> Position Arrays
  -> Three.js Meshes (InstancedMesh for > 20 identical geometries)
  -> useFrame updates
```

See `references/d3-threejs-pipeline.md` for the full pattern including
warm-up ticks, update strategies, and memory management.

## Spatial Mapping

When converting 2D visualizations to 3D, map data dimensions to spatial axes:

| Data property | 2D encoding | 3D encoding options |
|--------------|-------------|-------------------|
| Category | Color / position | Z-depth layer, spatial cluster |
| Magnitude | Size / bar height | Y-axis height, sphere radius |
| Time | X-axis position | Z-axis depth (timeline corridor) |
| Relationship | Line / proximity | Edge geometry, spatial proximity |

See `references/spatial-mapping.md` for the complete mapping framework.

## Camera Strategies

| Strategy | Implementation | Use case |
|----------|---------------|----------|
| Orbit | Drei `OrbitControls` | Free exploration |
| Scroll-driven | Drei `ScrollControls` + `useScroll` | Narrative, guided tour |
| Fixed angles | Constrained `OrbitControls` (min/maxPolarAngle) | Dashboard |
| GSAP-scrubbed | GSAP timeline on camera position | Cinematic sequence |
| First-person | Drei `PointerLockControls` | Immersive exploration |

See `references/camera-strategies.md` for implementation patterns.

## Performance Budget

Set these constraints before starting any 3D animation work:

| Metric | Budget | Measurement |
|--------|--------|-------------|
| Triangles | < 200,000 | `renderer.info.render.triangles` |
| Draw calls | < 100 | `renderer.info.render.calls` |
| Texture memory | < 64 MB | `renderer.info.memory.textures` |
| Bundle size (3D chunk) | < 200 KB gzipped | Webpack analyzer |
| Time to interactive | < 3s | Lighthouse |
| Target FPS | 60 (30 minimum on mobile) | `useFrame` delta monitoring |

Key performance patterns:
- `InstancedMesh` for > 20 identical geometries
- Lazy-load the 3D chunk (keep main bundle clean)
- Dispose geometries, materials, and textures on unmount
- Use `LOD` (Level of Detail) for complex scenes

See `references/performance-budget.md` for the full guide.

## WebGL Fallback

Always provide a 2D fallback:

1. Detect WebGL support
2. Wrap 3D component in React `Suspense`
3. Fall back to existing 2D component (not a blank screen)
4. Respect `prefers-reduced-motion`: static render or disable animation

See `references/webgl-fallback.md` for the detection + Suspense pattern.

## Verifying APIs Against Source

```bash
# Three.js AnimationMixer
grep -r "AnimationMixer\|AnimationAction\|AnimationClip" refs/threejs/src/animation/
# R3F useFrame
grep -r "useFrame\|useThree\|addEffect" refs/react-three-fiber/packages/fiber/src/
# Drei animation helpers
grep -r "useAnimations\|Float\|useScroll\|ScrollControls" refs/drei/src/
# Theatre.js
grep -r "sheet\|sequence\|val\|onChange" refs/theatre/packages/core/src/
# Rapier 3D
grep -r "RigidBody\|Collider\|World" refs/rapier/src/
```

## Handoff from Chat Skill

When working from a handoff document produced by the `animation-design` chat
skill, follow its specifications exactly. The handoff includes: spatial mapping,
camera strategy, interaction audit, performance budget, and fallback strategy.

## Reference Files

- **`references/animation-mixer.md`**: Three.js AnimationMixer, KeyframeTrack, actions, blending
- **`references/camera-strategies.md`**: Orbit, scroll-driven, fixed angles, GSAP-scrubbed
- **`references/d3-threejs-pipeline.md`**: D3 computes, Three.js renders pipeline
- **`references/spatial-mapping.md`**: Data dimensions to spatial axes mapping
- **`references/instanced-animation.md`**: InstancedMesh with per-instance animation
- **`references/morph-and-skeletal.md`**: Morph targets, bones, skinning, GLTF animation
- **`references/physics-driven-3d.md`**: Rapier integration, rigid bodies, constraints
- **`references/shader-animation.md`**: Vertex displacement, uniforms over time, custom materials
- **`references/performance-budget.md`**: Triangle count, draw calls, texture memory, FPS targets
- **`references/theatre-sequencing.md`**: Theatre.js timeline, keyframe curves, studio UI
- **`references/webgl-fallback.md`**: Detection, Suspense, 2D fallback strategy
