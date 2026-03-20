# Motion Canvas Generators Reference

## Scene Structure

Motion Canvas uses generator functions as scenes. Each scene is an async generator that yields animation instructions. The runtime steps through these instructions frame by frame.

```tsx
import { makeScene2D } from '@motion-canvas/2d';

export default makeScene2D(function* (view) {
  // Animation code here
  // Each yield advances the timeline
});
```

For 3D scenes, use `makeScene` from `@motion-canvas/core`. The 2D variant is far more common for motion graphics and explainer content.

Register scenes in the project configuration:

```ts
import { makeProject } from '@motion-canvas/core';
import intro from './scenes/intro?scene';
import mainContent from './scenes/mainContent?scene';

export default makeProject({
  scenes: [intro, mainContent],
});
```

The `?scene` import suffix is required. It tells the bundler to treat the module as a scene definition.

## Signals

Signals are reactive values that drive animations. When a signal changes, any node property bound to it updates automatically.

```tsx
import { createSignal } from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const progress = createSignal(0);
  const radius = createSignal(50);

  // Bind signal to node property
  view.add(
    <Circle
      size={() => radius() * 2}
      fill={'#3b82f6'}
      opacity={() => progress()}
    />
  );

  // Animate the signal
  yield* progress(1, 0.6);    // Animate to 1 over 0.6 seconds
  yield* radius(120, 0.4);    // Animate to 120 over 0.4 seconds
});
```

### Computed Signals

Derive values from other signals. Computed signals update automatically when their dependencies change.

```tsx
const x = createSignal(0);
const y = createSignal(0);
const distance = () => Math.sqrt(x() ** 2 + y() ** 2);

// distance updates whenever x or y changes
```

### Signal Interpolation

Animate signals with the `.to()` syntax or by calling the signal as a function with a target value and duration:

```tsx
const scale = createSignal(0);

// These are equivalent:
yield* scale(1, 0.5);              // Call with target and duration
yield* scale.to(1).over(0.5);      // Chained syntax (less common)
```

Pass an easing function as the third argument:

```tsx
import { easeOutCubic } from '@motion-canvas/core';

yield* scale(1, 0.5, easeOutCubic);
```

## Animation Primitives

### all()

Run multiple animations simultaneously. The combined animation completes when the longest inner animation finishes.

```tsx
import { all } from '@motion-canvas/core';

yield* all(
  rect().position.x(300, 0.6),
  rect().opacity(1, 0.4),
  circle().scale(1.5, 0.8),
);
```

### sequence()

Run animations in order with an optional delay between each start. The delay parameter controls how long after one animation begins before the next one starts (not the gap between end and start).

```tsx
import { sequence } from '@motion-canvas/core';

// Each animation starts 0.2 seconds after the previous one starts
yield* sequence(
  0.2,
  rect1().opacity(1, 0.5),
  rect2().opacity(1, 0.5),
  rect3().opacity(1, 0.5),
);
```

This creates a staggered entrance. The first starts at t=0, the second at t=0.2, the third at t=0.4. All three overlap.

### chain()

Run animations strictly one after another. Each animation waits for the previous one to complete before starting.

```tsx
import { chain } from '@motion-canvas/core';

yield* chain(
  rect().position.x(200, 0.5),
  rect().position.y(200, 0.5),
  rect().rotation(45, 0.3),
);
```

### loop()

Repeat an animation a specified number of times, or indefinitely.

```tsx
import { loop } from '@motion-canvas/core';

// Repeat 3 times
yield* loop(3, () => chain(
  circle().scale(1.2, 0.3),
  circle().scale(1, 0.3),
));

// Infinite loop (use with caution; pair with a cancel mechanism)
yield* loop(Infinity, () => chain(
  circle().fill('#f00', 0.5),
  circle().fill('#00f', 0.5),
));
```

### waitFor()

Pause the timeline for a specified duration.

```tsx
import { waitFor } from '@motion-canvas/core';

yield* rect().opacity(1, 0.5);
yield* waitFor(1);                 // Hold for 1 second
yield* rect().opacity(0, 0.5);
```

### waitUntil()

Pause until a named time marker. Define markers in the editor timeline for precise sync points (especially useful with voiceover).

```tsx
import { waitUntil } from '@motion-canvas/core';

yield* titleText().text('Introduction', 0.4);
yield* waitUntil('section-two');   // Wait for marker named "section-two"
yield* titleText().text('Deep Dive', 0.4);
```

## Node Types

### Rect

```tsx
import { Rect } from '@motion-canvas/2d';

<Rect
  width={200}
  height={100}
  fill={'#3b82f6'}
  stroke={'#1e3a5f'}
  lineWidth={3}
  radius={12}        // Corner radius
  position={[0, 0]}
/>
```

### Circle

```tsx
import { Circle } from '@motion-canvas/2d';

<Circle
  size={100}          // Diameter
  fill={'#ef4444'}
  startAngle={0}
  endAngle={360}      // Animate for pie/arc effects
/>
```

### Line

```tsx
import { Line } from '@motion-canvas/2d';

<Line
  points={[[-100, 0], [0, -80], [100, 0]]}
  stroke={'#10b981'}
  lineWidth={4}
  closed={false}       // Set true for polygons
  end={0}              // Animate from 0 to 1 for draw-on effect
/>
```

Animate `end` from 0 to 1 to create a line drawing effect:

```tsx
const line = createRef<Line>();
yield* line().end(1, 1.5);
```

### Txt

```tsx
import { Txt } from '@motion-canvas/2d';

<Txt
  text={'Hello World'}
  fontSize={48}
  fontFamily={'Inter'}
  fill={'#ffffff'}
  textAlign={'center'}
/>
```

Animate text content directly:

```tsx
const label = createRef<Txt>();
yield* label().text('Updated text', 0.3);
```

### Img

```tsx
import { Img } from '@motion-canvas/2d';

<Img
  src={'/images/photo.png'}
  width={400}
  height={300}
  radius={8}
/>
```

### Layout

A flex container for arranging child nodes. Uses CSS flexbox semantics.

```tsx
import { Layout } from '@motion-canvas/2d';

<Layout
  direction={'row'}
  gap={20}
  alignItems={'center'}
  justifyContent={'center'}
  width={800}
>
  <Rect width={100} height={100} fill={'#f00'} />
  <Rect width={100} height={100} fill={'#0f0'} />
  <Rect width={100} height={100} fill={'#00f'} />
</Layout>
```

Layout is essential for building structured compositions (code blocks, data tables, card grids) that need automatic spacing.

## Tweening with .to() and Duration

Every animatable property on a node supports direct tweening:

```tsx
const rect = createRef<Rect>();

// Animate position
yield* rect().position.x(300, 0.8);
yield* rect().position.y(-100, 0.5);

// Animate fill color
yield* rect().fill('#ef4444', 0.4);

// Animate size
yield* rect().width(400, 0.6);

// Animate rotation (in degrees)
yield* rect().rotation(90, 0.5);

// Animate with easing
yield* rect().scale(1.5, 0.4, easeInOutQuad);
```

Chain multiple property animations using `all()` for simultaneous playback:

```tsx
yield* all(
  rect().position([200, -50], 0.6),
  rect().rotation(15, 0.6),
  rect().opacity(0.8, 0.3),
);
```

## References

### createRef

Obtain a reference to a single node for imperative animation:

```tsx
import { createRef } from '@motion-canvas/core';
import { Rect } from '@motion-canvas/2d';

export default makeScene2D(function* (view) {
  const myRect = createRef<Rect>();

  view.add(
    <Rect ref={myRect} width={200} height={200} fill={'#3b82f6'} />
  );

  yield* myRect().position.x(300, 1);
});
```

### createRefArray

For collections of nodes that need coordinated animation:

```tsx
import { createRefArray } from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const bars = createRefArray<Rect>();

  view.add(
    <Layout direction={'row'} gap={10}>
      {[80, 120, 60, 140, 90].map((h, i) => (
        <Rect
          ref={bars}
          key={i}
          width={40}
          height={0}
          fill={'#3b82f6'}
        />
      ))}
    </Layout>
  );

  // Staggered bar chart animation
  yield* sequence(
    0.1,
    ...bars.map((bar, i) => bar.height([80, 120, 60, 140, 90][i], 0.5)),
  );
});
```

## View Transitions

Built-in transitions for moving between scenes:

```tsx
import { fadeTransition, slideTransition, zoomTransition } from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  yield* fadeTransition(0.6);

  // Scene content and animations follow
});
```

### fadeTransition

Cross-dissolves between the previous scene and the current one. Takes a duration in seconds.

### slideTransition

Slides the new scene in from a specified direction:

```tsx
import { slideTransition, Direction } from '@motion-canvas/core';

yield* slideTransition(Direction.Right, 0.5);
```

Directions: `Direction.Left`, `Direction.Right`, `Direction.Top`, `Direction.Bottom`.

### zoomTransition

Zooms in or out to reveal the new scene:

```tsx
import { zoomTransition } from '@motion-canvas/core';

yield* zoomTransition(1.5, 0.8);  // Scale factor, duration
```

### Custom Transitions

Build custom transitions using generators. The transition function receives the previous scene and controls when to swap:

```tsx
import { makeTransition } from '@motion-canvas/core';

function* wipeTransition(duration: number) {
  const progress = createSignal(0);

  yield* makeTransition(function* (previous) {
    previous.style.clipPath = () =>
      `inset(0 ${progress() * 100}% 0 0)`;

    yield* progress(1, duration);
  });
}

// Usage in scene
yield* wipeTransition(0.8);
```

## Code Animation

Motion Canvas has first-class support for code display and animation, ideal for programming tutorials and explainers.

```tsx
import { Code, lines, word, range } from '@motion-canvas/2d';

export default makeScene2D(function* (view) {
  const code = createRef<Code>();

  view.add(
    <Code
      ref={code}
      fontSize={28}
      fontFamily={'JetBrains Mono'}
      code={`function greet(name) {
  return 'Hello, ' + name;
}`}
    />
  );

  // Highlight specific lines
  yield* code().selection(lines(1), 0.3);

  // Highlight a word
  yield* code().selection(word(1, 9, 4), 0.3);   // line, column, length

  // Animate code changes (morphs between old and new)
  yield* code().code(`function greet(name: string): string {
  return \`Hello, \${name}!\`;
}`, 0.8);

  // Clear selection
  yield* code().selection([], 0.3);
});
```

The `Code` node handles syntax highlighting automatically. Specify the language via the `language` prop. When animating code changes, Motion Canvas morphs between states, showing insertions, deletions, and modifications with smooth transitions.

## Mathematical Expressions and LaTeX

Render mathematical notation using the `Latex` node (requires the `@motion-canvas/2d` LaTeX extension):

```tsx
import { Latex } from '@motion-canvas/2d';

export default makeScene2D(function* (view) {
  const equation = createRef<Latex>();

  view.add(
    <Latex
      ref={equation}
      tex={'E = mc^2'}
      fill={'#ffffff'}
      fontSize={64}
    />
  );

  // Animate to a different expression
  yield* equation().tex('E = \\frac{1}{2}mv^2', 0.6);
});
```

Combine LaTeX with code animations for technical explainer videos. Place equations and code blocks in a Layout node for structured educational content.

## Scene Organization Patterns

### Modular Scene Files

Keep each scene in its own file. Use a consistent naming convention:

```
src/scenes/
  01-intro.tsx
  02-problem.tsx
  03-solution.tsx
  04-demo.tsx
  05-outro.tsx
```

### Shared Animation Utilities

Extract reusable animation patterns:

```tsx
// src/utils/animations.ts
import { all, sequence, chain } from '@motion-canvas/core';

export function* fadeInUp(node: any, duration = 0.5) {
  node.opacity(0);
  node.position.y(30);
  yield* all(
    node.opacity(1, duration),
    node.position.y(0, duration),
  );
}

export function* staggerChildren(nodes: any[], delay = 0.1, duration = 0.4) {
  yield* sequence(
    delay,
    ...nodes.map(n => all(
      n.opacity(1, duration),
      n.position.y(0, duration),
    )),
  );
}
```

### Data Driven Scenes

Pass data into scenes via project variables or imported JSON:

```tsx
import chartData from '../data/chart.json';

export default makeScene2D(function* (view) {
  const bars = createRefArray<Rect>();

  view.add(
    <Layout direction={'row'} gap={8} alignItems={'flex-end'}>
      {chartData.values.map((val, i) => (
        <Rect ref={bars} key={i} width={30} height={0} fill={'#3b82f6'} />
      ))}
    </Layout>
  );

  yield* sequence(
    0.05,
    ...chartData.values.map((val, i) => bars[i].height(val * 3, 0.4)),
  );
});
```

## Best Practices

1. Use `createRef` for every node that will be animated. Anonymous nodes cannot be targeted after creation.
2. Prefer `sequence()` with small delays over `chain()` for entrance animations. Staggered timing feels more natural than strict sequential playback.
3. Keep scene generators under 200 lines. Extract helper generators for complex sequences.
4. Use `waitUntil()` markers for voiceover sync. This decouples animation timing from hardcoded durations.
5. Test transitions between scenes early. Scene order and transition type significantly affect pacing.
6. Use Layout nodes for any structured content. Manual absolute positioning breaks when content length varies.
7. Always set initial state before animating. If a node should fade in, set its initial opacity to 0 in the JSX.
