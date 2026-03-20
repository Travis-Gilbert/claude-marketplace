# Gesture Animation Patterns

## Motion Gesture System

Motion (formerly Framer Motion) provides a declarative gesture API on `motion.*` elements. Gestures produce animation values directly, with no manual event wiring.

### Tap / Press

```tsx
<motion.button
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 500, damping: 30 }}
>
  Press Me
</motion.button>
```

`whileTap` activates on pointer down and releases on pointer up. The spring transition ensures the button bounces back naturally rather than snapping.

For long press detection, combine with `onTapStart` and a timeout:

```tsx
<motion.div
  onTapStart={() => {
    longPressTimer.current = setTimeout(onLongPress, 500);
  }}
  onTap={() => clearTimeout(longPressTimer.current)}
  onTapCancel={() => clearTimeout(longPressTimer.current)}
/>
```

### Hover

```tsx
<motion.div
  whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
/>
```

`whileHover` activates on pointer enter and deactivates on pointer leave. On touch devices, hover is skipped entirely (Motion handles this automatically).

### Focus

```tsx
<motion.input
  whileFocus={{ borderColor: "#3b82f6", boxShadow: "0 0 0 3px rgba(59,130,246,0.3)" }}
/>
```

## Drag

### Basic Drag

```tsx
<motion.div
  drag
  dragConstraints={{ top: -100, left: -100, bottom: 100, right: 100 }}
  dragElastic={0.2}
  dragMomentum={true}
  whileDrag={{ scale: 1.05, cursor: "grabbing" }}
/>
```

**Key drag props:**

| Prop | Purpose |
|------|---------|
| `drag` | Enable drag. Set to `"x"` or `"y"` for axis lock. |
| `dragConstraints` | Pixel bounds `{ top, left, right, bottom }` or a ref to a parent element. |
| `dragElastic` | How far the element can be dragged past constraints (0 = hard stop, 1 = fully elastic). Default: 0.35. |
| `dragMomentum` | Continue moving after pointer release based on velocity. Default: true. |
| `dragTransition` | Spring config for the snap-back animation. |
| `dragSnapToOrigin` | Return to the starting position on release. |

### Axis-Locked Drag

```tsx
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 300 }}
  style={{ x }}
/>
```

Set `drag="x"` to lock horizontal movement only. The element cannot move vertically at all, even if the user drags diagonally.

### Constraint by Parent Ref

```tsx
function DragInBox() {
  const constraintRef = useRef(null);

  return (
    <div ref={constraintRef} style={{ width: 400, height: 400 }}>
      <motion.div
        drag
        dragConstraints={constraintRef}
        dragElastic={0.1}
        style={{ width: 80, height: 80 }}
      />
    </div>
  );
}
```

The draggable element is constrained to the parent's bounding box automatically. The constraint updates on resize.

## Swipe-to-Dismiss Pattern

Combine drag with velocity detection to dismiss an element when swiped past a threshold.

```tsx
function SwipeToDismiss({ children, onDismiss }) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0]);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, opacity }}
      onDragEnd={(event, info) => {
        const threshold = 100;
        const velocity = 500;
        if (
          Math.abs(info.offset.x) > threshold ||
          Math.abs(info.velocity.x) > velocity
        ) {
          onDismiss();
        }
      }}
    >
      {children}
    </motion.div>
  );
}
```

**Design rules for swipe-to-dismiss:**
- Set `dragConstraints` to `{ left: 0, right: 0 }` so the element snaps back if not dismissed.
- Use both offset (distance) and velocity (speed) thresholds. A fast flick (high velocity, low offset) should dismiss just like a slow long drag (low velocity, high offset).
- Fade opacity as the element moves away from center.
- Animate the dismissed element off-screen with `AnimatePresence` before unmounting.

## Drag-to-Reorder Pattern

Use Motion's `Reorder` components for accessible, animated list reordering.

```tsx
import { Reorder } from 'motion/react';

function ReorderableList() {
  const [items, setItems] = useState(['A', 'B', 'C', 'D']);

  return (
    <Reorder.Group axis="y" values={items} onReorder={setItems}>
      {items.map((item) => (
        <Reorder.Item
          key={item}
          value={item}
          whileDrag={{
            scale: 1.03,
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            zIndex: 1,
          }}
        >
          {item}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
```

**Design rules for drag-to-reorder:**
- Elevate the dragged item (scale up slightly, add shadow) so it appears to lift above its siblings.
- Set `zIndex: 1` on the dragged item to ensure it renders above others.
- Other items should animate smoothly into their new positions (Motion handles this via layout animation).
- Provide a visible drag handle for accessibility. Not all users expect the entire row to be draggable.

### Horizontal Reorder

```tsx
<Reorder.Group axis="x" values={tabs} onReorder={setTabs} style={{ display: "flex" }}>
  {tabs.map((tab) => (
    <Reorder.Item key={tab.id} value={tab}>
      {tab.label}
    </Reorder.Item>
  ))}
</Reorder.Group>
```

Set `axis="x"` and use flexbox layout on the group.

## Gesture + Spring Physics Integration

### Drag with Custom Spring Return

```tsx
<motion.div
  drag
  dragSnapToOrigin
  dragTransition={{
    bounceStiffness: 300,
    bounceDamping: 20,
  }}
/>
```

`dragTransition` controls the spring that animates the element back to its constraint boundary (or origin). `bounceStiffness` and `bounceDamping` map to the spring stiffness and damping for this specific transition.

### Velocity-Sensitive Spring

Read drag velocity to adjust the spring response dynamically.

```tsx
const x = useMotionValue(0);
const controls = useAnimationControls();

function handleDragEnd(event, info) {
  const velocityFactor = Math.min(Math.abs(info.velocity.x) / 1000, 1);
  controls.start({
    x: 0,
    transition: {
      type: "spring",
      stiffness: 200 + velocityFactor * 300,
      damping: 20 + velocityFactor * 10,
    },
  });
}
```

Faster flicks produce stiffer, more energetic snap-back springs. Slow releases produce gentler returns.

### Pointer-Following Spring

Create an element that follows the pointer with spring physics (no drag, just tracking).

```tsx
function PointerFollower() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  useEffect(() => {
    function handleMove(event) {
      x.set(event.clientX);
      y.set(event.clientY);
    }
    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, [x, y]);

  return <motion.div style={{ x: springX, y: springY }} />;
}
```

The element lags behind the pointer, connected by a spring. Lower stiffness and damping create a more elastic, delayed follow.

## Touch vs Mouse Event Handling

### Pointer Events (Recommended)

Motion uses Pointer Events internally. Pointer Events unify mouse, touch, and pen input under a single API. There is no need to handle touch and mouse separately.

For custom gesture code outside Motion, always use Pointer Events:

```js
element.addEventListener('pointerdown', onStart);
element.addEventListener('pointermove', onMove);
element.addEventListener('pointerup', onEnd);
element.addEventListener('pointercancel', onEnd);
```

Always handle `pointercancel`. It fires when the browser takes over the gesture (e.g., scrolling, zooming, back navigation).

### Touch-Action CSS

When implementing drag or pan gestures, set `touch-action` on the draggable element to prevent the browser from intercepting the gesture for scrolling or zooming.

```css
.draggable { touch-action: none; }       /* Full drag control */
.horizontal-swipe { touch-action: pan-y; } /* Allow vertical scroll, capture horizontal */
.vertical-swipe { touch-action: pan-x; }  /* Allow horizontal scroll, capture vertical */
```

Motion sets `touch-action` automatically based on the `drag` axis. For `drag="x"`, it sets `touch-action: pan-y`.

### Gesture Thresholds

Touch input is less precise than mouse. Account for this in gesture detection.

| Gesture | Mouse Threshold | Touch Threshold |
|---------|----------------|-----------------|
| Tap (vs accidental touch) | 3px movement | 10px movement |
| Swipe detection | 30px offset | 50px offset |
| Drag start | Immediate | 10px dead zone |
| Long press | 500ms | 500ms |

Motion handles these thresholds internally. For custom implementations, check `event.pointerType` to adjust thresholds:

```js
const isTouch = event.pointerType === 'touch';
const threshold = isTouch ? 50 : 30;
```

### Preventing Ghost Clicks

On touch devices, a `touchend` fires a synthetic `click` 300ms later. This "ghost click" can trigger unintended actions after a swipe or drag. Modern browsers have largely eliminated this delay, but for safety:

1. Use `pointer-events` consistently (not mixing touch and click handlers).
2. On drag end, if the element was moved significantly, call `event.preventDefault()` on the subsequent click.
3. Motion's gesture system handles this automatically.

## prefers-reduced-motion for Gesture Feedback

Gesture animations serve Feedback (see animation-purpose-test.md). Under reduced motion, replace spring responses with instant state changes or subtle non-motion feedback.

### Strategy: Reduced Spring, No Overshoot

```tsx
const reduced = useReducedMotion();

<motion.button
  whileTap={reduced ? { backgroundColor: "#e5e7eb" } : { scale: 0.95 }}
  transition={reduced
    ? { duration: 0 }
    : { type: "spring", stiffness: 500, damping: 30 }
  }
/>
```

Under reduced motion, the button changes color instead of scaling. The feedback purpose is preserved without physical motion.

### Strategy: Disable Drag Momentum

```tsx
const reduced = useReducedMotion();

<motion.div
  drag
  dragMomentum={!reduced}
  dragElastic={reduced ? 0 : 0.2}
  dragTransition={reduced
    ? { bounceStiffness: 600, bounceDamping: 60 }
    : { bounceStiffness: 300, bounceDamping: 20 }
  }
/>
```

Under reduced motion, disable momentum (instant stop on pointer release), remove elasticity (hard constraint edges), and use a critically damped spring for snap-back (no oscillation).

### Strategy: Simplify Reorder Animation

```tsx
<Reorder.Item
  value={item}
  whileDrag={reduced ? {} : { scale: 1.03, boxShadow: "..." }}
  layout={!reduced}
/>
```

Under reduced motion, disable layout animation on non-dragged items. They jump to their new positions instantly. The dragged item still moves with the pointer (this is essential for the interaction to function) but without the visual embellishments.
