# Frame Loop Architecture

Reference for implementing animation loops across vanilla JavaScript, p5.js, PixiJS, and D3. Covers delta time, frame rate independence, pause/resume, and performance monitoring.

## requestAnimationFrame (Vanilla)

### Basic Loop

Store the animation frame ID for cleanup. Pass a timestamp to every frame callback.

```js
let animationId = null;

function animate(timestamp) {
  // Update state
  // Draw frame
  animationId = requestAnimationFrame(animate);
}

// Start
animationId = requestAnimationFrame(animate);

// Stop
cancelAnimationFrame(animationId);
animationId = null;
```

### With Delta Time

Compute the elapsed milliseconds since the last frame. Use this delta to drive all motion so that animation speed is independent of frame rate.

```js
let lastTime = 0;

function animate(timestamp) {
  const dt = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;

  // Guard against huge deltas (tab was backgrounded)
  const clampedDt = Math.min(dt, 0.1);

  updatePhysics(clampedDt);
  render();

  requestAnimationFrame(animate);
}

requestAnimationFrame((t) => {
  lastTime = t;
  requestAnimationFrame(animate);
});
```

Clamp the delta to a maximum (0.1s is a good default). When a browser tab loses focus, `requestAnimationFrame` pauses. On return, the accumulated delta would be enormous, causing objects to teleport. Clamping prevents this.

### Cleanup in React

Wrap the loop in a `useEffect` cleanup pattern. Cancel on unmount.

```js
useEffect(() => {
  let id;
  let last = performance.now();

  function tick(now) {
    const dt = (now - last) / 1000;
    last = now;
    update(dt);
    draw();
    id = requestAnimationFrame(tick);
  }

  id = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(id);
}, []);
```

Store mutable state in refs (`useRef`) rather than React state. Calling `setState` every frame causes unnecessary re-renders.

## p5.js draw() Loop

### setup() and draw()

p5 calls `setup()` once, then calls `draw()` repeatedly at the target frame rate (default 60 fps).

```js
function setup() {
  createCanvas(800, 600);
  frameRate(60);
}

function draw() {
  background(20);
  // deltaTime is a built-in p5 global (milliseconds)
  const dt = deltaTime / 1000;
  updateParticles(dt);
  renderParticles();
}
```

`deltaTime` is a built-in p5 variable containing milliseconds since the last frame. Use it for frame-rate-independent motion.

### Controlling the Loop

```js
noLoop();      // Stop draw() from repeating
loop();        // Resume draw() repeating
redraw();      // Call draw() exactly once (useful when paused)
```

Call `noLoop()` in `setup()` for event-driven sketches that only redraw on interaction. Call `redraw()` inside mouse or keyboard handlers to trigger a single frame.

### Instance Mode

For embedding in frameworks (React, Next.js), use instance mode to avoid global namespace pollution.

```js
const sketch = (p) => {
  p.setup = () => {
    p.createCanvas(400, 400);
  };
  p.draw = () => {
    p.background(0);
    p.ellipse(p.mouseX, p.mouseY, 20);
  };
};

new p5(sketch, containerElement);
```

Dispose by calling `.remove()` on the p5 instance during cleanup.

## PixiJS app.ticker

### Ticker Basics

PixiJS provides a `Ticker` that fires a callback each frame. The callback receives a `ticker` object with `deltaTime` (frame delta scaled to target speed) and `deltaMS` (raw milliseconds).

```js
const app = new PIXI.Application();
await app.init({ width: 800, height: 600 });

app.ticker.add((ticker) => {
  // ticker.deltaTime: 1.0 at target FPS, scales proportionally
  // ticker.deltaMS: raw milliseconds since last tick
  sprite.x += speed * ticker.deltaTime;
});
```

`ticker.deltaTime` is normalized: at 60fps it equals ~1.0. If the frame takes twice as long, it equals ~2.0. Multiply velocities by `ticker.deltaTime` for smooth motion.

### Ticker Priority

Control execution order with priority constants.

```js
app.ticker.add(updatePhysics, undefined, PIXI.UPDATE_PRIORITY.HIGH);
app.ticker.add(renderEffects, undefined, PIXI.UPDATE_PRIORITY.NORMAL);
app.ticker.add(updateUI, undefined, PIXI.UPDATE_PRIORITY.LOW);
```

Higher priority callbacks execute first within each frame.

### Manual Ticker Control

```js
app.ticker.stop();          // Pause all animation
app.ticker.start();         // Resume
app.ticker.speed = 0.5;     // Half speed (slow motion)
app.ticker.maxFPS = 30;     // Cap frame rate
```

## D3 d3.timer Pattern

### Basic Timer

`d3.timer` calls a function every frame until stopped. The callback receives elapsed milliseconds since the timer started.

```js
import { timer } from "d3-timer";

const t = timer((elapsed) => {
  // elapsed: ms since timer started
  const progress = elapsed / duration;

  if (progress >= 1) {
    // Final state
    finalize();
    t.stop();
    return;
  }

  interpolate(progress);
});
```

### d3.timeout and d3.interval

For one-shot or repeating delays that align with the animation frame.

```js
import { timeout, interval } from "d3-timer";

// Run once after 500ms
timeout(() => { flash(); }, 500);

// Run every 2000ms
const heartbeat = interval(() => { pulse(); }, 2000);
heartbeat.stop(); // Cancel
```

These are preferable to `setTimeout`/`setInterval` because they synchronize with the browser's rendering cycle and pause when the tab is backgrounded.

### Timer with Delay

```js
const t = timer((elapsed) => {
  update(elapsed);
  if (elapsed > 5000) t.stop();
}, 1000); // Start after 1000ms delay
```

## Delta Time: Principles

### Why Delta Time Matters

Without delta time, animation speed is tied to frame rate. A 144Hz monitor would show twice the speed of a 72Hz monitor. Delta time decouples simulation speed from rendering speed.

### The Formula

```
position += velocity * deltaTime
velocity += acceleration * deltaTime
```

All physics quantities (velocity, acceleration, force) should be defined in units per second. Multiply by `dt` (in seconds) each frame.

### Fixed vs Variable Timestep

**Variable timestep** (use the actual delta): Simple, works for most visual animations. Can produce inconsistent physics if deltas vary wildly.

**Fixed timestep with accumulator**: Deterministic physics. Accumulate real time, then step the simulation in fixed increments.

```js
const FIXED_DT = 1 / 60;
let accumulator = 0;

function animate(timestamp) {
  const frameDt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  accumulator += Math.min(frameDt, 0.1);

  while (accumulator >= FIXED_DT) {
    updatePhysics(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  // Interpolate render state for smooth visuals
  const alpha = accumulator / FIXED_DT;
  render(alpha);

  requestAnimationFrame(animate);
}
```

Use fixed timestep when physics consistency matters (collisions, springs, multiplayer sync). Use variable timestep for purely visual effects (particles, transitions, decorative motion).

## Frame Rate Independence Checklist

1. Define all velocities in units per second, not units per frame.
2. Multiply every position update by `dt`.
3. Clamp `dt` to prevent huge jumps after tab focus loss.
4. Test at both 30fps and 144Hz (throttle in DevTools > Performance > CPU throttling).
5. For physics simulations, prefer a fixed timestep accumulator.

## Pausing and Resuming

### State Machine Approach

```js
const State = { RUNNING: "running", PAUSED: "paused" };
let state = State.RUNNING;
let pausedAt = 0;

function setPaused(paused) {
  if (paused) {
    state = State.PAUSED;
    pausedAt = performance.now();
  } else {
    state = State.RUNNING;
    // Reset lastTime to avoid a huge delta on resume
    lastTime = performance.now();
  }
}

function animate(timestamp) {
  if (state === State.PAUSED) {
    requestAnimationFrame(animate);
    return;
  }
  // normal update...
  requestAnimationFrame(animate);
}
```

The critical detail: reset `lastTime` when unpausing. Otherwise the delta will include the entire pause duration.

### Visibility API Integration

Automatically pause when the user switches tabs.

```js
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    setPaused(true);
  } else {
    setPaused(false);
  }
});
```

This is especially important for games, physics simulations, and audio-synced animations.

## Performance Monitoring

### FPS Counter

```js
let frameCount = 0;
let fpsTime = 0;
let currentFps = 0;

function animate(timestamp) {
  frameCount++;
  if (timestamp - fpsTime >= 1000) {
    currentFps = frameCount;
    frameCount = 0;
    fpsTime = timestamp;
  }
  // Optionally render currentFps to a DOM overlay
  // ...
  requestAnimationFrame(animate);
}
```

### Frame Budget Tracking

At 60fps, each frame has ~16.67ms. Measure how much time the update and render phases consume.

```js
function animate(timestamp) {
  const updateStart = performance.now();
  update(dt);
  const updateEnd = performance.now();

  render();
  const renderEnd = performance.now();

  const updateMs = updateEnd - updateStart;
  const renderMs = renderEnd - updateEnd;
  const totalMs = renderEnd - updateStart;

  if (totalMs > 16) {
    console.warn(`Frame over budget: ${totalMs.toFixed(1)}ms`);
  }

  requestAnimationFrame(animate);
}
```

### Common Performance Pitfalls

**Garbage collection spikes.** Allocating objects inside the loop (new Vector, new Array) triggers GC pauses. Pre-allocate and reuse objects.

**Layout thrashing.** Reading DOM properties (offsetWidth, getBoundingClientRect) inside the animation loop forces layout recalculation. Cache these values outside the loop and update only on resize.

**Overdraw.** Drawing the full canvas every frame when only a small region changed. Use dirty-rectangle tracking for complex scenes.

**Too many draw calls.** Batch similar drawing operations. In Canvas 2D, minimize `beginPath()`/`stroke()` pairs by combining paths. In PixiJS, use `ParticleContainer` or `Graphics` batching.

## Architecture Patterns

### Separation of Update and Render

Keep simulation logic (`update`) separate from drawing logic (`render`). This enables:
1. Running physics at a different rate than rendering.
2. Testing update logic without a canvas.
3. Swapping renderers (Canvas, WebGL, SVG) without touching simulation code.

```js
function gameLoop(timestamp) {
  const dt = computeDelta(timestamp);
  update(dt);   // Pure state mutation
  render();     // Pure drawing from state
  requestAnimationFrame(gameLoop);
}
```

### Entity-Component Pattern

For scenes with many animated objects, store state in flat arrays rather than nested objects. Flat arrays are cache-friendly and reduce GC pressure.

```js
const positions = new Float32Array(MAX_ENTITIES * 2);
const velocities = new Float32Array(MAX_ENTITIES * 2);

function updateAll(dt) {
  for (let i = 0; i < activeCount * 2; i += 2) {
    positions[i] += velocities[i] * dt;
    positions[i + 1] += velocities[i + 1] * dt;
  }
}
```

TypedArrays (`Float32Array`, `Float64Array`) are more performant than plain arrays for numerical data in tight loops.
