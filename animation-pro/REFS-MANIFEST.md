# Animation-Pro: Reference Repository Manifest

> 21 repos, 270MB total (trimmed of .git, caches, binaries, and build artifacts)

---

## Skill 1: Motion Craft (UI/Web Interactions)

| Directory | GitHub | Size | What to grep for |
|-----------|--------|------|------------------|
| `refs/motion/` | motiondivision/motion | 4.3M | Spring physics, AnimatePresence, layout animation, gestures, useMotionValue, useSpring, useTransform. Core source in `packages/motion/src/`. Import from `motion/react`. |
| `refs/react-spring/` | pmndrs/react-spring | 3.8M | Alternative spring model, imperative API, useChain for orchestration, useTrail for staggered lists. Source in `packages/`. |
| `refs/auto-animate/` | formkit/auto-animate | 2.2M | Zero-config layout transitions. One function call animates add/remove/reorder. Good reference for "what should just work." |
| `refs/anime/` | juliangarnier/anime | 7.1M | Timeline engine, staggered sequences, SVG morphing, keyframes. Lightweight alternative to Motion for choreographed multi-element animation. |
| `refs/locomotive-scroll/` | locomotivemtl/locomotive-scroll | 6.1M | Scroll-driven animation, parallax, scroll-triggered reveals, smooth scrolling, IntersectionObserver patterns. |
| `refs/lottie-web/` | airbnb/lottie-web | 16M | After Effects to web pipeline. JSON-based animation format. The interchange format between motion designers and developers. |

## Skill 2: Creative Animation (Generative/Interactive)

| Directory | GitHub | Size | What to grep for |
|-----------|--------|------|------------------|
| `refs/p5js/` | processing/p5.js | 23M | Creative coding, canvas-based frame loop, particles, flow fields, generative patterns. Source in `src/`. |
| `refs/pixijs/` | pixijs/pixijs | 18M | High-performance 2D WebGL renderer. Sprite animation, particle systems, filters, blend modes. Source in `src/`. |
| `refs/tweenjs/` | tweenjs/tween.js | 1.5M | Raw interpolation engine. Easing functions, update loops. Understanding this informs everything above it. |
| `refs/d3-transition/` | d3/d3-transition | 250K | D3's transition system. Selection.transition(), attrTween, styleTween, interpolation. |
| `refs/d3-ease/` | d3/d3-ease | 520K | Easing function catalog. easeLinear through easeBounce. Mathematical definitions of every standard easing curve. |
| `refs/matter-js/` | liabru/matter-js | 3.1M | 2D physics engine. Collision detection, gravity, constraints, composite bodies. For interactive experiences where objects behave physically. |
| `refs/animate-css/` | animate-css/animate.css | 770K | Named keyframe animation catalog. Reference for standard animation vocabulary (fadeIn, slideUp, bounce, etc.). |
| `refs/vivus/` | maxwellito/vivus | 357K | SVG stroke drawing animation. Line-drawing reveal effects. |

## Skill 3: 3D Animation

| Directory | GitHub | Size | What to grep for |
|-----------|--------|------|------------------|
| `refs/threejs/` | mrdoob/three.js | 48M | WebGL standard. AnimationMixer, KeyframeTrack, morph targets, skeletal animation, camera paths. Source in `src/`. |
| `refs/react-three-fiber/` | pmndrs/react-three-fiber | 3.1M | React renderer for Three.js. useFrame hook, declarative scene composition. Source in `packages/fiber/src/`. |
| `refs/drei/` | pmndrs/drei | 26M | R3F helper library. Float, useAnimations, MeshDistortMaterial, OrbitControls, and many animation-adjacent utilities. Source in `src/`. |
| `refs/theatre/` | theatre-js/theatre | 8.3M | Visual timeline editor. Keyframe curves, sequencing, studio UI. Works with both Three.js and DOM elements. |
| `refs/rapier/` | dimforge/rapier | 8.8M | 3D physics engine (Rust with JS bindings). Rigid bodies, colliders, joints. For physically-driven 3D animation. |

## Skill 4: Production Motion (Programmatic Video)

| Directory | GitHub | Size | What to grep for |
|-----------|--------|------|------------------|
| `refs/remotion/` | remotion-dev/remotion | 88M | React-based video composition. Frame-by-frame rendering, useCurrentFrame, Sequence, audio sync. Source in `packages/core/src/`. |
| `refs/motion-canvas/` | motion-canvas/motion-canvas | 4.9M | Programmatic animation for explainer content. Generator-based timeline, math-heavy. Source in `packages/core/src/`. |

## Cross-cutting repos

These repos serve multiple skills:

| Repo | Used by |
|------|---------|
| `anime/` | Motion Craft (timeline orchestration) + Creative (SVG morphing) |
| `tweenjs/` | Creative (easing fundamentals) + Production (interpolation reference) |
| `lottie-web/` | Motion Craft (designer handoff) + Production (export format) |
| `theatre/` | 3D (scene sequencing) + Production (timeline editing) |

## Trimming notes

All repos have been shallow-cloned (`--depth 1`) and stripped of:
- `.git/` directories (no history needed, only source)
- `.yarn/cache/` and `node_modules/`
- `dist/`, `.next/`, `coverage/`, `.cache/` build artifacts
- Platform-specific binary files (`.dylib`, `.so`, `.dll`, `.wasm`)
- Test fixtures, demo projects, and documentation sites
- Media files (`.mp4`, `.webm`, `.mov`, `.mp3`)

To update any repo, re-clone with `git clone --depth 1` and re-strip.
