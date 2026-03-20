# Lottie Animation Workflow

## After Effects to Lottie Pipeline

### Overview

The workflow: design the animation in Adobe After Effects, export it as a JSON file using the Bodymovin plugin, then play it on the web using lottie-web or a React wrapper. The JSON describes the animation's keyframes, shapes, and transforms in a format the Lottie player can render at any resolution.

### Supported After Effects Features

Lottie supports a subset of After Effects. Design within these constraints to avoid export surprises.

**Fully supported:**
- Shape layers (rectangles, ellipses, paths, polystar, groups)
- Solid color fills and strokes
- Gradient fills and strokes (linear and radial)
- Transform animations (position, scale, rotation, opacity, anchor point)
- Trim paths (line drawing effects)
- Masks (add, subtract, intersect)
- Parenting and null objects
- Pre-compositions
- Time remapping
- Shape repeaters
- Merge paths (on some renderers)

**Not supported (avoid entirely):**
- Expressions (use keyframes instead)
- 3D layers
- Effects (blur, glow, drop shadow, etc.)
- Track mattes with complex blending
- Text layers with per-character animation (use shape layers instead)
- Audio layers
- Footage/video layers
- Distort effects (mesh warp, puppet pin)

**Partially supported (test carefully):**
- Text layers (basic text works; per-character animation is unreliable)
- Auto-orient
- Layer styles (only some renderers)

### After Effects Setup Checklist

1. Set composition size to the intended display size (or a clean multiple of it).
2. Use 24fps or 30fps. Higher frame rates increase file size without visible benefit for most UI animations.
3. Keep the composition duration as short as possible. Every extra frame adds to the JSON.
4. Use shape layers exclusively. Convert illustrator paths to shape layers via "Create Shapes from Vector Layer."
5. Flatten unnecessary pre-compositions. Each pre-comp adds nesting and file size.
6. Name all layers descriptively. Layer names appear in the JSON and help with debugging.

## Bodymovin Plugin Usage

### Installation

Install Bodymovin from the ZXP Installer or Adobe Exchange. After installation, access it from Window > Extensions > Bodymovin.

### Export Settings

1. Open the Bodymovin panel.
2. Select the composition to export.
3. Set the destination folder.
4. Configure settings:

| Setting | Recommended Value | Notes |
|---------|------------------|-------|
| Export Mode | Standard | Use "Demo" only for preview testing |
| Glyphs | Off | Unless text layers are intentional |
| Extra Compositions | Off | Export only the selected comp |
| Include Hidden | Off | Exclude hidden layers from output |
| Original Assets | Off (usually) | On only if raster images are needed |
| Standalone | Off | Use the player separately |
| Compression | Off | Optimize post-export instead |

5. Click Render.
6. The output is a `.json` file (and optionally an `images/` folder if raster assets are used).

### Validation

After export, open the JSON in the Lottie previewer at lottiefiles.com or in the Bodymovin preview. Compare frame-by-frame against After Effects. Common discrepancies: trim path direction, mask mode rendering, gradient alignment.

## lottie-web Player Configuration

### Installation

```bash
npm install lottie-web
```

### Basic Usage

```js
import lottie from 'lottie-web';

const animation = lottie.loadAnimation({
  container: document.getElementById('lottie-container'),
  renderer: 'svg',        // 'svg', 'canvas', or 'html'
  loop: true,
  autoplay: true,
  path: '/animations/loading.json',  // URL to JSON
  // OR
  animationData: jsonData,           // Inline JSON object
});
```

### Renderer Comparison

| Renderer | Pros | Cons |
|----------|------|------|
| `svg` | Crisp at any scale, smallest memory, widest feature support | Slower for complex animations (many paths) |
| `canvas` | Faster rendering for complex animations, lower CPU for many shapes | Blurry on scale, no DOM interactivity on shapes |
| `html` | DOM elements (can style with CSS) | Least feature support, most memory |

**Default recommendation:** Use `svg` unless profiling shows performance issues, then switch to `canvas`.

### Configuration Options

```js
lottie.loadAnimation({
  container: element,
  renderer: 'svg',
  loop: false,                    // Play once
  autoplay: false,                // Manual start
  name: 'myAnimation',           // Reference name for lottie.play('myAnimation')
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid meet',   // SVG viewBox scaling
    progressiveLoad: true,                    // Load frames progressively
    hideOnTransparent: true,                  // Hide invisible layers (performance)
    className: 'lottie-svg',                  // CSS class on the SVG element
  },
});
```

## React Integration (lottie-react)

### Installation

```bash
npm install lottie-react
```

### Basic Component

```tsx
import Lottie from 'lottie-react';
import loadingAnimation from './loading.json';

function LoadingSpinner() {
  return (
    <Lottie
      animationData={loadingAnimation}
      loop
      autoplay
      style={{ width: 120, height: 120 }}
    />
  );
}
```

### With Ref for Playback Control

```tsx
import { useRef } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import checkAnimation from './check.json';

function CheckMark({ play }) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (play) {
      lottieRef.current?.goToAndPlay(0);
    }
  }, [play]);

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={checkAnimation}
      loop={false}
      autoplay={false}
      style={{ width: 64, height: 64 }}
    />
  );
}
```

### Event Handlers

```tsx
<Lottie
  animationData={data}
  onComplete={() => console.log('Animation finished')}
  onLoopComplete={() => console.log('Loop completed')}
  onEnterFrame={(e) => console.log('Frame:', e.currentTime)}
  onSegmentStart={() => console.log('Segment started')}
/>
```

## Controlling Playback

### Play, Pause, Stop

```js
const animation = lottie.loadAnimation({ ... });

animation.play();           // Start or resume
animation.pause();          // Pause at current frame
animation.stop();           // Stop and reset to frame 0
```

### Speed Control

```js
animation.setSpeed(2);      // 2x speed
animation.setSpeed(0.5);    // Half speed
animation.setSpeed(-1);     // Reverse playback
```

### Seeking

```js
animation.goToAndPlay(30, true);   // Go to frame 30 and play (true = frames, false = seconds)
animation.goToAndStop(0, true);    // Go to frame 0 and stop
```

### Playing Segments

```js
animation.playSegments([0, 30], true);       // Play frames 0 to 30, then stop
animation.playSegments([[0, 15], [30, 60]]); // Chain multiple segments
```

The second argument (`true`) forces the segment to start immediately. Without it, the segment queues after the current playback.

### Direction

```js
animation.setDirection(1);   // Forward
animation.setDirection(-1);  // Reverse
```

### React Hook Pattern

```tsx
function usePlayback(lottieRef) {
  return {
    play: () => lottieRef.current?.play(),
    pause: () => lottieRef.current?.pause(),
    stop: () => lottieRef.current?.stop(),
    setSpeed: (s) => lottieRef.current?.setSpeed(s),
    goTo: (frame) => lottieRef.current?.goToAndStop(frame, true),
    playSegment: (start, end) =>
      lottieRef.current?.playSegments([start, end], true),
  };
}
```

## Optimizing Lottie JSON File Size

### Pre-Export (After Effects)

1. **Reduce keyframe count.** Remove keyframes that do not meaningfully change the animation. If two keyframes produce nearly identical interpolation, delete the middle one.
2. **Simplify paths.** Reduce the number of points in shape paths. Use Illustrator's Simplify command before importing into AE.
3. **Flatten pre-compositions.** Each pre-comp level adds overhead. Flatten when possible.
4. **Remove hidden layers.** Uncheck "Include Hidden" in Bodymovin.
5. **Avoid raster assets.** Each embedded image bloats the JSON with base64 data. Use shape layers instead.
6. **Minimize layer count.** Merge shape groups where possible.

### Post-Export (JSON Optimization)

1. **Round decimal places.** Lottie JSON often includes 6+ decimal places on path coordinates. Rounding to 2 decimal places can reduce file size by 20% to 40% with no visible quality loss.

```bash
# Using lottie-optimizer or a custom script
npx lottie-optimize input.json output.json --precision 2
```

2. **Remove unused properties.** Strip `nm` (name) fields if debugging is not needed. Strip `mn` (match name) fields.

3. **Compress with gzip/brotli.** Lottie JSON compresses extremely well. A 100KB JSON typically compresses to 15 to 25KB with gzip.

4. **Use .lottie format.** The `.lottie` format is a zip archive containing the JSON and any assets. It is 50% to 70% smaller than raw JSON. lottie-web supports `.lottie` files via the `DotLottie` player.

```bash
npm install @dotlottie/player-component
```

### Size Targets

| Animation Type | Raw JSON | Gzipped | Target |
|---------------|----------|---------|--------|
| Icon animation | 5 to 15 KB | 2 to 5 KB | Under 10 KB gzipped |
| Button feedback | 10 to 30 KB | 3 to 8 KB | Under 15 KB gzipped |
| Loading animation | 15 to 50 KB | 5 to 15 KB | Under 20 KB gzipped |
| Illustration | 50 to 200 KB | 15 to 60 KB | Under 50 KB gzipped |
| Full-screen hero | 200 to 800 KB | 60 to 200 KB | Under 100 KB gzipped |

If the gzipped size exceeds these targets, revisit the After Effects composition for simplification opportunities.

## prefers-reduced-motion: Show First or Last Frame

Lottie animations are often decorative. Under reduced motion, display a static frame instead of animating.

### Strategy: Show First Frame

```tsx
function SafeLottie({ animationData, ...props }) {
  const reduced = useReducedMotion(); // from motion/react

  return (
    <Lottie
      animationData={animationData}
      autoplay={!reduced}
      loop={!reduced}
      initialSegment={reduced ? [0, 1] : undefined}
      {...props}
    />
  );
}
```

`initialSegment={[0, 1]}` constrains the player to frame 0 only.

### Strategy: Show Last Frame

Useful when the animation's end state is the meaningful visual (e.g., a checkmark that draws in).

```tsx
function CompletionLottie({ animationData, ...props }) {
  const reduced = useReducedMotion();
  const lottieRef = useRef(null);
  const totalFrames = animationData.op; // Last frame number from JSON

  useEffect(() => {
    if (reduced) {
      lottieRef.current?.goToAndStop(totalFrames - 1, true);
    }
  }, [reduced, totalFrames]);

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={animationData}
      autoplay={!reduced}
      loop={false}
      {...props}
    />
  );
}
```

### Strategy: CSS Replacement

For decorative Lottie animations, replace the entire player with a static SVG or PNG under reduced motion.

```tsx
function HeroAnimation() {
  const reduced = useReducedMotion();

  if (reduced) {
    return <img src="/hero-static.svg" alt="" aria-hidden="true" />;
  }

  return <Lottie animationData={heroAnimation} loop autoplay />;
}
```

This eliminates the Lottie player's JavaScript execution entirely for users who do not want animation.

### JavaScript Check (Non-React)

```js
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const animation = lottie.loadAnimation({
  container: element,
  renderer: 'svg',
  loop: !prefersReduced,
  autoplay: !prefersReduced,
  animationData: data,
});

if (prefersReduced) {
  animation.goToAndStop(0, true);
}
```
