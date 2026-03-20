# Canvas vs WebGL vs SVG

Decision reference for choosing the right rendering technology. Covers strengths, limitations, performance benchmarks, memory usage, and a practical decision matrix.

## Canvas 2D API

### Strengths

- **Immediate mode rendering.** Draw commands execute directly. No scene graph to maintain.
- **Simple API.** `fillRect`, `arc`, `lineTo`, `drawImage` cover most needs. Low learning curve.
- **Pixel-level control.** Direct access to pixel data via `getImageData`/`putImageData`.
- **Good text rendering.** `fillText` with full font support, wrapping, and measurement.
- **Broad compatibility.** Supported in every modern browser, including mobile Safari.
- **Small bundle size.** No library needed for basic usage.

### Limitations

- **Single-threaded CPU rendering.** All drawing happens on the main thread (unless using OffscreenCanvas in a Worker).
- **No hardware acceleration for individual draw calls.** The final composite is GPU-accelerated, but path rasterization is CPU-bound.
- **No scene graph.** Hit testing, layering, and interaction require manual implementation.
- **No built-in animation.** Must implement own loop with `requestAnimationFrame`.
- **Scaling requires redraw.** Zooming or resizing means re-executing all draw commands.

### Performance Characteristics

Canvas 2D handles 1,000 to 5,000 animated elements at 60fps on modern hardware. Performance degrades primarily with:
- Complex path operations (many bezier curves per frame)
- Large fill areas with gradients
- Frequent `getImageData` calls (forces GPU to CPU readback)
- High DPR displays (4x pixel count at 2x DPR)

### Best For

Particle systems under 5,000 particles, data visualization with moderate element counts, image manipulation, drawing applications, 2D games with moderate complexity.

## WebGL (via PixiJS)

### Strengths

- **GPU-accelerated rendering.** Massively parallel processing of vertices and fragments.
- **High element counts.** 50,000 to 100,000 sprites at 60fps is achievable.
- **Batched draw calls.** PixiJS automatically batches sprites sharing the same texture into a single draw call.
- **Shader support.** Custom fragment shaders enable blur, glow, distortion, color grading.
- **Texture management.** Sprite sheets, render textures, texture atlases.
- **Filters.** Built-in blur, color matrix, displacement map, noise.

### Limitations

- **Larger bundle.** PixiJS is ~200KB minified. Custom WebGL adds complexity.
- **Text is expensive.** Text must be rendered to a texture (bitmap fonts or canvas-based text). Dynamic text updates are costly.
- **Learning curve.** Shaders, texture formats, blend modes, and the rendering pipeline require WebGL knowledge.
- **Context limits.** Browsers limit active WebGL contexts (typically 8 to 16). Exceeding this silently loses older contexts.
- **Mobile GPU variance.** Performance varies dramatically across mobile GPUs. Test on low-end Android devices.
- **No native vector support.** Lines and curves must be tessellated into triangles.

### Performance Characteristics

PixiJS with `ParticleContainer`: 50,000 sprites at 60fps.
PixiJS with regular `Container`: 5,000 to 10,000 sprites at 60fps.
Custom WebGL with instanced rendering: 100,000+ elements at 60fps.

The bottleneck shifts from CPU (Canvas) to GPU fill rate and draw call count. Minimize texture switches, keep vertex counts reasonable, and batch aggressively.

### Best For

High-count particle systems, games, complex interactive visualizations, GPU-accelerated effects (blur, glow, distortion), sprite-heavy applications.

## SVG

### Strengths

- **Retained mode (DOM-based).** Each element is a DOM node with events, CSS styling, and accessibility.
- **Resolution independent.** Scales perfectly at any zoom level or display density.
- **CSS animations and transitions.** Animate properties directly with CSS. Inspectable in DevTools.
- **Built-in interaction.** Click handlers, hover states, and pointer events work natively.
- **Accessibility.** Screen readers can traverse SVG content. ARIA attributes work on SVG elements.
- **Print quality.** SVGs render crisply at any print resolution.
- **D3 integration.** D3's data join (`enter`/`update`/`exit`) maps naturally to SVG elements.

### Limitations

- **DOM overhead.** Each element is a full DOM node. 1,000+ animated nodes cause significant layout and style recalculation costs.
- **No pixel access.** Cannot read or manipulate individual pixels.
- **Expensive transforms.** CSS transforms on SVG elements trigger layout recalculation. GPU compositing is less reliable than with HTML elements.
- **Limited visual effects.** SVG filters (blur, drop-shadow) are expensive and inconsistently implemented across browsers.
- **No batching.** Each element is drawn individually. No automatic batching of similar shapes.

### Performance Characteristics

SVG handles 200 to 500 animated elements at 60fps. At 1,000+ animated elements, expect dropped frames. Static SVG with thousands of elements renders fine; the cost is in animation, not initial paint.

Optimizations:
- Use CSS `will-change: transform` to promote elements to GPU layers.
- Avoid animating `d` attributes (path data) when possible; prefer `transform`.
- Group elements in `<g>` tags and transform the group instead of individual elements.
- Use `<use>` for repeated shapes to reduce DOM size.

### Best For

Data visualization with < 500 elements, infographics, icons, illustrations, charts with interaction (tooltips, selection), maps with limited detail levels, anything requiring accessibility or print output.

## Performance Benchmarks by Element Count

| Animated Elements | SVG (fps) | Canvas 2D (fps) | WebGL/PixiJS (fps) |
|-------------------|-----------|-----------------|-------------------|
| 100 | 60 | 60 | 60 |
| 500 | 55 to 60 | 60 | 60 |
| 1,000 | 30 to 45 | 60 | 60 |
| 2,000 | 15 to 25 | 55 to 60 | 60 |
| 5,000 | < 10 | 40 to 55 | 60 |
| 10,000 | Unusable | 20 to 35 | 60 |
| 50,000 | Unusable | < 10 | 50 to 60 |
| 100,000 | Unusable | Unusable | 30 to 50 |

These numbers assume simple shapes (circles, rectangles) on a mid-range 2023 laptop. Complex paths, gradients, and filters reduce all numbers significantly.

## Memory Usage Comparison

| Technology | Per-Element Overhead | Notes |
|-----------|---------------------|-------|
| SVG | ~2 to 5 KB per node | Full DOM node with style computation |
| Canvas 2D | ~0 per element | State is just draw commands; memory is only the bitmap |
| WebGL (PixiJS Sprite) | ~200 to 400 bytes | Sprite object + transform matrix |
| WebGL (ParticleContainer) | ~100 to 150 bytes | Minimal per-particle data |
| WebGL (TypedArray) | 8 to 32 bytes | Raw float data, no object overhead |

Canvas 2D memory is dominated by the canvas bitmap itself: `width * height * 4` bytes. A 1920x1080 canvas at 2x DPR uses ~16MB for the pixel buffer.

WebGL memory is dominated by textures. A 2048x2048 RGBA texture uses 16MB.

## Decision Matrix

Use this table to select the rendering technology. Find the row matching the primary requirement; the column shows the recommended choice.

| Requirement | SVG | Canvas 2D | WebGL |
|------------|-----|-----------|-------|
| < 500 interactive elements | Best | Good | Overkill |
| 500 to 5,000 elements | Avoid | Best | Good |
| 5,000 to 50,000 elements | Avoid | Marginal | Best |
| > 50,000 elements | Avoid | Avoid | Required |
| Click/hover on individual elements | Best | Manual | Manual |
| Accessibility required | Best | Poor | Poor |
| Print / export to PDF | Best | Rasterized | Rasterized |
| Pixel manipulation | N/A | Best | Possible |
| Custom shaders / GPU effects | N/A | N/A | Best |
| Text-heavy rendering | Good | Good | Poor |
| D3 data joins | Best | Manual | Manual |
| Mobile performance critical | Good (low count) | Good | Test carefully |
| Smallest bundle size | Built-in | Built-in | +200KB (PixiJS) |

## Hybrid Approaches

### SVG for UI, Canvas for Animation

Render interactive controls (buttons, labels, tooltips) as SVG overlaid on a Canvas animation layer. This combines SVG's event handling with Canvas's rendering speed.

```html
<div style="position: relative">
  <canvas id="animation" style="position: absolute; top: 0; left: 0"></canvas>
  <svg id="ui" style="position: absolute; top: 0; left: 0; pointer-events: none">
    <g class="tooltip" style="pointer-events: all">
      <!-- Interactive SVG elements here -->
    </g>
  </svg>
</div>
```

Set `pointer-events: none` on the SVG root so mouse events pass through to the canvas. Enable `pointer-events: all` only on interactive SVG elements.

### Canvas for Background, DOM for Content

Use Canvas (or WebGL) for decorative background animation (particles, gradients, noise). Place standard HTML/CSS content on top. This is the most common pattern for landing pages and hero sections.

### D3 with Canvas

D3's data model and scales work with any renderer. Use D3 for data processing and layout, then render to Canvas instead of SVG.

```js
const simulation = d3.forceSimulation(nodes)
  .force("charge", d3.forceManyBody())
  .force("center", d3.forceCenter(width / 2, height / 2));

simulation.on("tick", () => {
  ctx.clearRect(0, 0, width, height);
  nodes.forEach((node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
});
```

This retains D3's force simulation and layout algorithms while rendering at Canvas speeds.

### PixiJS with HTML Overlay

Use PixiJS for the main animation and overlay HTML elements for text, forms, or complex UI. Position HTML elements absolutely over the PixiJS canvas.

## Mobile Performance Considerations

### General Rules

1. **Halve element counts for mobile.** A desktop that handles 5,000 particles at 60fps will struggle at 2,500 on a mid-range phone.
2. **Reduce canvas resolution.** Use 1x DPR on mobile instead of the device's native 2x or 3x. The quality difference is minimal for particle effects.
3. **Test on real devices.** iOS Safari and Android Chrome have different WebGL capabilities. Emulators do not reflect GPU performance.
4. **Watch for thermal throttling.** Mobile GPUs throttle under sustained load. Test animations that run for 30+ seconds.

### Canvas 2D on Mobile

Generally reliable. Avoid `getImageData` (very slow on mobile GPUs). Reduce composite operations (`globalCompositeOperation` changes are expensive).

### WebGL on Mobile

iOS Safari has strict WebGL limits: fewer textures, smaller max texture size, lower precision. Android varies wildly. Test on a Pixel and a low-end Samsung.

PixiJS handles most platform differences automatically. For custom WebGL, check `gl.getParameter(gl.MAX_TEXTURE_SIZE)` and `gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)`.

### SVG on Mobile

Acceptable for low element counts. Avoid SVG filters entirely on mobile; they cause severe performance degradation on iOS Safari.

## OffscreenCanvas

Transfer Canvas rendering to a Web Worker, freeing the main thread for interaction.

```js
// Main thread
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ canvas: offscreen }, [offscreen]);

// Worker
self.onmessage = (e) => {
  const ctx = e.data.canvas.getContext("2d");
  function animate() {
    // draw...
    requestAnimationFrame(animate);
  }
  animate();
};
```

OffscreenCanvas is supported in Chrome, Edge, and Firefox. Safari added support in Safari 16.4. Use feature detection before relying on it.

### When to Use OffscreenCanvas

Use when the main thread is busy with React rendering, complex event handling, or data processing. The animation will not jank even if the main thread blocks. The trade-off is increased complexity: communicating state between threads requires `postMessage` and SharedArrayBuffer or structured cloning.
