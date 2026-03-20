---
name: motion-craft
description: >-
  This skill should be used when the user asks to "add animation to a component",
  "animate a list", "add a page transition", "make this drawer smoother", "add
  enter/exit animation", "implement spring physics", "add scroll animation",
  "add parallax", "animate on scroll", "add a gesture", "drag animation",
  "swipe interaction", "add micro-interactions", "tune spring parameters",
  "add hover animation", "animate a modal", "add Lottie animation", or mentions
  Motion, framer-motion, react-spring, AnimatePresence, useSpring, locomotive-scroll,
  anime.js, auto-animate, or Lottie. Covers UI transitions, gestures, scroll-driven
  animation, spring physics, enter/exit patterns, and accessibility compliance.
---

# Motion Craft

UI animation skill covering transitions, gestures, micro-interactions, spring physics,
scroll-driven animation, and enter/exit patterns. Every animation must pass the
Purpose Test and implement `prefers-reduced-motion`.

## The Purpose Test

Before implementing any animation, verify it serves at least one purpose:

1. **Orientation**: Helps the user understand where something came from or went
2. **Feedback**: Confirms an action was received
3. **Relationship**: Reveals how elements are connected

If none apply, do not animate. Report why and suggest a static alternative.

## Tool Selection Decision Tree

| Need | Tool | Bundle impact |
|------|------|---------------|
| Color, opacity, border-radius state change | CSS `transition` | 0 KB |
| Hover/focus feedback | CSS `transition` | 0 KB |
| Enter/exit (mount/unmount) | Motion `AnimatePresence` | ~18 KB gzipped |
| Layout reorder | Motion `layout` prop | (included with Motion) |
| Gesture-driven (drag, swipe, pinch) | Motion gesture system | (included with Motion) |
| Spring physics (any context) | Motion `spring` or react-spring | ~18 KB or ~12 KB |
| Staggered multi-element sequence | anime.js timeline or react-spring `useTrail` | ~7 KB or ~12 KB |
| Scroll-triggered reveal | CSS `@scroll-timeline` or Locomotive Scroll | 0 KB or ~15 KB |
| Designer handoff (After Effects) | Lottie | ~50 KB + JSON |
| Zero-config add/remove/reorder | auto-animate | ~2 KB |

**Critical rule**: Never add a library that duplicates functionality already installed.
Check `package.json` first:

```bash
grep -E '"(motion|framer-motion|react-spring|@react-spring|anime|animejs|gsap|lottie|locomotive-scroll|auto-animate)"' package.json
```

## Spring Physics Quick Reference

Spring parameters control feel. Two naming systems for the same physics:

| Feel | Motion config | react-spring config | Use case |
|------|--------------|-------------------|----------|
| Snappy | `{ stiffness: 400, damping: 30 }` | `{ tension: 400, friction: 30 }` | Buttons, menus |
| Natural | `{ stiffness: 300, damping: 25 }` | `{ tension: 300, friction: 25 }` | Panels, cards |
| Gentle | `{ stiffness: 200, damping: 20 }` | `{ tension: 200, friction: 20 }` | Content reveals |
| Bouncy | `{ stiffness: 500, damping: 15 }` | `{ tension: 500, friction: 15 }` | Playful UI |
| Critical | `{ stiffness: 400, damping: 40 }` | `{ tension: 400, friction: 40 }` | Modals, destructive |
| Heavy | `{ stiffness: 150, damping: 25, mass: 1.5 }` | `{ tension: 150, friction: 25, mass: 1.5 }` | Full-screen overlays |

Prefer springs over duration-based animation for interactive elements. Duration-based
animation moves at fixed speed regardless of distance; springs adapt.

## Performance Rules

1. Only animate `transform` and `opacity`. Never `width`, `height`, `top`, `left`.
2. Use `will-change: transform` sparingly, only on continuously animated elements.
3. Motion `layout` prop is expensive on large lists. Consider virtualizing first.
4. `AnimatePresence` exit animations block unmounting. Keep exit duration < 200ms.
5. Measure with DevTools Performance panel before and after adding animation.

## Accessibility (Non-Negotiable)

Every animated component must respect `prefers-reduced-motion`. See
`references/reduced-motion.md` for the full implementation guide. Quick patterns:

**CSS approach:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Motion approach:**
```tsx
import { useReducedMotion } from "motion/react";
const shouldReduce = useReducedMotion();
```

Degradation strategies: instant cut, reduced duration, alternative feedback, or removal.
See `references/reduced-motion.md` for when to use each.

## Verifying APIs Against Source

Always verify Motion and react-spring APIs against source before writing code:

```bash
# Motion spring config
grep -r "stiffness\|damping\|mass\|spring" refs/motion/packages/motion/src/animation/
# Motion AnimatePresence
grep -r "AnimatePresence\|AnimatePresenceProps" refs/motion/packages/motion/src/
# react-spring
grep -r "SpringConfig\|tension\|friction" refs/react-spring/packages/core/src/
# Locomotive Scroll
grep -r "scroll\|parallax\|speed" refs/locomotive-scroll/src/
```

## Reference Files

For detailed patterns and implementation guides, consult:

- **`references/spring-physics.md`**: Spring parameter cheat sheet, tuning guide, presets
- **`references/animation-purpose-test.md`**: When to animate vs. when not to
- **`references/css-vs-js-decision.md`**: CSS transitions vs. Motion vs. react-spring decision tree
- **`references/scroll-animation.md`**: Scroll-triggered patterns, IntersectionObserver, parallax
- **`references/gesture-patterns.md`**: Drag, swipe, pinch, long-press interaction models
- **`references/enter-exit.md`**: AnimatePresence patterns, list transitions, page transitions
- **`references/lottie-workflow.md`**: After Effects to web pipeline, JSON format, player config
- **`references/reduced-motion.md`**: prefers-reduced-motion implementation patterns
