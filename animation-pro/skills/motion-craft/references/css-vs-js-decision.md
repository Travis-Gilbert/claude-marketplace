# CSS vs JS Animation Decision Guide

## Decision Tree

Follow this tree from top to bottom. Take the first branch that applies.

### Level 1: Is JavaScript Needed at All?

**Use CSS transitions when ALL of these are true:**
- The animation triggers on a state change (hover, focus, active, class toggle)
- Only CSS-animatable properties change (opacity, transform, color, background, border, box-shadow)
- No spring physics required
- No exit animation (element just disappears)
- No gesture input
- No orchestration with other animations

**Use CSS @keyframes when ALL of these are true:**
- The animation runs on a timeline (not physics-based)
- It loops, reverses, or has multiple keyframe stops
- No runtime control needed (pause, seek, speed, reverse on demand)
- No JavaScript values drive the animation (scroll position, pointer, data)

**If neither CSS option fits, continue to Level 2.**

### Level 2: Which JS Library?

**Use Motion (formerly Framer Motion) when ANY of these are true:**
- Layout animations are needed (elements change position/size within the DOM)
- AnimatePresence is needed (exit animations for unmounting components)
- Shared layout transitions (layoutId, morphing between views)
- Gesture system integration (drag, pan, tap as first-class animation triggers)
- Declarative React API preferred (animate prop, variants)
- Server-side rendering requirements

**Use react-spring when ANY of these are true:**
- Animating non-DOM targets (Three.js, Canvas 2D, SVG path data, custom values)
- Need fiber-aware animation (concurrent React features)
- Complex spring chains and orchestration (useChain)
- The project already depends on react-spring
- Bundle size is a hard constraint and layout/exit animations are not needed

**Use anime.js when ANY of these are true:**
- The project is not React (vanilla JS, Vue, Svelte, or multi-framework)
- Complex SVG path animations (morphing, drawing, path following)
- Timeline-based choreography with many elements
- Working outside a component framework entirely

**Use the Web Animations API (WAAPI) when ALL of these are true:**
- Native browser API is preferred (no dependency)
- Timeline-based animation (not spring physics)
- Runtime control needed (play, pause, reverse, playback rate)
- Modern browser support is acceptable (no IE11)

## Bundle Size Comparison

| Library | Core Size (gzipped) | Notes |
|---------|-------------------|-------|
| CSS transitions | 0 KB | Built into the browser |
| CSS @keyframes | 0 KB | Built into the browser |
| Web Animations API | 0 KB | Built into the browser (polyfill ~5 KB if needed) |
| Motion (framer-motion) | ~32 KB | Tree-shakeable; minimal import ~15 KB |
| react-spring | ~18 KB | Core only; each primitive adds ~2 KB |
| anime.js | ~10 KB | Full library, no tree-shaking needed |
| GSAP | ~25 KB | Core only; plugins add 5 to 15 KB each |
| Popmotion | ~5 KB | Low-level; Motion uses it internally |

**Tree-shaking note:** Motion's actual impact depends on which features are imported. Importing only `motion` and `animate` is ~15 KB. Adding `AnimatePresence` adds ~5 KB. Adding `useScroll`, `useTransform`, drag adds more. Always check with bundlephobia or the actual build output.

## Feature Comparison

| Feature | CSS Trans. | CSS @kf | WAAPI | Motion | react-spring | anime.js |
|---------|-----------|---------|-------|--------|-------------|----------|
| Spring physics | No | No | No | Yes | Yes | No |
| Gesture (drag/pan) | No | No | No | Yes | No* | No |
| Layout animation | No | No | No | Yes | No | No |
| Exit animation | No | No | Manual | Yes | Manual | Manual |
| Stagger | No | Manual | Manual | Yes | Yes | Yes |
| Scroll-driven | CSS only | CSS only | Yes | Yes | No | Yes |
| SVG morph | No | Basic | Basic | Basic | Yes | Yes |
| Non-DOM targets | No | No | No | No | Yes | Yes |
| SSR safe | Yes | Yes | No | Yes | Yes | No |
| React integration | Native | Native | Hook | Native | Native | Wrapper |
| Timeline/sequence | No | Yes | Yes | Yes | useChain | Yes |
| Runtime control | No | Limited | Yes | Yes | Yes | Yes |

*react-spring does not include a gesture system. Use @use-gesture/react alongside it for gesture input.

## Detailed Breakdown by Category

### Simple State Transitions

**Winner: CSS transitions.**

Hover effects, focus rings, active states, theme changes, color shifts.

```css
.button {
  transition: transform 150ms ease-out, background-color 150ms ease-out;
}
.button:hover {
  transform: scale(1.02);
}
```

No JavaScript. No bundle cost. GPU-accelerated for transform and opacity. This is the default choice for any simple property change.

### Looping and Multi-Step Animations

**Winner: CSS @keyframes.**

Loading spinners, skeleton shimmer, pulsing indicators, ambient motion.

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.skeleton { animation: pulse 1.5s ease-in-out infinite; }
```

Stays on the compositor thread. No JavaScript execution during the animation. Ideal for motion that runs continuously without user interaction.

### Spring-Based Interactive Motion

**Winner: Motion or react-spring.**

Buttons that squish on press, cards that spring back after drag, toggles with overshoot.

Choose Motion for React projects that also need layout or exit animations. Choose react-spring for projects that animate non-DOM values or need smaller bundle size.

### Layout and Reflow Animations

**Winner: Motion (no close competitor).**

Elements changing position in a list, grid items reshuffling, shared element transitions between routes. Motion's `layout` prop and `layoutId` handle FLIP animations automatically. No other library offers this as a built-in feature.

### Exit Animations

**Winner: Motion's AnimatePresence.**

React unmounts components instantly. Animating an exit requires keeping the component in the DOM until the animation finishes, then removing it. Motion's `AnimatePresence` handles this lifecycle automatically. Other libraries require manual ref tracking, timeouts, or callback wiring.

### Complex SVG Animation

**Winner: anime.js or GSAP.**

Path morphing, line drawing (stroke-dashoffset), path following, complex SVG choreography. anime.js handles SVG paths natively. GSAP's MorphSVGPlugin is the most powerful option but requires a commercial license for some uses.

### Scroll-Driven Animation

**Winner: CSS scroll-timeline (modern browsers) or Motion's useScroll.**

See scroll-animation.md for detailed patterns. CSS scroll-timeline is zero-JS and performant. Motion's `useScroll` + `useTransform` provides a React-friendly API with spring physics.

### Non-React Projects

**Winner: anime.js or GSAP.**

For vanilla JS, Vue, Svelte, or server-rendered pages, anime.js provides the best balance of features and size. GSAP is more powerful but larger and has licensing considerations for commercial use.

## Migration Paths

### CSS Transitions to Motion

When a CSS transition needs spring physics or exit animation.

1. Replace the CSS class toggle with Motion's `animate` prop
2. Replace `transition: ...` with `transition={{ type: "spring", stiffness: 200, damping: 20 }}`
3. Wrap in `<AnimatePresence>` if exit animation is needed
4. Remove the CSS transition properties from the stylesheet

### react-spring to Motion

When the project needs layout animation or AnimatePresence.

1. Replace `useSpring` with Motion's `animate` prop or `useAnimationControls`
2. Map `tension` to `stiffness` and `friction` to `damping` (see spring-physics.md for conversion)
3. Replace `animated.div` with `motion.div`
4. Replace `useTrail` with stagger via `transition.delay` or `variants`
5. Replace `useChain` with Motion's orchestration (staggerChildren, delayChildren)

### Motion to react-spring

When animating non-DOM targets (Canvas, Three.js).

1. Replace `motion.div` with `animated.div` (or `animated(MyComponent)`)
2. Map `stiffness` to `tension` and `damping` to `friction`
3. Replace `animate` prop with `useSpring` hook
4. Replace `AnimatePresence` with manual exit handling (useTransition)
5. Replace gesture props with @use-gesture/react hooks

### anime.js to Motion (React migration)

When migrating a vanilla JS project to React.

1. Replace `anime({ targets: '.el', ... })` with `<motion.div animate={...} />`
2. Replace timeline sequences with variants and staggerChildren
3. Replace anime.js easing strings with Motion spring configs or easing arrays
4. SVG path animations may need GSAP or manual implementation in Motion

## Decision Summary Table

| Scenario | Recommended | Runner-Up |
|----------|------------|-----------|
| Hover/focus effect | CSS transition | (none needed) |
| Loading spinner | CSS @keyframes | (none needed) |
| Button press spring | Motion | react-spring |
| Modal enter/exit | Motion | anime.js |
| List reorder | Motion | (none comparable) |
| Shared element morph | Motion | (none comparable) |
| Drag to dismiss | Motion | react-spring + use-gesture |
| Canvas/WebGL values | react-spring | Popmotion |
| SVG path morph | anime.js | GSAP |
| Scroll parallax | CSS scroll-timeline | Motion useScroll |
| Non-React project | anime.js | GSAP |
| Maximum performance | CSS transition/keyframes | WAAPI |
| Minimum bundle | CSS | WAAPI |
