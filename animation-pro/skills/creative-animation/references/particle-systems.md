# Particle Systems

Reference for building particle systems from scratch and with frameworks. Covers architecture, object pooling, force types, lifecycle management, trail rendering, and constraint-based particles.

## Architecture Overview

A particle system has three core components:

1. **Emitter**: controls where, when, and how particles are spawned. Holds configuration for spawn rate, initial velocity ranges, lifetime, and visual properties.
2. **Particle Pool**: a pre-allocated array of particle objects. Avoids garbage collection by reusing dead particles instead of creating new ones.
3. **Force Registry**: a list of forces (gravity, wind, attraction) applied to every active particle each frame.

Data flow per frame:
```
Emitter spawns -> Pool activates particles -> Forces update velocities ->
Integrator updates positions -> Renderer draws -> Dead particles return to pool
```

## Particle Data Structure

Keep particle data flat and minimal. Every extra field costs memory multiplied by the pool size.

```js
class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;      // remaining life in seconds
    this.maxLife = 0;    // total life (for computing age ratio)
    this.size = 1;
    this.color = [255, 255, 255, 255]; // RGBA
    this.active = false;
  }

  reset(x, y, vx, vy, life, size, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.color = color;
    this.active = true;
  }
}
```

For high-count systems (10,000+), replace the class with parallel TypedArrays.

```js
const MAX = 50000;
const x = new Float32Array(MAX);
const y = new Float32Array(MAX);
const vx = new Float32Array(MAX);
const vy = new Float32Array(MAX);
const life = new Float32Array(MAX);
let activeCount = 0;
```

## Object Pooling

### Why Pool

Creating and destroying thousands of objects per second causes garbage collection pauses that appear as visible stutters. Object pooling eliminates this entirely.

### Pool Implementation

```js
class ParticlePool {
  constructor(size) {
    this.particles = new Array(size);
    this.freeList = [];

    for (let i = 0; i < size; i++) {
      this.particles[i] = new Particle();
      this.freeList.push(i);
    }
  }

  acquire() {
    if (this.freeList.length === 0) return null;
    const idx = this.freeList.pop();
    return this.particles[idx];
  }

  release(particle) {
    particle.active = false;
    const idx = this.particles.indexOf(particle);
    this.freeList.push(idx);
  }

  forEachActive(fn) {
    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].active) {
        fn(this.particles[i], i);
      }
    }
  }
}
```

### Pool Sizing

Start with 2x the expected peak count. Monitor `freeList.length` during development. If it hits zero frequently, increase the pool. A pool that is too large wastes memory but does not cause performance issues. A pool that is too small silently drops new particles.

## Emitter Patterns

### Point Emitter

Spawn from a single coordinate with velocity spread.

```js
function emitPoint(pool, cx, cy, count) {
  for (let i = 0; i < count; i++) {
    const p = pool.acquire();
    if (!p) return;
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 100;
    p.reset(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed, 2, 3, [255, 200, 50, 255]);
  }
}
```

### Line Emitter

Spawn along a line segment. Useful for rain, waterfalls, or curtain effects.

```js
function emitLine(pool, x1, y1, x2, y2, count) {
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    const p = pool.acquire();
    if (!p) return;
    p.reset(x, y, 0, 80 + Math.random() * 40, 3, 2, [100, 150, 255, 200]);
  }
}
```

### Ring Emitter

Spawn on the circumference of a circle. Good for explosions and shockwaves.

### Burst vs Continuous

Burst: emit a fixed count in a single frame (explosions, impacts).
Continuous: emit N particles per second, accumulating fractional particles across frames.

```js
let emitAccumulator = 0;
const RATE = 200; // particles per second

function continuousEmit(dt, pool, x, y) {
  emitAccumulator += RATE * dt;
  const toEmit = Math.floor(emitAccumulator);
  emitAccumulator -= toEmit;

  for (let i = 0; i < toEmit; i++) {
    const p = pool.acquire();
    if (!p) return;
    // configure particle...
  }
}
```

## Force Types

### Gravity

Constant downward acceleration.

```js
function applyGravity(p, dt, g = 980) {
  p.vy += g * dt;
}
```

Use `g = 980` for realistic Earth gravity (pixels treated as centimeters). Use lower values (100 to 300) for floaty, atmospheric effects.

### Wind

Constant or time-varying horizontal force.

```js
function applyWind(p, dt, windX, windY) {
  p.vx += windX * dt;
  p.vy += windY * dt;
}
```

For organic wind, modulate with Perlin noise over time.

### Attraction / Repulsion

Force directed toward or away from a point. Strength falls off with distance.

```js
function applyAttraction(p, dt, targetX, targetY, strength) {
  const dx = targetX - p.x;
  const dy = targetY - p.y;
  const distSq = dx * dx + dy * dy + 1; // +1 prevents division by zero
  const force = strength / distSq;
  p.vx += dx * force * dt;
  p.vy += dy * force * dt;
}
```

Negative strength creates repulsion. Add a minimum distance threshold to prevent particles from accelerating to infinity near the attractor.

### Turbulence (Noise-Based)

Sample a 2D or 3D noise field to produce swirling, organic motion.

```js
function applyTurbulence(p, dt, noiseScale, strength, time) {
  const angle = noise(p.x * noiseScale, p.y * noiseScale, time) * Math.PI * 4;
  p.vx += Math.cos(angle) * strength * dt;
  p.vy += Math.sin(angle) * strength * dt;
}
```

This is the foundation of flow field effects. See `generative-patterns.md` for deeper coverage.

### Drag / Friction

Reduce velocity proportionally. Prevents particles from accelerating indefinitely under continuous forces.

```js
function applyDrag(p, dt, coefficient = 0.98) {
  const factor = Math.pow(coefficient, dt * 60);
  p.vx *= factor;
  p.vy *= factor;
}
```

Scale the coefficient by `dt * 60` so drag is frame-rate independent.

## Particle Lifecycle

### Spawn

Set initial position, velocity, lifetime, size, and color. Randomize within ranges for visual variety.

### Update

Each frame, for every active particle:
1. Apply all forces (modify velocity).
2. Integrate position: `x += vx * dt; y += vy * dt`.
3. Decrease lifetime: `life -= dt`.
4. Compute age ratio: `age = 1 - (life / maxLife)`. Use this for fade, shrink, and color transitions.

### Die

When `life <= 0`, mark the particle inactive and return it to the pool.

### Recycle

The pool's `acquire()` returns a previously dead particle. `reset()` overwrites all fields. No allocation occurs.

### Age-Based Visual Changes

```js
const age = 1 - (p.life / p.maxLife); // 0 at birth, 1 at death
p.size = baseSize * (1 - age * 0.5);  // Shrink to 50%
p.color[3] = 255 * (1 - age);         // Fade out alpha
```

## p5.js Particle Implementation

```js
const particles = [];
const POOL_SIZE = 1000;

function setup() {
  createCanvas(800, 600);
  for (let i = 0; i < POOL_SIZE; i++) {
    particles.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0 });
  }
}

function draw() {
  background(10, 10, 15);
  const dt = deltaTime / 1000;

  // Emit
  for (let i = 0; i < 5; i++) {
    const p = particles.find((p) => !p.active);
    if (p) {
      const angle = random(TWO_PI);
      const speed = random(30, 120);
      p.x = mouseX;
      p.y = mouseY;
      p.vx = cos(angle) * speed;
      p.vy = sin(angle) * speed;
      p.life = random(1, 3);
      p.maxLife = p.life;
      p.active = true;
    }
  }

  // Update and draw
  noStroke();
  for (const p of particles) {
    if (!p.active) continue;
    p.vy += 200 * dt; // gravity
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) { p.active = false; continue; }

    const age = 1 - p.life / p.maxLife;
    fill(255, 180, 50, 255 * (1 - age));
    circle(p.x, p.y, 6 * (1 - age * 0.5));
  }
}
```

## PixiJS ParticleContainer

For systems exceeding 10,000 particles, use PixiJS `ParticleContainer`. It batches all particles into a single draw call.

```js
const particleContainer = new PIXI.ParticleContainer(50000, {
  vertices: false,
  position: true,
  rotation: false,
  uvs: false,
  tint: true,
});
app.stage.addChild(particleContainer);

// Pre-create sprites
const sprites = [];
for (let i = 0; i < 50000; i++) {
  const s = new PIXI.Sprite(dotTexture);
  s.visible = false;
  s.anchor.set(0.5);
  particleContainer.addChild(s);
  sprites.push(s);
}
```

Update particle state in TypedArrays, then sync positions to sprites each frame. Only toggle `sprite.visible` for lifecycle management; do not add/remove children.

### Performance Notes

`ParticleContainer` sacrifices flexibility for speed. No filters, no masks, no nested containers. All particles share one texture (use a small white circle, tint with `sprite.tint`). For 50,000+ particles, this is 10x to 50x faster than regular `Container`.

## Trail Rendering

### Technique 1: History Buffer

Store the last N positions of each particle. Draw a polyline or series of shrinking circles.

```js
// Each particle stores a trail array
const TRAIL_LENGTH = 10;
p.trail = new Array(TRAIL_LENGTH).fill(null).map(() => ({ x: 0, y: 0 }));
p.trailIdx = 0;

// Each frame, record position
p.trail[p.trailIdx].x = p.x;
p.trail[p.trailIdx].y = p.y;
p.trailIdx = (p.trailIdx + 1) % TRAIL_LENGTH;
```

Draw oldest to newest with decreasing alpha. This produces smooth, fading trails.

### Technique 2: Semi-Transparent Background Clear

Instead of clearing the canvas fully each frame, draw a semi-transparent rectangle over it. Previous frames fade gradually.

```js
// In draw loop
ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
ctx.fillRect(0, 0, width, height);
// Then draw particles normally
```

This is simple and cheap but imprecise. Trails never fully disappear (residual ghosting). Works best on dark backgrounds.

### Technique 3: Offscreen Buffer

Render trails to a separate canvas. Apply a blur or fade filter to the trail canvas each frame. Composite the trail canvas behind the main particle layer. This gives full control over trail appearance at the cost of an extra canvas.

## Constraint-Based Particles

### Spring Constraint

Connect two particles with a spring force. The spring pulls them toward a rest length.

```js
function springConstraint(a, b, restLength, stiffness, dt) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
  const displacement = dist - restLength;
  const force = stiffness * displacement;
  const fx = (dx / dist) * force;
  const fy = (dy / dist) * force;

  a.vx += fx * dt;
  a.vy += fy * dt;
  b.vx -= fx * dt;
  b.vy -= fy * dt;
}
```

### Rod Constraint (Distance)

Enforce an exact distance between two particles by directly correcting positions. This is a position-based constraint, not a force.

```js
function rodConstraint(a, b, length) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
  const correction = (dist - length) / dist * 0.5;
  a.x += dx * correction;
  a.y += dy * correction;
  b.x -= dx * correction;
  b.y -= dy * correction;
}
```

Run multiple iterations per frame (3 to 5) for stability. More iterations produce stiffer constraints.

### Chain / Rope

Create a series of particles connected by rod constraints. Pin the first particle to a fixed point. Apply gravity to all others. Iterate constraints 5 to 10 times per frame. The result is a convincing rope or chain simulation.

### Cloth

Arrange particles in a 2D grid. Connect each particle to its horizontal and vertical neighbors with rod constraints. Optionally add diagonal constraints for shear resistance. Pin the top row. This produces a simple cloth simulation.

## Performance Guidelines

| Particle Count | Renderer | Expected FPS |
|----------------|----------|-------------|
| < 500 | Canvas 2D, SVG circles | 60 |
| 500 to 5,000 | Canvas 2D | 60 |
| 5,000 to 50,000 | PixiJS ParticleContainer | 60 |
| 50,000 to 500,000 | WebGL custom shader | 60 |
| > 500,000 | GPU compute (WebGPU) | Varies |

### Optimization Checklist

1. Pre-allocate all particles in a pool. Zero allocations per frame.
2. Use TypedArrays for particle state in high-count systems.
3. Skip inactive particles early in the update loop.
4. Batch draw calls: one `beginPath()` for all particles of the same color.
5. Avoid `Math.sqrt` when possible; compare squared distances instead.
6. Cull particles outside the viewport before drawing.
7. Reduce trail length before reducing particle count; trails are more expensive per particle.
