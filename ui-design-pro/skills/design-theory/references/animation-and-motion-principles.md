# Animation and Motion Principles

## The Purpose Test

Every animation must pass at least one of three tests. If it passes none,
do not animate.

### 1. Orientation

Motion helps the user understand where something came from or where it went.

- A sidebar slides in from the left — the user knows it can slide back.
- A modal scales up from the button that triggered it — the user sees the
  spatial relationship.
- A deleted item slides off-screen — the user knows it is gone, not hidden.

Without orientation, elements pop in and out, and the user builds no mental
model of the interface's spatial structure.

### 2. Feedback

Motion confirms that an action was received and had an effect.

- A button depresses on tap — the user knows the press registered.
- A toggle slides to its new position — the user sees the state change.
- A save indicator fades in — the user knows the data persisted.

Without feedback, the user must rely on indirect evidence (a different screen,
changed text) to verify that their action worked.

### 3. Relationship

Motion reveals how elements are connected or related.

- Expanding a card reveals detail beneath it — the detail belongs to the card.
- Dragging an item into a group shows it joining — the relationship is spatial.
- A progress bar filling as steps complete — progress and steps are linked.

Without relationship cues, the user must infer connections from proximity and
labels alone.

## When NOT to Animate

### Task-Dense Screens

Dashboards, data tables, inbox views — screens where the user processes
information rapidly. Animation on these screens increases cognitive load
by competing for attention with the data itself.

**Exception:** Loading state transitions (skeleton → content) can use a
brief fade to avoid jarring content pops.

### Repeated Actions

Actions the user performs many times per session (sending messages, filing
items, toggling settings) should have minimal or zero animation. What feels
satisfying on first use becomes annoying on the hundredth.

**Exception:** Very brief feedback (< 100ms opacity change) is acceptable
for repeated actions.

### Destructive Confirmations

Delete dialogs, irreversible actions, payment confirmations — do not add
bounce or playful spring animations. These moments require gravity.
Use critically damped springs (no overshoot) or simple fades.

## Physics Over Duration

### Why Springs Feel Right

Duration-based animations (ease-in-out over 300ms) move at a speed determined
by the designer, regardless of distance. This feels robotic because no
physical object moves this way.

Spring-based animations are defined by physical properties (stiffness,
damping, mass) and adapt their speed to the distance traveled. A 10px
move is quick; a 500px move takes longer but with the same physical feel.

### When Duration Is Acceptable

- Opacity fades (no spatial component to feel unnatural)
- Color transitions
- Very short transitions (< 150ms) where the difference is imperceptible

### The Overshoot Rule

Overshoot (bounce) communicates playfulness or energy. Use it intentionally:

| Context | Overshoot |
|---------|-----------|
| Buttons, menus, dropdowns | None (critically damped) |
| Cards, panels, content | Minimal (damping ratio 0.7-0.9) |
| Notifications, toasts | Slight (damping ratio 0.6-0.8) |
| Onboarding, celebrations | Noticeable (damping ratio 0.4-0.6) |
| Data entry, forms | None |
| Destructive actions | None |

## Perceived Performance

Motion can make interfaces feel faster or slower.

### Motion That Speeds Up Perception

- **Skeleton screens** with a shimmer animation feel faster than a spinner
  because they communicate structure before content arrives.
- **Optimistic updates** with immediate visual feedback (check appears, item
  moves) feel instant even when the network request is in flight.
- **Staggered content appearance** (items appearing 50ms apart) feels faster
  than all items appearing at once because the eye has something to track.

### Motion That Slows Down Perception

- **Loading spinners** provide no information about progress or structure.
- **Long transitions** (> 400ms) make the user wait for the animation to
  finish before they can act.
- **Entrance animations on every page load** feel like unnecessary ceremony
  after the first visit.

## The Reduced Motion Contract

Respecting `prefers-reduced-motion` is not optional. It is an accessibility
requirement for users with vestibular disorders, motion sensitivity, or
attention conditions.

### What "Reduce" Means

Reduce, not remove. The goal is to eliminate spatial movement and bouncing
while preserving state communication.

| Full Motion | Reduced Motion |
|-------------|----------------|
| Slide in from left | Fade in (opacity only) |
| Spring bounce | Instant appear or brief fade |
| Parallax scroll | Static positioning |
| Drag with physics | Drag without inertia |
| Loading shimmer | Static skeleton |

### What to Preserve

- **Opacity transitions** — these communicate state change without spatial
  movement and are generally safe for motion-sensitive users.
- **Color transitions** — safe, no vestibular impact.
- **Instant state changes** — the element still appears/disappears, just
  without the animation.

### What to Remove

- **Spatial movement** (translateX/Y, scale from a point)
- **Bounce/overshoot** (spring with low damping)
- **Parallax** (background moving at different rate)
- **Auto-playing animations** (looping, ambient motion)
- **Scroll-triggered animations** (content that animates as you scroll to it)

## Choreography

When multiple elements animate, their timing communicates hierarchy.

### Stagger Direction

Elements should stagger in the direction the user reads:
- Left-to-right in LTR layouts
- Top-to-bottom for vertical lists
- Center-out for radial layouts (rare)

### Stagger Timing

- **50ms between items** — fast enough to feel cohesive, slow enough to be
  perceived as sequential
- **Never exceed 500ms total** for a staggered sequence — after that, the
  user is waiting for the animation, not using the interface
- **Maximum 8-10 items** in a stagger — beyond that, just show them all at
  once or paginate

### Entry Before Exit

When replacing content (page transition, tab switch), the old content should
exit before the new content enters. Overlapping enter/exit creates visual
noise. The exception is shared-element transitions (layoutId) where the
element morphs in place.

## Motion and Hierarchy

Animation draws attention. Use this intentionally:

- **Primary action feedback** gets motion (the button the user just pressed).
- **Secondary elements** do not animate unless they are entering or exiting.
- **Background elements** never animate independently of user action.

If everything animates, nothing stands out. Motion is a hierarchy tool —
use it to direct attention to what matters, not to make the screen feel
"alive."
