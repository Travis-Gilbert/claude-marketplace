# Performance Budgets for 3D on travisgilbert.me

## Target Profile

- **Primary**: Desktop (Chrome, Firefox, Safari, Edge), 60fps
- **Secondary**: Mobile (iOS Safari, Chrome Android), 2D fallback
- **Minimum**: WebGL 1.0 support (WebGL 2.0 preferred)

## Desktop Budget

| Metric | Budget | Why |
|--------|--------|-----|
| Triangle count | < 200,000 | Mid-range GPU comfort zone |
| Draw calls | < 100 | Each draw call has CPU overhead |
| Texture memory | < 100MB | VRAM limit for integrated GPUs |
| Frame time | < 16.6ms | 60fps target |
| JS bundle (3D code) | < 150KB gzipped | Lazy-loaded, not in critical path |
| Time to interactive | < 3s after load | User shouldn't wait for 3D |

## How to Stay Under Budget

### Instancing (biggest win)

Without instancing: 500 spheres = 500 draw calls = ~30fps
With instancing: 500 spheres = 1 draw call = solid 60fps

Use InstancedMesh for any group of > 20 identical geometries.
CommonPlace nodes, timeline dots, graph particles all qualify.

### Geometry Detail

| Object | Recommended segments | Triangles |
|--------|---------------------|-----------|
| Node sphere (instanced) | 12x12 | 288 each |
| Background sphere | 32x32 | 2,048 |
| Plane/ground | 1x1 | 2 |
| Box | default | 12 |

At 500 instanced nodes with 12x12 spheres: 144,000 triangles.
Comfortable under the 200k budget.

### Edge Rendering

Use LineSegments with a single BufferGeometry. Update the position
attribute per frame (Float32Array mutation), do not recreate geometry.

Cost: ~0 triangles (lines are not rasterized as triangles), 1 draw call.

### Post-Processing

| Effect | Cost | Recommendation |
|--------|------|----------------|
| Sobel edge detection | Low | Default for all scenes |
| N8AO (ambient occlusion) | Medium | Use for emphasis scenes only |
| Bloom | Medium | Avoid on this site (photorealistic) |
| Depth of Field | High | Avoid on this site (photorealistic) |
| Cross-hatching | Low | Optional, fragment shader only |

The Sobel edge shader is two texture reads (normal + depth) and a
3x3 convolution per pixel. Minimal impact even on integrated GPUs.

### Texture Strategy

- Use power-of-two dimensions (512x512, 1024x1024)
- Compress where possible (KTX2 for GLTF, WebP for 2D)
- Avoid large textures for data viz (use vertex colors instead)
- Paper texture overlay: 512x512 is sufficient

### Lazy Loading

- 3D scenes are lazy-loaded via React.lazy() + Suspense
- The 3D code is NOT in the critical path bundle
- Fallback (existing 2D component) renders instantly
- Three.js + R3F + Drei add ~150KB gzipped to the lazy chunk

## Monitoring

Use `renderer.info` to check actual draw calls and triangles:

```tsx
useFrame(({ gl }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Draw calls:', gl.info.render.calls);
    console.log('Triangles:', gl.info.render.triangles);
    console.log('Textures:', gl.info.memory.textures);
  }
});
```

For development, add `leva` controls to toggle effects and monitor
performance in real time.

## Mobile Fallback

Mobile devices do not get 3D. The WebGL capability check in
`examples/11-webgl-fallback.tsx` handles this:

1. `hasWebGL()` returns false on devices without WebGL
2. SwiftShader (software WebGL) is detected and rejected
3. The fallback is the existing 2D component (already optimized)
4. No 3D code is loaded on mobile (lazy loading)
