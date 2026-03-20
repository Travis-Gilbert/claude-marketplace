# Scroll Animation Reference

## CSS Scroll-Timeline (Native, Zero JS)

The modern approach. Use `scroll-timeline` and `animation-timeline` to tie CSS animations directly to scroll position. No JavaScript. Compositor-thread performance. Available in Chromium 115+ and Firefox 110+ (Safari support pending; check caniuse).

### Basic Scroll-Linked Animation

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.reveal {
  animation: fade-in linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}
```

`animation-timeline: view()` ties the animation to the element's visibility in the viewport. `animation-range: entry 0% entry 100%` means the animation runs from when the element first enters the viewport to when it is fully visible.

### Scroll Progress Bar

```css
@keyframes progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: var(--accent);
  transform-origin: left;
  animation: progress linear both;
  animation-timeline: scroll(root);
}
```

`scroll(root)` ties the animation to the root scroller's progress from 0% to 100%.

### Named Scroll Timeline

Use when the scroll container is not the root and not the element's own viewport.

```css
.scroll-container {
  overflow-y: auto;
  scroll-timeline-name: --cards;
  scroll-timeline-axis: y;
}

.card {
  animation: fade-in linear both;
  animation-timeline: --cards;
  animation-range: entry 0% cover 50%;
}
```

### Animation Range Keywords

| Keyword | Meaning |
|---------|---------|
| `entry` | Element entering the scrollport |
| `exit` | Element leaving the scrollport |
| `cover` | From first visible pixel to last visible pixel |
| `contain` | Element fully visible within scrollport |

Combine with percentages: `entry 25%` means 25% through the entry phase.

## IntersectionObserver Patterns

Use when CSS scroll-timeline is not supported or when triggering class-based CSS animations.

### Basic Reveal on Scroll

```js
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // Fire once
      }
    });
  },
  { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
```

```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 400ms ease-out, transform 400ms ease-out;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

**Key settings:**
- `threshold: 0.2` triggers when 20% of the element is visible. Higher values delay the trigger.
- `rootMargin: '0px 0px -50px 0px'` shrinks the detection area by 50px from the bottom, triggering slightly before the element is technically at the viewport edge. This prevents the animation from starting when only a sliver is visible.

### Staggered List Reveal

```js
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const index = Number(entry.target.dataset.index);
        entry.target.style.transitionDelay = `${index * 80}ms`;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);
```

Set `data-index` on each list item in the template. The delay creates the stagger.

### React Hook Pattern

```tsx
function useScrollReveal(options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.2, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}
```

## Locomotive Scroll Integration

Locomotive Scroll provides smooth scrolling, parallax, and scroll-speed control. Use it for marketing sites and editorial layouts where smooth scroll behavior is desired.

### Setup

```js
import LocomotiveScroll from 'locomotive-scroll';

const scroll = new LocomotiveScroll({
  el: document.querySelector('[data-scroll-container]'),
  smooth: true,
  multiplier: 1,         // Scroll speed multiplier
  lerp: 0.1,             // Smoothing factor (0 = no smoothing, 1 = instant)
  smartphone: { smooth: false }, // Disable smooth scroll on mobile
  tablet: { smooth: false },
});
```

### Data Attributes

```html
<div data-scroll-container>
  <section data-scroll-section>
    <h1 data-scroll data-scroll-speed="2">Fast heading</h1>
    <p data-scroll data-scroll-speed="-1">Slower, reverse parallax</p>
    <img data-scroll data-scroll-speed="3" data-scroll-direction="horizontal" />
  </section>
</div>
```

| Attribute | Effect |
|-----------|--------|
| `data-scroll` | Enable scroll detection on this element |
| `data-scroll-speed` | Parallax speed (0 = normal, positive = faster, negative = slower) |
| `data-scroll-direction` | `vertical` (default) or `horizontal` |
| `data-scroll-class` | CSS class to add when element enters viewport |
| `data-scroll-repeat` | Re-trigger animation on every scroll past |
| `data-scroll-offset` | Custom trigger offset (e.g., `"20%, 50%"`) |

### React Integration

Locomotive Scroll manages its own scroll container, which conflicts with Next.js and React Router. Use `locomotive-scroll` with a ref-based wrapper.

```tsx
useEffect(() => {
  const scroll = new LocomotiveScroll({
    el: containerRef.current,
    smooth: true,
  });

  return () => scroll.destroy();
}, []);
```

Rebuild on route change: call `scroll.update()` after content changes. For Next.js App Router, call `scroll.destroy()` and reinitialize in the layout effect.

## Parallax Techniques

### Transform-Based Parallax (Recommended)

Always use `transform: translate3d()` for parallax. Never use `top`, `left`, `margin`, or `padding`. Transform-based movement is GPU-composited and does not trigger layout recalculation.

```css
.parallax-layer {
  will-change: transform;
  transform: translate3d(0, calc(var(--scroll-y) * -0.3), 0);
}
```

Set `--scroll-y` from JavaScript:

```js
window.addEventListener('scroll', () => {
  document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`);
}, { passive: true });
```

### Pure CSS Parallax (Perspective Method)

No JavaScript at all. Uses CSS 3D transforms.

```css
.parallax-container {
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  perspective: 1px;
  perspective-origin: center center;
}

.parallax-bg {
  transform: translateZ(-1px) scale(2);
  /* scale compensates for the perspective shrink */
}

.parallax-fg {
  transform: translateZ(0);
}
```

Limitation: the perspective container must be the scroll container. This approach does not work well with page-level scrolling.

### Motion useScroll + useTransform

```tsx
import { motion, useScroll, useTransform } from 'motion/react';

function ParallaxImage() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['-20%', '20%']);

  return (
    <div ref={ref} style={{ overflow: 'hidden' }}>
      <motion.img src="/hero.jpg" style={{ y }} />
    </div>
  );
}
```

`offset` defines when the scroll measurement starts and ends relative to the target element and viewport. `['start end', 'end start']` means: start measuring when the element's top reaches the viewport bottom; stop when the element's bottom reaches the viewport top.

## Performance Considerations

### Animate Only Transform and Opacity

These two properties are GPU-composited and skip layout and paint. Animating `width`, `height`, `top`, `left`, `padding`, or `margin` on scroll causes layout thrashing.

### Use `will-change` Sparingly

Add `will-change: transform` to parallax layers that move continuously. Do not add it to every element on the page. The browser promotes each `will-change` element to its own compositor layer, consuming GPU memory.

### Passive Event Listeners

Always use `{ passive: true }` on scroll listeners. Passive listeners tell the browser the handler will not call `preventDefault()`, enabling smooth 60fps scroll without waiting for JavaScript.

```js
window.addEventListener('scroll', handler, { passive: true });
```

### Throttle vs requestAnimationFrame

Do not throttle scroll handlers with `setTimeout`. Use `requestAnimationFrame` to batch scroll position reads and writes.

```js
let ticking = false;
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateParallax(window.scrollY);
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });
```

### Avoid Layout Reads in Scroll Handlers

Never call `getBoundingClientRect()`, `offsetTop`, `scrollHeight`, or similar layout-triggering properties inside a scroll handler. Cache these values on resize events or use IntersectionObserver instead.

### Content Visibility

For long pages with many scroll-animated sections, use `content-visibility: auto` on off-screen sections. The browser skips rendering and layout for invisible content.

```css
.section {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px; /* Estimated height */
}
```

## prefers-reduced-motion Handling

### Disable Parallax Entirely

Parallax creates vestibular discomfort for users with motion sensitivity. Disable it completely.

```css
@media (prefers-reduced-motion: reduce) {
  .parallax-layer {
    transform: none !important;
    will-change: auto;
  }
}
```

### Replace Scroll-Triggered Reveals with Instant Visibility

```css
@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
```

### JavaScript Check

```js
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReduced) {
  // Skip Locomotive Scroll initialization
  // Make all elements visible immediately
  // Disable scroll-speed attributes
}
```

### Motion Library

```tsx
import { useReducedMotion } from 'motion/react';

function ScrollReveal({ children }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={reduced ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
    >
      {children}
    </motion.div>
  );
}
```

Set `initial={false}` under reduced motion to skip the initial hidden state entirely.
