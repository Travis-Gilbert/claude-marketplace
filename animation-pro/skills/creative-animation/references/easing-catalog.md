# Easing Catalog

Complete reference for standard easing curves. Each entry includes the mathematical formula, a visual description, the D3 function name, the CSS equivalent (where one exists), and guidance on when to use it.

## Easing Fundamentals

An easing function maps a normalized progress value `t` (from 0 to 1) to an output value (also typically 0 to 1, though elastic and back curves overshoot).

Three variants exist for most curves:
- **In**: starts slow, accelerates. Applies the curve directly.
- **Out**: starts fast, decelerates. Computed as `1 - easeIn(1 - t)`.
- **InOut**: slow at both ends, fast in the middle. Blends In (first half) and Out (second half).

## Linear

**Formula:** `f(t) = t`

**Visual:** constant speed, no acceleration or deceleration. A straight diagonal line.

**D3:** `d3.easeLinear`
**CSS:** `linear`

**When to use:** progress bars, constant-speed scrolling, or as a baseline. Avoid for UI element transitions; it feels mechanical and lifeless.

## Quadratic (Quad)

**Formula:** `f(t) = t^2` (In), `1 - (1-t)^2` (Out)

**Visual:** gentle curve. Slightly softer than linear but not dramatic.

**D3:** `d3.easeQuadIn`, `d3.easeQuadOut`, `d3.easeQuad` (alias for Out)
**CSS:** `cubic-bezier(0.55, 0.085, 0.68, 0.53)` (In), `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (Out)

**When to use:** subtle UI transitions where ease-out is desired but cubic feels too strong. Good for opacity fades.

## Cubic

**Formula:** `f(t) = t^3` (In), `1 - (1-t)^3` (Out)

**Visual:** moderate curve. The default "feels good" easing for most UI work.

**D3:** `d3.easeCubicIn`, `d3.easeCubicOut`, `d3.easeCubic` (alias for InOut)
**CSS:** `ease` (~cubic InOut), `ease-in` (~cubic In), `ease-out` (~cubic Out), `ease-in-out`

**When to use:** the workhorse of UI animation. Use CubicOut for elements entering the screen. Use CubicIn for elements leaving. Use CubicInOut for repositioning elements that stay visible.

## Quartic (Quart)

**Formula:** `f(t) = t^4` (In), `1 - (1-t)^4` (Out)

**Visual:** steeper initial/final slope than cubic. More dramatic acceleration.

**D3:** `d3.easeQuartIn`, `d3.easeQuartOut`, `d3.easeQuartInOut`
**CSS:** Approximate with `cubic-bezier(0.895, 0.03, 0.685, 0.22)` (In)

**When to use:** emphasis transitions. Modal dialogs, hero section animations, or any element that should feel weightier.

## Quintic (Quint)

**Formula:** `f(t) = t^5` (In), `1 - (1-t)^5` (Out)

**Visual:** very steep curve. Starts extremely slow (In) or ends very abruptly (Out).

**D3:** `d3.easeQuintIn`, `d3.easeQuintOut`, `d3.easeQuintInOut`
**CSS:** Approximate with `cubic-bezier(0.755, 0.05, 0.855, 0.06)` (In)

**When to use:** dramatic entrances and exits. Full-screen overlays, splash screens. Often too aggressive for small UI elements.

## Sine

**Formula:** `f(t) = 1 - cos(t * PI / 2)` (In), `sin(t * PI / 2)` (Out)

**Visual:** the gentlest curve. Barely perceptible acceleration/deceleration.

**D3:** `d3.easeSinIn`, `d3.easeSinOut`, `d3.easeSin` (alias for InOut)
**CSS:** `cubic-bezier(0.47, 0, 0.745, 0.715)` (In), `cubic-bezier(0.39, 0.575, 0.565, 1)` (Out)

**When to use:** ambient, breathing animations. Pulsing elements, gentle hover effects. When the animation should feel organic and almost imperceptible.

## Exponential (Expo)

**Formula:** `f(t) = 2^(10*(t-1))` (In), `1 - 2^(-10*t)` (Out)

**Visual:** extremely steep. Nearly flat at one end, then rockets to the other.

**D3:** `d3.easeExpIn`, `d3.easeExpOut`, `d3.easeExpInOut`
**CSS:** `cubic-bezier(0.95, 0.05, 0.795, 0.035)` (In)

**When to use:** page transitions, zoom effects, "snap" animations. The Out variant feels like an object decelerating rapidly after being thrown.

## Circular (Circ)

**Formula:** `f(t) = 1 - sqrt(1 - t^2)` (In), `sqrt(1 - (t-1)^2)` (Out)

**Visual:** based on a quarter-circle arc. Starts slow, then accelerates sharply (In).

**D3:** `d3.easeCircleIn`, `d3.easeCircleOut`, `d3.easeCircle` (alias for InOut)
**CSS:** `cubic-bezier(0.6, 0.04, 0.98, 0.335)` (In)

**When to use:** similar applications to expo but with a slightly different feel. Circular InOut produces a smooth, symmetric S-curve.

## Elastic

**Formula (Out):** `2^(-10*t) * sin((t - 0.075) * 2*PI / 0.3) + 1`

**Visual:** overshoots the target and oscillates like a spring, settling over 2 to 3 bounces. The In variant winds up before releasing.

**D3:** `d3.easeElasticIn`, `d3.easeElasticOut`, `d3.easeElastic` (alias for Out)
**CSS:** No native equivalent. Must use JavaScript or `@keyframes`.

**Configurable parameters:**
- **Amplitude:** height of the overshoot (default 1.0). Values above 1.0 increase bounce.
- **Period:** duration of each oscillation (default 0.3). Smaller values produce more oscillations.

```js
d3.easeElasticOut.amplitude(1.2).period(0.4);
```

**When to use:** playful UI elements, notifications, badges, "bouncy" button clicks. Avoid for data visualization transitions; the overshoot makes intermediate values misleading.

## Back

**Formula (In):** `t^2 * ((s+1)*t - s)` where `s = 1.70158` (overshoot amount)

**Visual:** pulls back slightly before moving forward (In), or overshoots the target before settling (Out).

**D3:** `d3.easeBackIn`, `d3.easeBackOut`, `d3.easeBackInOut`
**CSS:** `cubic-bezier(0.6, -0.28, 0.735, 0.045)` (In, approximate)

**Configurable:** the overshoot parameter `s`. Default 1.70158. Higher values produce more dramatic pullback.

```js
d3.easeBackOut.overshoot(2.5);
```

**When to use:** elements that should feel like they are being "pulled back and released" (drawers, tooltips, popovers). BackOut is the most common variant. BackIn works for exits that feel like suction.

## Bounce

**Formula:** simulates a ball bouncing on a surface with decreasing bounce height.

**Visual:** multiple impacts. The Out variant bounces at the end (like a ball hitting the floor). The In variant bounces at the start.

**D3:** `d3.easeBounceIn`, `d3.easeBounceOut`, `d3.easeBounce` (alias for Out)
**CSS:** No native equivalent. Requires `@keyframes`.

**When to use:** drop-in animations, playful error states, game UI. Use sparingly in professional interfaces; bounce can feel juvenile.

## Custom Easing with cubic-bezier

CSS `cubic-bezier(x1, y1, x2, y2)` defines the two control points of a cubic Bezier curve (the start point is fixed at 0,0 and the end at 1,1).

### Common Custom Curves

| Name | cubic-bezier | Character |
|------|-------------|-----------|
| Material Design Standard | `(0.4, 0.0, 0.2, 1)` | Quick start, gentle end |
| Material Decelerate | `(0.0, 0.0, 0.2, 1)` | Fast entry, slow settle |
| Material Accelerate | `(0.4, 0.0, 1, 1)` | Slow start, fast exit |
| iOS Spring-like | `(0.25, 0.1, 0.25, 1)` | Very close to CSS `ease` |
| Snappy | `(0.5, 0, 0.1, 1)` | Instant start, abrupt stop |

### Creating Custom Curves in D3

```js
import { easeCubicBezier } from "d3-ease"; // not built-in; use manual interpolation

// Manual implementation
function customEase(x1, y1, x2, y2) {
  // Use a cubic bezier solver
  // or reference: https://github.com/gre/bezier-easing
  return bezierEasing(x1, y1, x2, y2);
}
```

For D3, the `bezier-easing` npm package produces a function compatible with `.ease()`.

### Visualizing Curves

Use https://cubic-bezier.com or https://easings.net to preview curves interactively. Plot `t` on the x-axis and `eased(t)` on the y-axis.

## tween.js Easing Reference

tween.js provides all standard easings under `TWEEN.Easing`.

```js
new TWEEN.Tween(obj)
  .to({ x: 100 }, 1000)
  .easing(TWEEN.Easing.Elastic.Out)
  .start();
```

Available paths:
```
TWEEN.Easing.Linear.None
TWEEN.Easing.Quadratic.In / .Out / .InOut
TWEEN.Easing.Cubic.In / .Out / .InOut
TWEEN.Easing.Quartic.In / .Out / .InOut
TWEEN.Easing.Quintic.In / .Out / .InOut
TWEEN.Easing.Sinusoidal.In / .Out / .InOut
TWEEN.Easing.Exponential.In / .Out / .InOut
TWEEN.Easing.Circular.In / .Out / .InOut
TWEEN.Easing.Elastic.In / .Out / .InOut
TWEEN.Easing.Back.In / .Out / .InOut
TWEEN.Easing.Bounce.In / .Out / .InOut
```

## UI Guidelines: Choosing the Right Curve

### General Rules

1. **Entering elements** (appearing on screen): use an Out curve. The element decelerates into its resting position.
2. **Exiting elements** (leaving the screen): use an In curve. The element accelerates away.
3. **Repositioning** (moving within the viewport): use InOut. Symmetric acceleration feels natural for lateral movement.
4. **Opacity changes**: Sine or Quad. Gentle curves prevent jarring opacity jumps.
5. **Scale changes**: Cubic or Back. BackOut adds a satisfying overshoot.

### Duration Guidelines

| Animation Type | Duration | Easing |
|----------------|----------|--------|
| Micro-interaction (button press) | 100 to 200ms | CubicOut or BackOut |
| Element enter/exit | 200 to 400ms | CubicOut / CubicIn |
| Page transition | 300 to 600ms | ExpoOut or CubicInOut |
| Large layout shift | 400 to 800ms | CubicInOut |
| Loading/progress | Continuous | Linear |
| Data visualization | 500 to 1000ms | CubicInOut |

### Staggered Easing

When animating a list of elements, apply the same easing to each element but offset the start time. Combine CubicOut with an increasing delay.

```js
elements.forEach((el, i) => {
  el.transition()
    .delay(i * 50)
    .duration(400)
    .ease(d3.easeCubicOut)
    .style("opacity", 1)
    .attr("transform", "translateY(0)");
});
```

### Combining Easings

Chain transitions with different easings for multi-phase motion. For example, BackOut for the initial overshoot, then SineInOut for a gentle settle.

```js
d3.select(el)
  .transition()
  .duration(300)
  .ease(d3.easeBackOut)
  .attr("y", targetY)
  .transition()
  .duration(200)
  .ease(d3.easeSineInOut)
  .attr("y", finalY);
```

## Implementing Easing Functions from Scratch

All power-based easings follow a pattern.

```js
// Generic power easing
function easeInPow(t, power) { return Math.pow(t, power); }
function easeOutPow(t, power) { return 1 - Math.pow(1 - t, power); }
function easeInOutPow(t, power) {
  if (t < 0.5) return Math.pow(t * 2, power) / 2;
  return 1 - Math.pow((1 - t) * 2, power) / 2;
}

// Quad = power 2, Cubic = power 3, Quart = power 4, Quint = power 5
const easeOutCubic = (t) => easeOutPow(t, 3);
```

For elastic:

```js
function easeOutElastic(t) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}
```

For bounce:

```js
function easeOutBounce(t) {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
  t -= 2.625 / 2.75;
  return 7.5625 * t * t + 0.984375;
}
```

These standalone functions are useful when importing a full easing library is not justified.
