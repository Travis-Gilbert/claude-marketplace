# NPR Techniques for Three.js

Non-photorealistic rendering techniques for matching the studio-journal
aesthetic of travisgilbert.me. Photorealistic rendering is not appropriate
for this site. Every 3D scene should feel hand-drawn, warm, and sketchy.

## Approach 1: Sobel Edge Detection (Post-Processing)

The most reliable and widely-tested approach. Renders the scene normally,
then detects edges in a post-processing pass.

### How It Works

1. Render the scene to the default framebuffer (color)
2. Render normals to a secondary render target using `MeshNormalMaterial`
   as a scene override
3. Read depth from the renderer's depth buffer
4. In a fragment shader, apply the Sobel operator to both buffers
5. Where edges are detected, draw lines in the ink color (#1F1B18)
6. Optionally displace edge positions with noise for hand-drawn wobble

### The Sobel Operator

A 3x3 convolution kernel that detects gradients (sharp changes) in an
image. Two kernels are applied: one for horizontal gradients (Gx), one
for vertical (Gy). The combined magnitude `sqrt(Gx^2 + Gy^2)` gives
edge strength.

```
Gx kernel:        Gy kernel:
-1  0  +1         -1  -2  -1
-2  0  +2          0   0   0
-1  0  +1         +1  +2  +1
```

When applied to the normal buffer, this detects edges where surface
orientation changes sharply (object boundaries, creases, hard edges).
When applied to the depth buffer, it detects edges where depth changes
sharply (silhouettes, overlapping objects).

### References
- Three.js: `examples/webgl_postprocessing_sobel.html`
- Codrops: "Sketchy Pencil Effect with Three.js Post-Processing" (maya_ndljk)
- Implementation: `examples/09-sketch-postprocessing.tsx`

## Approach 2: Pencil/Sketch Shading (Post-Processing)

Extends Sobel edge detection with hatching patterns in shadow regions.

### How It Works

1. Same edge detection as Approach 1
2. Additionally, compute luminance of each pixel
3. In dark areas (low luminance), overlay diagonal line patterns
4. Line density increases with darkness (more hatching = darker)
5. Cross-hatching (two intersecting line sets) for the darkest areas
6. Paper texture multiplied over the entire image

### Hatching Fragment Shader Pattern

```glsl
float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));

if (luminance < threshold) {
  float darkness = 1.0 - luminance / threshold;
  vec2 pixel = vUv * resolution;

  // Diagonal lines at 45 degrees
  float line1 = mod(pixel.x + pixel.y, density / (darkness * 2.0 + 1.0));
  float hatch = step(1.0, line1);

  // Cross-hatch for very dark areas
  if (darkness > 0.5) {
    float line2 = mod(pixel.x - pixel.y, density / (darkness + 0.5));
    hatch *= step(1.0, line2);
  }

  color.rgb = mix(hatchColor, color.rgb, hatch);
}
```

### References
- Codrops: "Sketchy Pencil Effect" (pencil shadow technique)
- Implementation: `examples/09-sketch-postprocessing.tsx` (CrossHatchShader)

## Approach 3: Moebius Style (Post-Processing)

A comprehensive NPR pipeline combining edges, color quantization, and
hatching. Named after the art style of Jean Giraud (Moebius).

### How It Works

1. Sobel edge detection on normals + depth (same as Approach 1)
2. Color quantization: reduce the continuous color range to discrete
   bands (like cel/toon shading). This flattens the appearance.
3. Hatching in shadow regions (same as Approach 2)
4. Color temperature separation: shadows get cooler tones, lit areas
   get warmer tones (Gooch shading influence)
5. Paper texture overlay for warmth

### Color Quantization

```glsl
// Quantize to N levels
float levels = 4.0;
vec3 quantized = floor(color.rgb * levels + 0.5) / levels;
```

### References
- Maxime Heckel: "Moebius-style post-processing and other stylized shaders"
- Blog post includes full R3F implementation with custom Effect class

## Approach 4: Vertex Wobble (Vertex Shader)

The simplest NPR technique. Adds small random displacement to vertex
positions, making geometry look hand-drawn and imprecise.

### How It Works

1. In the vertex shader, compute a noise value from position + time
2. Displace the vertex along its normal by that noise value
3. The displacement changes over time, creating subtle movement
4. Works with any geometry, no post-processing needed

### Key Parameters

- **Frequency**: how "busy" the wobble looks (higher = more variation)
- **Amplitude**: how far vertices move (0.01 to 0.05 for subtle)
- **Time factor**: how fast the wobble animates (0.3 to 1.0)

### Implementation

```glsl
// In vertex shader
float wobble = noise3D(position * frequency + time * speed) * amplitude;
vec3 displaced = position + normal * wobble;
gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
```

### References
- Implementation: `examples/10-shader-material.tsx` (WobbleMaterial)

## Approach 5: Screen-Space Rough.js Overlay

The most faithful reproduction of the site's existing aesthetic, but
also the most complex to implement.

### How It Works

1. Render the 3D scene with flat/minimal materials
2. Extract edge data via Sobel post-processing
3. Project edge pixels back to 2D screen coordinates
4. Render edges using rough.js on a 2D canvas overlay
5. The 2D canvas sits on top of the 3D canvas (CSS stacking)

This is the only approach that produces actual rough.js strokes
(with the hand-drawn SVG path generation that rough.js is known for).
The tradeoff is complexity: projecting 3D edges to 2D is non-trivial,
and the two-canvas approach has performance implications.

### When to Use

Consider this for isolated, high-impact moments (a hero visualization,
a loading screen) rather than as the default for every scene. The
Sobel edge approach (Approach 1) is better for continuous use.

## Recommended Default: Approach 1 + 4

For most scenes on travisgilbert.me:

1. **Sobel edge detection** (Approach 1) with ink-colored edges and
   subtle hand-drawn wobble via noise displacement
2. **Vertex wobble** (Approach 4) on key objects for imprecise geometry
3. **No bloom, no DOF, no SSAO** (these are photorealistic effects)
4. **Paper color tint** in the post-processing pass (#F7F2EA at 8-15% opacity)

This combination produces a consistent sketch aesthetic with good
performance and minimal complexity.
