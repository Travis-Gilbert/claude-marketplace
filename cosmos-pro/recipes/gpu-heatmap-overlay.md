# gpu-heatmap-overlay

Render a density heatmap layer behind the cosmos.gl force graph using
`@luma.gl/shadertools` (the runtime project pins luma at 9.2.6 per the
brief). The heatmap shares the same world-space coordinates as
cosmos.gl, so points and density align without per-frame projection.

## Minimal working code

Approach: a separate WebGL canvas (or layered canvas) draws the
heatmap; cosmos.gl draws the points and links above it. Both use the
same view transform so a brush or zoom on cosmos.gl updates the
heatmap's view too.

```ts
import { Graph } from "@cosmos.gl/graph";
import { ShaderModule, assembleShaderPair } from "@luma.gl/shadertools";

// 1. Heatmap canvas behind cosmos.gl
const heatmapCanvas = document.querySelector<HTMLCanvasElement>("#heatmap")!;
const cosmosCanvas = document.querySelector<HTMLCanvasElement>("#cosmos")!;

// 2. Build the density shader module
const densityShader: ShaderModule = {
  name: "density",
  fs: /* glsl */ `
    uniform sampler2D u_heatmap;
    uniform vec3 u_lo;
    uniform vec3 u_hi;
    vec4 density_apply(vec2 uv) {
      float v = texture(u_heatmap, uv).r;
      return vec4(mix(u_lo, u_hi, v), v);
    }
  `,
};

// 3. Render the heatmap at world coordinates matching cosmos.gl's view.
//    The cosmos.gl camera transform is exposed via graph.getView() (or
//    equivalent — verify in refs/cosmos-gl/).
const graph = new Graph(cosmosCanvas, { /* ... */ });
graph.onZoom = (transform) => {
  redrawHeatmap(heatmapCanvas, transform);
};
```

The exact shader assembly and `getView()` call must be verified against
`refs/cosmos-gl/` and `refs/luma-gl/`. The shape above is the pattern,
not the API contract.

## Tuning notes

- Density bandwidth (kernel radius) is the most important visual knob.
  Small radius (5-10px in world space) shows individual point density.
  Large radius (50+px) shows broad regions.
- Color ramp matters more than for any other recipe. Dark-to-warm-to-hot
  reads as "more here." Avoid rainbow ramps (perceptually misleading).
- Heatmap recompute is expensive. Cache the density texture; only
  recompute when the underlying point set changes (filter or layer
  switch), not when the camera moves. Camera changes only trigger a
  re-projection, not a re-density.
- The heatmap canvas must be cleared and redrawn on every frame the
  user sees — but the texture upload only happens on data change.

## When to use this

- The graph has 50K+ points and individual nodes lose meaning at
  overview zoom; density shows where the action is.
- The user is asking about regions / clusters / hotspots rather than
  individual nodes.
- A separate visual layer behind the points adds genuine information,
  not decoration.

## When NOT to use this

- Point count is <5K. The density layer is noise; just render the
  points.
- The aesthetic is "clean editorial" — heatmaps are inherently busy
  and clash with the editorial preset (route to `style-director` in
  d3-pro for the aesthetic question).
- The runtime project doesn't have luma.gl pinned. Don't add the
  dependency for a single recipe; reconsider whether density is needed.
- The data is too sparse for density to be meaningful (everything is
  individually distinguishable already).
