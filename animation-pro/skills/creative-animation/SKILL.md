---
name: creative-animation
description: >-
  This skill should be used when the user asks to "create generative art",
  "build a particle system", "make a flow field", "create an interactive canvas",
  "add canvas animation", "build a physics simulation", "animate SVG strokes",
  "create a creative coding piece", "add D3 transitions", "build a data-viz
  animation", "animate sprites", or mentions p5.js, PixiJS, Matter.js, Vivus,
  d3-transition, d3-ease, requestAnimationFrame, canvas animation, WebGL 2D,
  tween.js, or easing functions. Covers generative art, interactive canvas
  experiences, particle systems, physics simulation, SVG animation, and D3
  data transitions.
---

# Creative Animation

Generative art, interactive canvas, particle systems, physics simulation,
SVG animation, and D3 data transitions. This domain covers animation where
the output is artistic, generative, or data-driven rather than UI chrome.

## Rendering Target Selection

Choose the rendering target based on element count and visual complexity:

| Element count | Rendering target | Library | Why |
|---------------|-----------------|---------|-----|
| < 500 animated | Canvas 2D | p5.js | Simple API, good enough performance |
| 500 to 10,000 | WebGL 2D | PixiJS | GPU-accelerated sprite batching |
| > 10,000 | WebGL + shaders | Custom or PixiJS | Instancing, custom vertex shaders |
| Vector paths | SVG | d3 / Vivus | Scalable, accessible, styleable |
| Data transitions | SVG / Canvas | d3-transition | Interpolation tied to data updates |

**Decision factors beyond count:**
- SVG: when paths need to be individually styled, accessible, or printed
- Canvas: when pixel-level control matters (noise, image processing)
- WebGL: when GPU acceleration is mandatory (real-time physics, large particle count)

## Frame Loop Architecture

All creative animation runs on a frame loop. Implementation differs by library:

| Library | Loop mechanism | Frame access | Delta time |
|---------|---------------|-------------|------------|
| p5.js | `draw()` auto-called | `frameCount` | `deltaTime` |
| PixiJS | `app.ticker.add(fn)` | `ticker.lastTime` | `ticker.deltaTime` |
| Vanilla | `requestAnimationFrame(fn)` | `performance.now()` | Manual delta |
| D3 | `d3.timer(fn)` | `elapsed` | Automatic |

**Critical**: Always use delta time for movement calculations. Never assume
a constant frame rate. `position += velocity * deltaTime`, not `position += velocity`.

See `references/frame-loop-architecture.md` for complete patterns.

## Generative Pattern Catalog

| Pattern | Technique | Key API |
|---------|-----------|---------|
| Flow field | Perlin noise grid + particle advection | p5: `noise()` |
| Particle system | Emitter + forces + lifetime + pooling | Custom or PixiJS ParticleContainer |
| L-system | String rewriting + turtle graphics | Custom + p5 drawing |
| Cellular automata | Grid state + neighbor rules | Array + Canvas `imageData` |
| Voronoi | Delaunay triangulation + cell coloring | d3-delaunay |
| Noise landscape | 2D/3D Perlin/Simplex noise | p5: `noise()`, three: custom shader |

See `references/generative-patterns.md` for implementation details.

## Easing Functions

Standard easing curves for non-spring animation (timelines, data transitions):

| Name | Character | D3 function |
|------|-----------|-------------|
| Linear | Constant speed | `d3.easeLinear` |
| Cubic in-out | Smooth acceleration/deceleration | `d3.easeCubicInOut` |
| Elastic out | Spring-like overshoot | `d3.easeElasticOut` |
| Bounce out | Bouncing ball | `d3.easeBounceOut` |
| Back out | Slight overshoot then settle | `d3.easeBackOut` |

For interactive elements, prefer actual spring physics (Motion/react-spring)
over easing-curve approximations. See `references/easing-catalog.md`.

## Physics-Driven Creative Work

For experiences where objects collide, bounce, or respond to gravity:

- **2D physics**: Matter.js (`refs/matter-js/`). Bodies, constraints, composites.
- **3D physics**: Rapier (`refs/rapier/`). Rigid bodies, colliders, joints.

Route to the `physics-simulator` agent for implementation.
See `references/physics-simulation.md`.

## Verifying APIs Against Source

```bash
# p5.js core
grep -r "createCanvas\|draw\|setup\|noise\|random" refs/p5js/src/core/
# PixiJS
grep -r "Application\|Ticker\|Sprite\|ParticleContainer" refs/pixijs/src/
# D3 transition
grep -r "transition\|attrTween\|interpolate" refs/d3-transition/src/
# D3 easing
grep -r "ease\|In\|Out\|InOut" refs/d3-ease/src/
# Matter.js
grep -r "Engine\|Body\|Composite\|Constraint" refs/matter-js/src/
```

## Accessibility

Creative canvas work has specific accessibility requirements:

1. Provide a pause/play control for all auto-playing animation
2. Implement `prefers-reduced-motion`: show a static frame or reduce speed
3. For data-viz animation: ensure information is available without motion
4. Add `aria-label` describing the canvas content
5. For generative art: offer a "capture" button for static screenshots

## Reference Files

- **`references/frame-loop-architecture.md`**: requestAnimationFrame, p5 draw loop, PixiJS ticker
- **`references/particle-systems.md`**: Emitters, forces, constraints, pooling
- **`references/easing-catalog.md`**: Every standard easing curve with math and visual reference
- **`references/canvas-vs-webgl.md`**: When to use Canvas 2D vs. WebGL vs. SVG
- **`references/physics-simulation.md`**: Matter.js patterns, gravity, collision, constraints
- **`references/generative-patterns.md`**: Flow fields, noise, L-systems, cellular automata
- **`references/svg-animation.md`**: Vivus stroke drawing, SMIL, CSS animation of SVG
- **`references/d3-transition-patterns.md`**: D3 transition API, interpolation, chained transitions
