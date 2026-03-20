# WebGL Fallback and Progressive Enhancement

Not every browser or device supports WebGL reliably. Some users disable hardware acceleration. Some have old GPUs. Some prefer reduced motion. Build 3D features as progressive enhancements on top of functional 2D interfaces, never as hard requirements.

## WebGL Capability Detection

### Basic Detection

```ts
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return gl !== null;
  } catch {
    return false;
  }
}
```

### Extended Detection

```ts
function getWebGLCapabilities() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

  if (!gl) return null;

  return {
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
    renderer: gl.getParameter(gl.RENDERER),
    vendor: gl.getParameter(gl.VENDOR),
    isWebGL2: gl instanceof WebGL2RenderingContext,
  };
}
```

### Using Drei's Detection

```ts
import { useDetectGPU } from '@react-three/drei';

function QualitySelector() {
  const GPUTier = useDetectGPU();
  // GPUTier.tier: 0 (low), 1 (medium), 2 (high), 3 (very high)
  // GPUTier.isMobile: boolean
  // GPUTier.gpu: string (GPU model name)
}
```

## React Suspense Boundary for 3D Components

Wrap 3D components in Suspense to handle loading states.

```tsx
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

function Page() {
  return (
    <div>
      <h1>Product Overview</h1>
      {isWebGLAvailable() ? (
        <Suspense fallback={<ProductImage />}>
          <Canvas>
            <Product3D />
          </Canvas>
        </Suspense>
      ) : (
        <ProductImage />
      )}
    </div>
  );
}
```

## Lazy Loading the 3D Bundle

Three.js and its dependencies add 200KB to 500KB+ to the bundle. Lazy-load the 3D component so the initial page load is fast.

```tsx
import { lazy, Suspense } from 'react';

const ProductViewer3D = lazy(() => import('./ProductViewer3D'));

function ProductSection() {
  const [show3D, setShow3D] = useState(false);
  const webglAvailable = isWebGLAvailable();

  return (
    <div>
      {show3D && webglAvailable ? (
        <Suspense fallback={<ProductImage />}>
          <ProductViewer3D />
        </Suspense>
      ) : (
        <>
          <ProductImage />
          {webglAvailable && (
            <button onClick={() => setShow3D(true)}>
              View in 3D
            </button>
          )}
        </>
      )}
    </div>
  );
}
```

### Next.js Dynamic Import

```tsx
import dynamic from 'next/dynamic';

const ProductViewer3D = dynamic(() => import('./ProductViewer3D'), {
  ssr: false,
  loading: () => <ProductImage />,
});
```

Set `ssr: false` for any component that uses Three.js. WebGL APIs do not exist in Node.js.

## Falling Back to Existing 2D Components

### Design Principle

Never leave a blank space or broken state when 3D fails. The fallback must be a fully functional 2D representation of the same content.

| 3D Feature | 2D Fallback |
|-----------|-------------|
| Interactive product viewer | Static product image carousel |
| 3D data visualization | D3 or SVG chart |
| Animated hero | CSS-animated hero with static image |
| Force-directed graph | 2D force layout (d3-force, no z-axis) |
| 3D globe | SVG map projection |

### Implementation Pattern

```tsx
function DataVisualization({ data }) {
  const webglAvailable = useWebGLCheck();

  if (!webglAvailable) {
    return <Chart2D data={data} />;
  }

  return (
    <ErrorBoundary fallback={<Chart2D data={data} />}>
      <Suspense fallback={<Chart2D data={data} />}>
        <Canvas>
          <Chart3D data={data} />
        </Canvas>
      </Suspense>
    </ErrorBoundary>
  );
}
```

Three layers of protection:
1. WebGL detection prevents loading the Canvas at all.
2. Suspense handles the loading state.
3. ErrorBoundary catches runtime WebGL errors (context loss, shader compilation failure).

## prefers-reduced-motion in 3D

### Detecting the Preference

```ts
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

### Static Render (Freeze Animation)

When the user prefers reduced motion, render the 3D scene but freeze all animation.

```tsx
function AnimatedScene() {
  const reducedMotion = usePrefersReducedMotion();

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    meshRef.current.rotation.y = clock.getElapsedTime();
  });

  return <mesh ref={meshRef}>{/* ... */}</mesh>;
}
```

### Hook Implementation

```ts
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
```

### Reduced-Motion Guidelines

- Disable continuous rotation, pulsing, and particle effects.
- Allow user-initiated animation (click to rotate, scroll to advance).
- Keep transitions short and direct (no bounce, no overshoot).
- Disable auto-play sequences. Let the user trigger them.

## Progressive Enhancement Approach

### Tier System

Define quality tiers and select based on device capabilities.

```ts
type QualityTier = 'high' | 'medium' | 'low' | 'fallback';

function selectQualityTier(): QualityTier {
  if (!isWebGLAvailable()) return 'fallback';
  if (prefersReducedMotion()) return 'low';

  const caps = getWebGLCapabilities();
  if (!caps) return 'fallback';
  if (!caps.isWebGL2) return 'low';

  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  if (isMobile) return 'medium';

  return 'high';
}
```

### What to Scale Per Tier

| Setting | High | Medium | Low |
|---------|------|--------|-----|
| Pixel ratio | Device native (max 2) | 1.5 | 1 |
| Shadows | On | Off | Off |
| Post-processing | Full | Minimal | None |
| Geometry detail | Full | Reduced | Minimal |
| Texture resolution | 2048 | 1024 | 512 |
| Particle count | Full | 50% | 10% |
| Anti-aliasing | MSAA 4x | FXAA | None |

## Mobile Detection and Quality Reduction

### Mobile Optimizations

```tsx
const isMobile = useIsMobile();

<Canvas
  dpr={isMobile ? 1 : [1, 2]}
  gl={{
    antialias: !isMobile,
    powerPreference: isMobile ? 'low-power' : 'high-performance',
  }}
>
  <Scene
    shadows={!isMobile}
    particleCount={isMobile ? 100 : 1000}
    postProcessing={!isMobile}
  />
</Canvas>
```

Set `powerPreference: 'low-power'` on mobile to request the integrated GPU (better battery life). Set `'high-performance'` on desktop to request the discrete GPU.

## Error Boundary for WebGL Context Loss

### What Causes Context Loss

- Too many WebGL contexts open (browsers limit to ~8 to 16).
- GPU driver crash or reset.
- System memory pressure.
- Switching away from the tab for extended periods.

### Error Boundary Component

```tsx
class WebGLErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('WebGL error:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

### Handling Context Loss Events

```ts
useEffect(() => {
  const canvas = gl.domElement;

  const handleLost = (event: Event) => {
    event.preventDefault(); // Allows restoration
    console.warn('WebGL context lost');
  };

  const handleRestored = () => {
    console.log('WebGL context restored');
  };

  canvas.addEventListener('webglcontextlost', handleLost);
  canvas.addEventListener('webglcontextrestored', handleRestored);

  return () => {
    canvas.removeEventListener('webglcontextlost', handleLost);
    canvas.removeEventListener('webglcontextrestored', handleRestored);
  };
}, [gl]);
```

Call `event.preventDefault()` on the `webglcontextlost` event. This signals to the browser that the application wants to recover. Without it, the context is permanently lost.

### Recovery Strategy

After context restoration, Three.js automatically re-compiles shaders and re-creates buffers. Textures may need to be re-uploaded. For `useGLTF` or `useTexture`, cached resources rebuild automatically. For manually created textures, set `texture.needsUpdate = true` after restoration.

If the context is lost repeatedly, fall back to the 2D alternative permanently for that session.

```ts
let contextLossCount = 0;

function handleContextLost(event: Event) {
  event.preventDefault();
  contextLossCount++;

  if (contextLossCount >= 2) {
    setUseFallback(true);
  }
}
```
