# SVG Animation

Reference for animating SVG elements using Vivus.js, CSS, SMIL, path morphing, and anime.js. Covers stroke drawing, property animation, motion paths, performance, and accessibility.

## Vivus.js: Stroke Drawing Animation

Vivus.js animates the `stroke-dashoffset` of SVG paths to create a "drawing" effect where the stroke appears to be drawn by hand.

### Setup

```html
<svg id="my-svg" viewBox="0 0 200 200">
  <path d="M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80" fill="none" stroke="#333" stroke-width="2"/>
</svg>
```

```js
import Vivus from "vivus";

new Vivus("my-svg", {
  type: "oneByOne",
  duration: 200,        // total duration in frames (not ms)
  animTimingFunction: Vivus.EASE_OUT,
});
```

### Animation Types

| Type | Behavior |
|------|----------|
| `delayed` | Each path starts slightly after the previous one. Default overlap is 60%. |
| `sync` | All paths draw simultaneously. Each path completes in `duration` frames. |
| `oneByOne` | Each path draws completely before the next begins. |
| `scenario` | Per-path timing via `data-start` and `data-duration` attributes. |

### Scenario Mode

Define custom timing per path element:

```html
<path data-start="0" data-duration="100" d="..." />
<path data-start="50" data-duration="150" d="..." />
```

Paths can overlap. `data-start` and `data-duration` are in frames.

### Callbacks and Control

```js
const vivus = new Vivus("my-svg", { type: "sync", duration: 150 }, (obj) => {
  // Called when animation completes
  console.log("Done!", obj);
});

// Manual control
vivus.play();       // Play forward
vivus.play(-1);     // Play in reverse
vivus.stop();       // Pause
vivus.reset();      // Jump to start
vivus.finish();     // Jump to end
vivus.setFrameProgress(0.5); // Jump to 50%
```

### SVG Requirements for Vivus

1. Paths must have a `stroke` attribute (not just CSS).
2. Paths must have `fill="none"` or Vivus will add it.
3. `<circle>`, `<rect>`, `<line>`, `<polyline>`, `<polygon>`, and `<ellipse>` are supported. They are internally converted to paths.
4. Nested `<svg>` elements are not supported.

### Manual Stroke Drawing (No Library)

The technique Vivus uses can be implemented manually:

```js
const path = document.querySelector("path");
const length = path.getTotalLength();

// Set up initial state
path.style.strokeDasharray = length;
path.style.strokeDashoffset = length;

// Animate
path.style.transition = "stroke-dashoffset 2s ease-out";
path.style.strokeDashoffset = 0;
```

For multiple paths, stagger the transitions with `transition-delay`.

## CSS Animation of SVG Properties

### Animatable SVG Properties

| Property | CSS Syntax | Notes |
|----------|-----------|-------|
| `stroke-dashoffset` | `stroke-dashoffset: 0` | Line drawing effect |
| `stroke-dasharray` | `stroke-dasharray: 10 5` | Dash pattern |
| `fill` | `fill: red` | Fill color (also via `color` with `currentColor`) |
| `opacity` | `opacity: 0.5` | Element opacity |
| `transform` | `transform: rotate(45deg)` | Rotation, scale, translate |
| `stroke-width` | `stroke-width: 3` | Line thickness |
| `stroke` | `stroke: blue` | Stroke color |
| `r` (circle radius) | `r: 20px` | Circle radius (CSS Geometry Properties) |
| `cx`, `cy` | `cx: 50px` | Circle/ellipse center |

### Transform Origin

SVG transforms default to the origin (0, 0) of the SVG coordinate system, not the element's center. Set `transform-origin` explicitly.

```css
.spinning-gear {
  transform-origin: center;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

For SVG elements, `transform-origin: center` refers to the center of the element's bounding box (in most modern browsers). For older browsers, calculate the center manually and use `transform-origin: 50px 50px`.

### Stroke Drawing with Pure CSS

```css
.draw-path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw 3s ease forwards;
}

@keyframes draw {
  to { stroke-dashoffset: 0; }
}
```

Set `stroke-dasharray` to the path length (or a value larger than the path length). Compute the exact length with `path.getTotalLength()` in JavaScript and set it as a CSS custom property:

```js
const len = path.getTotalLength();
path.style.setProperty("--path-length", len);
```

```css
.draw-path {
  stroke-dasharray: var(--path-length);
  stroke-dashoffset: var(--path-length);
  animation: draw 2s ease forwards;
}

@keyframes draw {
  to { stroke-dashoffset: 0; }
}
```

### Staggered Path Drawing

```css
.draw-path:nth-child(1) { animation-delay: 0s; }
.draw-path:nth-child(2) { animation-delay: 0.3s; }
.draw-path:nth-child(3) { animation-delay: 0.6s; }
```

Or set delays dynamically:

```js
paths.forEach((path, i) => {
  path.style.animationDelay = `${i * 0.2}s`;
});
```

## SMIL Animation

SVG's built-in animation language. Embedded directly in SVG markup. No JavaScript required.

### animate

Animate a single attribute over time.

```svg
<circle cx="50" cy="50" r="20" fill="red">
  <animate attributeName="cx" from="50" to="250" dur="2s" repeatCount="indefinite" />
</circle>
```

### animateTransform

Apply animated transforms.

```svg
<rect x="-25" y="-25" width="50" height="50" fill="blue">
  <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3s" repeatCount="indefinite" />
</rect>
```

Transform types: `rotate`, `scale`, `translate`, `skewX`, `skewY`.

### animateMotion

Move an element along a path.

```svg
<circle r="5" fill="green">
  <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
    <mpath href="#motion-path"/>
  </animateMotion>
</circle>

<path id="motion-path" d="M10,80 Q95,10 180,80 T350,80" fill="none" stroke="none"/>
```

`rotate="auto"` aligns the element's orientation with the path direction. Use `rotate="auto-reverse"` for the opposite direction.

### SMIL Timing

| Attribute | Values | Notes |
|-----------|--------|-------|
| `begin` | `0s`, `2s`, `click`, `other.end` | Start trigger |
| `dur` | `3s`, `500ms` | Duration |
| `end` | `5s`, `click` | End trigger |
| `repeatCount` | `3`, `indefinite` | Repeat count |
| `fill` | `freeze`, `remove` | Behavior after completion |

Chain animations:

```svg
<animate id="phase1" attributeName="opacity" from="0" to="1" dur="1s" fill="freeze" />
<animate attributeName="cx" from="50" to="200" dur="1s" begin="phase1.end" fill="freeze" />
```

### Browser Support

SMIL is supported in Chrome, Firefox, Safari, and Edge (Chromium). Chrome briefly deprecated it but reversed the decision. It is safe to use for decorative animations.

## SVG Path Morphing

### Concept

Morph one SVG path into another by interpolating between their `d` attributes. Both paths must have the same number and type of commands (same structure, different coordinates).

### With D3

```js
import { interpolatePath } from "d3-interpolate-path";

const interpolator = interpolatePath(startPathD, endPathD);

d3.select("path")
  .transition()
  .duration(1000)
  .attrTween("d", () => interpolator);
```

`d3-interpolate-path` handles paths with different numbers of commands by inserting intermediate points. This is more robust than raw `d3.interpolateString`.

### With anime.js

```js
anime({
  targets: "path",
  d: [
    { value: "M10 80 Q 95 10 180 80" },
    { value: "M10 80 Q 95 150 180 80" },
  ],
  duration: 2000,
  easing: "easeInOutQuad",
  loop: true,
  direction: "alternate",
});
```

anime.js interpolates path data automatically. For best results, ensure both paths have compatible command structures.

### Flubber

The `flubber` library morphs between arbitrary shapes, even with different command counts.

```js
import { interpolate } from "flubber";

const morph = interpolate(startPath, endPath);
// morph(0) = startPath, morph(1) = endPath
// Intermediate values produce smooth transitions
```

Flubber decomposes complex paths and matches sub-shapes for smooth transitions.

## anime.js SVG Capabilities

### Line Drawing

```js
anime({
  targets: "path",
  strokeDashoffset: [anime.setDashoffset, 0],
  easing: "easeInOutSine",
  duration: 2000,
  delay: (el, i) => i * 200,
});
```

`anime.setDashoffset` is a utility that reads the path length and sets the initial dasharray and offset automatically.

### Transform Animation

```js
anime({
  targets: ".svg-element",
  translateX: 250,
  rotate: "1turn",
  scale: 1.5,
  duration: 1000,
  easing: "easeOutElastic(1, .5)",
});
```

### SVG Attributes

```js
anime({
  targets: "circle",
  cx: [50, 250],
  cy: [50, 150],
  r: [10, 30],
  fill: ["#FF0000", "#0000FF"],
  duration: 1500,
});
```

### Timeline

```js
const tl = anime.timeline({ easing: "easeOutExpo", duration: 750 });

tl.add({ targets: "#shape1", translateX: 250 })
  .add({ targets: "#shape2", translateX: 250 }, "-=600") // overlap by 600ms
  .add({ targets: "#shape3", translateX: 250 }, "-=600");
```

## Performance: SVG Animation vs Canvas

### When SVG Animation Wins

- Small number of elements (< 100 animated).
- CSS transitions and transforms can be GPU-accelerated.
- No JavaScript needed for simple animations (pure CSS or SMIL).
- Inspector tools show each element, enabling visual debugging.

### When Canvas Wins

- Many elements (> 500 animated).
- Pixel-level effects (blur, glow, noise).
- Complex per-frame logic.
- Better memory efficiency at scale.

### SVG Animation Performance Tips

1. **Promote to GPU layer.** Use `will-change: transform` on animated elements.
2. **Avoid animating `d`.** Path data interpolation is expensive. Prefer transforms.
3. **Use `<use>` for clones.** Reduces DOM size for repeated shapes.
4. **Simplify paths.** Reduce point count in paths. Use tools like SVGO.
5. **Batch updates.** When animating via JavaScript, use `requestAnimationFrame` for batch updates.
6. **Avoid SVG filters on animated elements.** `<feGaussianBlur>` is extremely expensive when recomputed each frame.
7. **Prefer CSS animations over SMIL** where possible. CSS animations are better optimized in modern browsers.

## Accessibility of Animated SVGs

### Providing Context

```svg
<svg role="img" aria-labelledby="title desc">
  <title id="title">Loading animation</title>
  <desc id="desc">Three circles pulsing in sequence to indicate content is loading</desc>
  <!-- animated content -->
</svg>
```

### Respecting Motion Preferences

Check `prefers-reduced-motion` and disable or reduce animation accordingly.

```css
@media (prefers-reduced-motion: reduce) {
  .animated-svg * {
    animation: none !important;
    transition: none !important;
  }
}
```

In JavaScript:

```js
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (prefersReduced) {
  // Show final state without animation
  vivusInstance.finish();
}
```

### Pause Control

Provide a visible pause button for any SVG animation that runs continuously. Allow users to stop motion at will.

```js
const pauseBtn = document.getElementById("pause-animation");
let isPaused = false;

pauseBtn.addEventListener("click", () => {
  isPaused = !isPaused;
  const svgEl = document.querySelector("svg");
  if (isPaused) {
    svgEl.pauseAnimations();  // SMIL
    svgEl.classList.add("paused"); // CSS
  } else {
    svgEl.unpauseAnimations();
    svgEl.classList.remove("paused");
  }
});
```

```css
.paused * {
  animation-play-state: paused !important;
}
```

### Screen Reader Considerations

- Decorative animations: use `aria-hidden="true"` and `role="presentation"`.
- Informational animations (loading indicators, progress): use `role="img"` with `aria-label` or `<title>`.
- Interactive SVG elements: add `role="button"`, `tabindex="0"`, and keyboard event handlers.
- Announce state changes with `aria-live` regions outside the SVG.
