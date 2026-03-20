# Enter and Exit Animation Patterns

## AnimatePresence Fundamentals

React unmounts components immediately. To animate an element out before removal, wrap it in `AnimatePresence`.

```tsx
import { AnimatePresence, motion } from 'motion/react';

function Notification({ show, message }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="notification"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Critical rules for AnimatePresence:**
- Every direct child of `AnimatePresence` must have a unique `key` prop.
- The `exit` prop defines the animation state the element transitions to before unmounting.
- `initial` fires on first mount. Set `initial={false}` to skip the enter animation on page load.
- `AnimatePresence` can only track direct children. Nested conditional rendering will not be detected.

### mode Prop

```tsx
<AnimatePresence mode="wait">
  {/* Only one child renders at a time */}
</AnimatePresence>
```

| Mode | Behavior |
|------|----------|
| `"sync"` (default) | Enter and exit happen simultaneously. Good for crossfade. |
| `"wait"` | Exit completes before enter begins. Good for page transitions. |
| `"popLayout"` | Exiting element is removed from layout flow immediately; enter animates into the freed space. |

## List Item Enter/Exit with Stagger

### Basic Staggered List

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

function StaggeredList({ items }) {
  return (
    <motion.ul variants={container} initial="hidden" animate="show">
      {items.map((data) => (
        <motion.li key={data.id} variants={item}>
          {data.label}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

**Stagger timing guidelines:**
- 30ms to 50ms between items for 5 to 10 items
- 20ms to 30ms for 10 to 20 items
- Do not stagger more than 20 items. Show the first 10 to 15 with stagger, then reveal the rest instantly.
- Total stagger duration should not exceed 400ms. Formula: `stagger * itemCount < 400ms`.

### List Item Removal with Layout Animation

```tsx
function AnimatedList({ items, onRemove }) {
  return (
    <AnimatePresence>
      {items.map((data) => (
        <motion.li
          key={data.id}
          layout
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{
            opacity: { duration: 0.15 },
            height: { type: "spring", stiffness: 300, damping: 30 },
            layout: { type: "spring", stiffness: 300, damping: 30 },
          }}
          onClick={() => onRemove(data.id)}
        >
          {data.label}
        </motion.li>
      ))}
    </AnimatePresence>
  );
}
```

The `layout` prop on each item causes remaining items to animate smoothly to their new positions when a sibling is removed.

**Note on `height: "auto"`:** Motion can animate to and from `"auto"` for height and width. This is a special feature; CSS transitions cannot animate to `auto`.

## Page / Route Transitions

### Next.js App Router

Wrap the page content in AnimatePresence inside the layout component. Use `key` based on the route path.

```tsx
// layout.tsx
'use client';
import { AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';

export default function Layout({ children }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
```

**Caveat:** App Router streams HTML. AnimatePresence exit animations block the new page from rendering until the exit completes. Keep exit animations under 200ms to avoid perceptible delay.

### Directional Page Transitions

```tsx
const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

function Page({ direction }) {
  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    />
  );
}
```

Pass `direction` as 1 (forward) or -1 (back). The `custom` prop makes the variants dynamic.

## Modal / Dialog Enter and Exit

### Overlay + Content

```tsx
function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="overlay"
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            key="modal"
            className="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

**Modal animation rules:**
- Enter: scale from 0.95 to 1 (not 0 to 1; extreme scale changes feel jarring).
- Add a slight y offset (8px to 15px) for a lifting feel.
- Overlay fades independently with a faster, linear transition.
- Exit must be faster than entry. The user wants the modal gone; do not make them wait.
- The `exit` values should mirror `initial` for a clean reversal.

### Bottom Sheet

```tsx
<motion.div
  initial={{ y: '100%' }}
  animate={{ y: 0 }}
  exit={{ y: '100%' }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
  drag="y"
  dragConstraints={{ top: 0 }}
  dragElastic={0.2}
  onDragEnd={(e, info) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  }}
/>
```

Combine AnimatePresence exit with drag-to-dismiss for a native-feeling bottom sheet.

## Accordion / Expandable Section

```tsx
function Accordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        <span>{title}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          &#9660;
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.15 },
            }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "16px 0" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Key details:**
- `overflow: hidden` on the animating container prevents content from being visible outside the collapsing area.
- Animate opacity faster than height so content fades before the container finishes shrinking.
- The inner `<div>` with padding keeps content spacing consistent. Do not put padding on the animated container itself (it would animate too).
- `initial={false}` on AnimatePresence prevents the accordion from playing its enter animation on page load.

## Tab Content Transitions

```tsx
function TabContent({ activeTab, tabs }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.15 }}
      >
        {tabs[activeTab].content}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Tab animation rules:**
- Use `mode="wait"` so the old content exits before new content enters.
- Keep the x offset small (8px to 15px). Tabs are not pages; large slides imply navigation hierarchy that does not exist.
- Total transition time (exit + enter) should be under 300ms. Users switch tabs rapidly.
- Direction-aware tabs (slide left for next, right for previous) add Orientation value. Track the tab index to determine direction.

### Direction-Aware Tabs

```tsx
function DirectionalTabs({ tabs }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  function handleTabChange(newIndex) {
    setDirection(newIndex > activeIndex ? 1 : -1);
    setActiveIndex(newIndex);
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={activeIndex}
        custom={direction}
        initial={{ opacity: 0, x: direction * 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -30 }}
        transition={{ duration: 0.15 }}
      >
        {tabs[activeIndex].content}
      </motion.div>
    </AnimatePresence>
  );
}
```

## Exit Animation Duration Rules

Exit animations must be fast. The user has initiated a dismissal; the element should leave promptly.

| Element | Max Exit Duration |
|---------|------------------|
| Toast / notification | 150ms |
| Modal overlay | 100ms |
| Modal content | 150ms |
| Dropdown menu | 100ms |
| Tooltip | 75ms |
| List item removal | 150ms |
| Page transition exit | 200ms |
| Bottom sheet | 200ms |
| Sidebar collapse | 200ms |

**General rule:** Exit should be 50% to 75% of the enter duration. If enter takes 300ms, exit takes 150ms to 225ms.

**Spring exits:** For spring-based exit animations, use a critically damped spring (high damping, no bounce). Bouncing on exit feels wrong; the element should leave decisively.

```tsx
exit={{ opacity: 0, scale: 0.95 }}
transition={{
  exit: { type: "spring", stiffness: 400, damping: 35 },
}}
```

## prefers-reduced-motion for Enter/Exit

### Strategy: Instant Cut

Replace all enter/exit animations with instant state changes.

```tsx
const reduced = useReducedMotion();

<motion.div
  initial={reduced ? false : { opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -20 }}
  transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 25 }}
/>
```

Under reduced motion, elements appear and disappear instantly. The opacity exit (duration: 0) ensures AnimatePresence still tracks the lifecycle correctly.

### Strategy: Fade Only

Allow a brief opacity fade (under 150ms) while removing all transform-based motion.

```tsx
const reduced = useReducedMotion();

const variants = {
  enter: reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: reduced ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.95 },
};
```

Opacity fades do not trigger vestibular responses and are safe for motion-sensitive users when kept brief.

### Strategy: Preserve Layout Animation

Layout shifts (items reordering, gaps closing) are functional, not decorative. Keep layout animations under reduced motion but make them fast and critically damped.

```tsx
<motion.li
  layout
  transition={reduced
    ? { layout: { duration: 0.1 } }
    : { layout: { type: "spring", stiffness: 300, damping: 30 } }
  }
/>
```

The list still reorganizes smoothly enough for the user to track changes, but without spring physics or overshoot.
