# Reduced Motion Reference

## prefers-reduced-motion Media Query

The operating system provides a user preference for reduced motion. macOS: System Settings > Accessibility > Display > Reduce Motion. Windows: Settings > Ease of Access > Display > Show animations. iOS: Settings > Accessibility > Motion > Reduce Motion. Android: Settings > Accessibility > Remove animations.

### CSS Detection

```css
@media (prefers-reduced-motion: reduce) {
  /* Reduced motion styles */
}

@media (prefers-reduced-motion: no-preference) {
  /* Full motion styles */
}
```

### JavaScript Detection

```js
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### Listening for Changes

The user can toggle the setting while the page is open. Listen for changes.

```js
const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

mediaQuery.addEventListener('change', (event) => {
  if (event.matches) {
    // User enabled reduced motion
  } else {
    // User disabled reduced motion
  }
});
```

## useReducedMotion Hook (Motion)

```tsx
import { useReducedMotion } from 'motion/react';

function AnimatedCard() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 25 }}
    />
  );
}
```

The hook returns `true` when `prefers-reduced-motion: reduce` is active. It updates reactively if the user toggles the OS setting.

### Global Reduced Motion (Motion)

Apply reduced motion settings to all Motion animations at once.

```tsx
import { MotionConfig } from 'motion/react';

function App({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
```

| Value | Behavior |
|-------|----------|
| `"user"` | Respect the OS `prefers-reduced-motion` setting |
| `"always"` | Force reduced motion for all animations (useful for testing) |
| `"never"` | Ignore the OS setting (use sparingly and only for essential animations) |

When `reducedMotion` is `"user"` and the OS preference is `reduce`, Motion automatically sets all animation durations to 0 and removes spring oscillation. Override specific animations if this blanket behavior is too aggressive.

## Four Degradation Strategies

### Strategy A: Instant Cut (duration: 0)

**When to use:** Decorative transitions, enter/exit animations, hover effects, background motion. The animation serves no critical feedback purpose.

**Implementation:** Set all durations to 0. The element reaches its final state immediately.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Note:** Use `0.01ms` instead of `0s` because some browsers skip transitions entirely at exactly 0, which prevents `transitionend` events from firing. JavaScript that depends on transition callbacks may break with `0s`.

```tsx
// Motion
<motion.div
  animate={{ opacity: 1, y: 0 }}
  transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 25 }}
/>
```

```js
// react-spring
useSpring({
  opacity: 1,
  y: 0,
  immediate: reduced,  // Skip spring, jump to final value
});
```

### Strategy B: Reduced Duration (1/3 Speed, No Bounce)

**When to use:** Animations that serve Orientation or Relationship purposes (see animation-purpose-test.md). The user needs to see where things moved, but with less physical motion.

**Implementation:** Keep the animation but remove spring oscillation, reduce duration to roughly one third, and eliminate any transform-based motion beyond simple opacity fades.

```css
@media (prefers-reduced-motion: reduce) {
  .card-enter {
    transition: opacity 100ms ease-out;
    /* Remove transform animation, keep opacity */
  }
}
```

```tsx
// Motion
<motion.div
  initial={{ opacity: 0, y: reduced ? 0 : 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={reduced
    ? { duration: 0.1 }
    : { type: "spring", stiffness: 300, damping: 25 }
  }
/>
```

```js
// react-spring
useSpring({
  opacity: 1,
  y: 0,
  config: reduced
    ? { duration: 100 }    // Linear, fast
    : { tension: 300, friction: 25 },
});
```

### Strategy C: Alternative Feedback (Color Change, Border Highlight)

**When to use:** Interactive feedback animations (button press, toggle, selection). The user needs confirmation that their action was received, but motion-based feedback is problematic.

**Implementation:** Replace motion (scale, rotation, position) with non-motion visual changes (color shift, border appearance, shadow change, background highlight).

```css
.button:active {
  transform: scale(0.95);
  transition: transform 100ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .button:active {
    transform: none;
    background-color: var(--active-bg);
    outline: 2px solid var(--focus-ring);
    transition: background-color 0ms, outline 0ms;
  }
}
```

```tsx
// Motion
const reduced = useReducedMotion();

<motion.button
  whileTap={reduced
    ? { backgroundColor: "#dbeafe", outline: "2px solid #3b82f6" }
    : { scale: 0.95 }
  }
  transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 30 }}
/>
```

### Strategy D: Removal (Decorative Motion)

**When to use:** Purely decorative animations that serve no Orientation, Feedback, or Relationship purpose. Background particles, floating elements, parallax effects, auto-playing hero animations, ambient gradients.

**Implementation:** Remove the animation entirely. Show a static state.

```css
.floating-particles {
  animation: float 3s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .floating-particles {
    animation: none;
  }
}
```

```tsx
// Motion
const reduced = useReducedMotion();

{!reduced && (
  <motion.div
    animate={{ y: [0, -10, 0] }}
    transition={{ duration: 3, repeat: Infinity }}
    className="decorative-floater"
  />
)}
```

For Lottie animations, show the first or last frame as a static image. See lottie-workflow.md for implementation.

## Per-Library Implementation Patterns

### CSS

The nuclear option removes all animations and transitions globally. Use as a baseline, then selectively restore essential animations.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

For selective control, use a utility class approach.

```css
@media (prefers-reduced-motion: reduce) {
  .motion-safe { /* Animations that should be removed */
    animation: none !important;
    transition: none !important;
  }
  .motion-reduce { /* Reduced alternatives */
    transition-duration: 0.01ms !important;
  }
}
```

Tailwind CSS provides `motion-safe:` and `motion-reduce:` variants.

```html
<div class="motion-safe:animate-bounce motion-reduce:animate-none">
```

### Motion (Framer Motion)

**Global approach:** Wrap the app in `MotionConfig`.

```tsx
<MotionConfig reducedMotion="user">
  <App />
</MotionConfig>
```

**Per-component approach:** Use `useReducedMotion`.

```tsx
const reduced = useReducedMotion();
const transition = reduced
  ? { duration: 0 }
  : { type: "spring", stiffness: 200, damping: 20 };
```

**Variants approach:** Define separate variant sets.

```tsx
const variants = {
  hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};
```

### react-spring

**Per-animation:** Use the `immediate` prop.

```js
const styles = useSpring({
  opacity: isVisible ? 1 : 0,
  transform: isVisible ? 'translateY(0px)' : 'translateY(20px)',
  immediate: prefersReduced,
});
```

**Global approach:** Use `skipAnimation` from the globals API.

```js
import { Globals } from '@react-spring/web';

Globals.assign({
  skipAnimation: prefersReduced,
});
```

This disables all react-spring animations globally. Every spring jumps to its target instantly.

### anime.js

**Per-animation:** Check the preference before calling `anime()`.

```js
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

anime({
  targets: '.element',
  translateY: [20, 0],
  opacity: [0, 1],
  duration: prefersReduced ? 0 : 600,
  easing: prefersReduced ? 'linear' : 'easeOutExpo',
});
```

**Global approach:** Override default duration.

```js
if (prefersReduced) {
  anime.set(document.querySelectorAll('.animated'), {
    opacity: 1,
    translateY: 0,
    scale: 1,
  });
}
```

Set all animated properties to their final values immediately, then skip calling `anime()` for subsequent animations.

## Vestibular Trigger Checklist

These motion patterns are most likely to cause vestibular discomfort (dizziness, nausea, disorientation). Prioritize removing or replacing them under reduced motion.

### High Risk (Always Disable)

- [ ] Parallax scrolling (background moving at different speeds)
- [ ] Full-screen zoom transitions (scale from 0 to 1 filling the viewport)
- [ ] Rapid spinning or rotation (more than 180 degrees)
- [ ] Infinite scroll with animated loading
- [ ] Background video or auto-playing large animation
- [ ] Carousel auto-advance with slide/fade
- [ ] Page transitions that move the entire viewport

### Medium Risk (Reduce or Replace)

- [ ] Spring animations with significant overshoot (bouncy preset)
- [ ] Continuous looping ambient motion
- [ ] Stagger animations on more than 10 elements simultaneously
- [ ] Expanding/collapsing that reshuffles the entire page layout
- [ ] Smooth scroll behavior (scrollIntoView with `behavior: 'smooth'`)
- [ ] Scale transforms on hover (growing/shrinking interaction areas)

### Low Risk (Usually Safe to Keep)

- [ ] Opacity fades under 200ms
- [ ] Color transitions (background-color, border-color)
- [ ] Box-shadow transitions
- [ ] Small transform changes (under 10px translate, under 5% scale)
- [ ] Focus ring appearance
- [ ] Cursor changes
- [ ] Selection highlights

## Testing Reduced Motion in Browsers

### Chrome DevTools

1. Open DevTools (F12 or Cmd+Option+I).
2. Open the Command Palette (Cmd+Shift+P).
3. Type "reduced motion".
4. Select "Emulate CSS prefers-reduced-motion: reduce".
5. The page now behaves as if the OS setting is enabled.

To disable: repeat the steps and select "Do not emulate CSS prefers-reduced-motion".

### Firefox

1. Open `about:config` in the address bar.
2. Search for `ui.prefersReducedMotion`.
3. Set to `1` to emulate reduced motion.
4. Set to `0` (or delete) to restore default.

### Safari

1. Open System Settings > Accessibility > Display.
2. Enable "Reduce Motion".
3. Safari immediately reflects the change. No restart needed.

There is no Safari DevTools emulation for this setting; use the OS-level toggle.

### Automated Testing

```js
// Playwright
await page.emulateMedia({ reducedMotion: 'reduce' });

// Puppeteer
await page.emulateMediaFeatures([
  { name: 'prefers-reduced-motion', value: 'reduce' },
]);
```

### Manual Testing Checklist

1. Enable reduced motion emulation.
2. Navigate every page and interaction in the app.
3. Verify that all content is accessible (nothing hidden behind an animation that never plays).
4. Verify that interactive feedback still exists (buttons respond, selections highlight).
5. Verify that layout changes are comprehensible (items do not teleport without any visual cue).
6. Check that no `transitionend` or `animationend` callbacks break (durations near 0 can cause timing issues).
7. Verify that Lottie animations show a meaningful static frame.
8. Verify that scroll-linked animations either degrade gracefully or are removed.
9. Disable reduced motion and verify that full animations still work (the reduced-motion code did not break the default path).
