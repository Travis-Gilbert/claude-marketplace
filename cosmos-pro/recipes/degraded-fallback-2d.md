# degraded-fallback-2d

When WebGL is unavailable or the device is too weak, hand off to the
Sigma 2D fallback (already available in the runtime project via
`@react-sigma/core`). The user sees a working graph with reduced
fidelity, not a black canvas.

## Minimal working code

Capability check at app load:

```ts
function canRunCosmos(): boolean {
  if (typeof window === "undefined") return false;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
  if (!gl) return false;
  if (!gl.getExtension("EXT_float_blend")) return false;
  if (!gl.getExtension("OES_texture_float")) return false;
  return true;
}
```

Component picks the renderer:

```tsx
import { lazy, Suspense, useMemo } from "react";

const CosmosCanvas = lazy(() => import("./CosmosGraphCanvas"));
const SigmaCanvas = lazy(() => import("./SigmaGraphCanvas"));

export function GraphCanvas({ directive, data }: Props) {
  const canCosmos = useMemo(canRunCosmos, []);
  return (
    <Suspense fallback={<BootingFallback />}>
      {canCosmos
        ? <CosmosCanvas directive={directive} />
        : <SigmaCanvas directive={directive} data={data} />}
    </Suspense>
  );
}
```

The Sigma canvas implements the same `directive` prop interface but
with a reduced feature set:

- No GPU heatmap overlay (`gpu-heatmap-overlay.md` doesn't apply).
- No drag-to-reshape (or implement via Sigma's drag, not cosmos.gl's).
- Fewer points per second on filter changes — degrade gracefully.

## Tuning notes

- Capability detection is cheap; do it once at mount and cache the
  result. Don't re-detect per render.
- Some devices report WebGL2 as available but crash on heavy load.
  Add a "fallback to 2D" toggle in the user-facing settings so the
  user can opt out manually.
- Visual parity between cosmos.gl and Sigma is not the goal. Functional
  parity is — the user can still answer the same question.
- The directive contract still applies in 2D mode. The Sigma
  implementation has its own adapter that consumes SceneDirectives
  and produces Sigma updates; this adapter lives in a separate file
  but follows the same phase model.

## When to use this

- The app needs to work on devices that can't run cosmos.gl.
- iOS Safari with the EXT_float_blend regression (historic, mostly
  resolved but still possible).
- Low-end Android without OES_texture_float.
- Embedded webviews with limited WebGL support.
- Accessibility / preference: a user prefers 2D for any reason.

## When NOT to use this

- The runtime project doesn't include `@react-sigma/core`. Add the
  dep first.
- The cosmos.gl path is failing for a reason that's not capability —
  diagnose the actual cause before falling back. Sigma fallback is
  for genuine capability gaps, not for hiding bugs.
- The view is so cosmos.gl-specific (e.g., relies on the GPU heatmap
  overlay) that no meaningful 2D version exists. Make the cosmos.gl
  path more conservative instead.
