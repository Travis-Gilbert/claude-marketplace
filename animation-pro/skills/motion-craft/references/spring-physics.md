# Spring Physics Reference

## Core Parameters

Spring animations simulate a mass attached to a spring. Three parameters control the behavior.

**Stiffness** (Motion) / **Tension** (react-spring): How tightly the spring pulls toward its target. Higher values produce faster, snappier motion. Lower values produce slow, lazy motion. Range: 50 to 1000. Most UI work falls between 100 and 400.

**Damping** (Motion) / **Friction** (react-spring): How much resistance slows the spring. Higher values reduce oscillation (fewer bounces). Lower values allow more oscillation. A critically damped spring (no overshoot at all) occurs at `damping = 2 * sqrt(stiffness * mass)`.

**Mass** (both libraries): How heavy the simulated object is. Higher mass makes the animation feel sluggish and weighty. Lower mass makes it feel light and responsive. Default is 1 in both libraries. Rarely needs adjustment; prefer tuning stiffness and damping instead.

## Named Presets

### Snappy

Use for buttons, toggles, small interactive elements. Fast arrival, minimal overshoot.

```js
// Motion
{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }

// react-spring
{ tension: 500, friction: 28, mass: 0.8 }
```

### Natural

Use for page transitions, card movements, general purpose UI. Feels organic and smooth.

```js
// Motion
{ type: "spring", stiffness: 200, damping: 20, mass: 1 }

// react-spring
{ tension: 200, friction: 20, mass: 1 }
```

### Gentle

Use for background elements, ambient motion, non-interactive decorations. Slow and soft.

```js
// Motion
{ type: "spring", stiffness: 100, damping: 15, mass: 1.2 }

// react-spring
{ tension: 100, friction: 14, mass: 1.2 }
```

### Bouncy

Use for playful UI, notifications, attention-grabbing elements. Significant overshoot.

```js
// Motion
{ type: "spring", stiffness: 300, damping: 10, mass: 0.8 }

// react-spring
{ tension: 300, friction: 10, mass: 0.8 }
```

### Critical

Use when overshoot is unacceptable: progress bars, loading indicators, precise positioning. Zero bounce.

```js
// Motion (critically damped)
{ type: "spring", stiffness: 200, damping: 28, mass: 1 }

// react-spring
{ tension: 200, friction: 26, mass: 1 }
```

### Heavy

Use for large panels, modals, drawer slides. Feels weighty and deliberate.

```js
// Motion
{ type: "spring", stiffness: 150, damping: 25, mass: 2 }

// react-spring
{ tension: 150, friction: 22, mass: 2 }
```

## Parameter Conversion

Motion and react-spring use different internal solvers, so parameter names differ. The conversion is approximate, not exact.

| Motion | react-spring | Notes |
|--------|-------------|-------|
| `stiffness` | `tension` | Roughly 1:1. Start with the same value. |
| `damping` | `friction` | Friction is typically 85% to 95% of damping. Start with `friction = damping * 0.9`. |
| `mass` | `mass` | Same concept, same scale. |

When porting a spring config between libraries, always test visually. The solvers differ in step resolution, so identical numbers can produce slightly different feel. Adjust friction by +/- 2 until the result matches.

## Tuning Guide

### Increase stiffness to:
- Make the animation reach its target faster
- Make the motion feel more responsive and direct
- Reduce the total animation duration

### Decrease stiffness to:
- Make the animation feel lazier and more relaxed
- Create a floaty, ambient feel
- Slow down the initial acceleration

### Increase damping to:
- Reduce or eliminate bounce and overshoot
- Make the animation settle more quickly after reaching the target
- Create a controlled, precise feel

### Decrease damping to:
- Add bounce and overshoot
- Create a playful, energetic feel
- Make the motion feel springy and elastic

### Increase mass to:
- Add inertia; the object resists changes in velocity
- Make the animation feel heavy and deliberate
- Slow everything down without changing the spring character

### Decrease mass to:
- Make the object feel light and responsive
- Speed everything up without changing the spring character
- Create a snappy, immediate response

## When to Use Motion vs react-spring

### Choose Motion when:
- The project already uses Motion (formerly Framer Motion)
- Layout animations are needed (AnimatePresence, layoutId, shared layout)
- Exit animations are a core requirement
- Gesture handling (drag, pan, tap) is built into the animation system
- Server-side rendering support is critical (Motion handles SSR well)
- Declarative API is preferred (animate prop on motion.div)

### Choose react-spring when:
- The project already uses react-spring
- Animating non-DOM values (canvas, Three.js, SVG path data, custom properties)
- Concurrent mode / React 18+ features matter (react-spring is fiber-aware)
- Chaining complex multi-step spring sequences
- Bundle size is a hard constraint (react-spring core is smaller than Motion)
- The animation target is not a DOM element

### Choose CSS transitions when:
- The animation is a simple property change (opacity, transform, color)
- No spring physics are needed
- Zero JavaScript budget for animation
- The interaction is hover, focus, or active states only

## Common Mistakes

### Overdamped springs that feel like duration animations

Setting damping too high relative to stiffness produces motion that looks like a linear or ease-out tween. If the spring never oscillates and arrives in a predictable time, it has lost the organic quality that makes spring physics worth using. Check by reducing damping until slight overshoot appears, then add damping back slowly until the overshoot is just barely visible.

### Using mass as a speed control

Increasing mass to slow down an animation makes everything feel sluggish and unresponsive. Decrease stiffness instead for a relaxed feel that still responds quickly to input changes.

### Ignoring velocity on interruption

Springs naturally handle interruption (changing the target mid-flight) because they preserve velocity. Duration-based animations reset on interruption, causing jarring jumps. If interruption is possible (hover states, gesture-driven motion), always use springs.

### Identical springs for different element sizes

A spring that feels snappy on a small button will feel aggressive on a full-screen panel. Scale damping and mass up for larger elements. A rough rule: double the animated distance, increase damping by 20% and mass by 30%.

### Copying spring values from design tools

Spring parameters in Figma, Principle, or After Effects use different solvers. Never copy values directly. Use the design tool's output as a visual reference and tune the web implementation to match by eye.

### Not testing at 60fps

Spring animations that feel smooth at 120fps can stutter at 60fps. Always test on a 60Hz display or throttle the refresh rate in DevTools. If the spring resolves in fewer than 4 frames at 60fps, it is too fast to perceive as spring motion; use a CSS transition instead.

## Quick Reference Table

| Preset | Stiffness | Damping | Mass | Overshoot | Use Case |
|--------|-----------|---------|------|-----------|----------|
| Snappy | 500 | 30 | 0.8 | Minimal | Buttons, toggles |
| Natural | 200 | 20 | 1 | Slight | General purpose |
| Gentle | 100 | 15 | 1.2 | Slight | Background, ambient |
| Bouncy | 300 | 10 | 0.8 | Significant | Notifications, playful UI |
| Critical | 200 | 28 | 1 | None | Progress, loading |
| Heavy | 150 | 25 | 2 | Minimal | Modals, drawers, panels |
