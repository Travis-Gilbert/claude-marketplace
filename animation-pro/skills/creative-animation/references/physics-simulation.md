# Physics Simulation with Matter.js

Reference for building physics-based animations with Matter.js. Covers engine setup, body creation, forces, collisions, constraints, composite bodies, custom rendering, and performance optimization.

## Architecture Overview

Matter.js has four core modules:

- **Engine**: runs the physics simulation. Contains the `World` and manages time stepping.
- **World**: holds all bodies and constraints. A container, not a simulation driver.
- **Bodies**: physical objects with position, velocity, mass, friction, and restitution.
- **Render**: optional built-in renderer for debugging. Replace with a custom renderer for production.

Additional modules:
- **Constraint**: connects two bodies (or a body to a fixed point) with distance or spring behavior.
- **Composite**: groups bodies and constraints into reusable units.
- **Events**: listen for collision events, before/after update, and render events.
- **Mouse/MouseConstraint**: built-in mouse interaction for dragging bodies.

## Basic Setup

```js
import Matter from "matter-js";

const { Engine, Render, Runner, Bodies, Composite, Events } = Matter;

// Create engine
const engine = Engine.create({
  gravity: { x: 0, y: 1, scale: 0.001 },
});

// Create renderer (optional, for debugging)
const render = Render.create({
  element: document.getElementById("container"),
  engine: engine,
  options: {
    width: 800,
    height: 600,
    wireframes: false,
    background: "#111",
  },
});

// Add bodies
const ground = Bodies.rectangle(400, 590, 800, 20, { isStatic: true });
const ball = Bodies.circle(400, 100, 30, { restitution: 0.8 });
Composite.add(engine.world, [ground, ball]);

// Run
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);
```

### Without Built-in Renderer

For production, skip `Render` entirely. Step the engine manually and draw with Canvas, PixiJS, or p5.js.

```js
const engine = Engine.create();

function animate() {
  Engine.update(engine, 1000 / 60); // step at 60fps equivalent
  drawBodies(engine.world.bodies);  // custom render function
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

Pass a fixed timestep to `Engine.update` for deterministic behavior. Alternatively, pass the actual delta for frame-rate-scaled simulation (less deterministic but smoother on variable frame rates).

## Creating Bodies

### Rectangle

```js
const box = Bodies.rectangle(x, y, width, height, options);
```

Position (`x`, `y`) is the center of the rectangle. Common options:
- `isStatic: true` for immovable objects (walls, ground).
- `restitution: 0.8` for bounciness (0 = no bounce, 1 = perfect bounce).
- `friction: 0.1` for surface friction.
- `frictionAir: 0.01` for air resistance.
- `density: 0.001` for mass calculation (mass = density * area).
- `angle: Math.PI / 4` for initial rotation (radians).

### Circle

```js
const ball = Bodies.circle(x, y, radius, options);
```

Circles are the cheapest collision shape. Use circles whenever possible.

### Polygon

```js
const hexagon = Bodies.polygon(x, y, sides, radius, options);
```

Creates a regular polygon. `sides = 3` for triangle, `sides = 6` for hexagon.

### Trapezoid

```js
const trapezoid = Bodies.trapezoid(x, y, width, height, slope, options);
```

`slope` controls the taper (0 to 1).

### fromVertices

Create an arbitrary convex (or decomposed concave) shape from a vertex array.

```js
const vertices = [
  { x: 0, y: 0 },
  { x: 40, y: -20 },
  { x: 60, y: 0 },
  { x: 60, y: 40 },
  { x: 0, y: 40 },
];
const custom = Bodies.fromVertices(300, 200, vertices);
```

For concave shapes, Matter.js automatically decomposes the polygon using `poly-decomp` (must be loaded separately or bundled). Include `poly-decomp` in the project for concave body support:

```js
import decomp from "poly-decomp";
Matter.Common.setDecomp(decomp);
```

### Setting Body Properties After Creation

```js
Matter.Body.setPosition(body, { x: 100, y: 200 });
Matter.Body.setVelocity(body, { x: 5, y: -3 });
Matter.Body.setAngle(body, Math.PI / 2);
Matter.Body.setAngularVelocity(body, 0.1);
Matter.Body.setStatic(body, true);
```

Always use these setter functions. Do not modify `body.position.x` directly; it bypasses internal state updates.

## Forces and Gravity

### World Gravity

```js
engine.gravity.x = 0;
engine.gravity.y = 1;       // downward
engine.gravity.scale = 0.001; // default scale
```

Set `engine.gravity.y = 0` for top-down simulations. Set `engine.gravity.scale = 0` to disable gravity entirely.

### Applying Forces

```js
// Apply force at body's center
Matter.Body.applyForce(body, body.position, { x: 0.05, y: -0.1 });

// Apply force at a specific point (creates torque if off-center)
const point = { x: body.position.x + 20, y: body.position.y };
Matter.Body.applyForce(body, point, { x: 0, y: -0.05 });
```

Forces are applied per frame. For continuous forces (thrust, wind), apply them inside a `beforeUpdate` event.

```js
Events.on(engine, "beforeUpdate", () => {
  const windForce = { x: 0.002 * Math.sin(engine.timing.timestamp * 0.001), y: 0 };
  engine.world.bodies.forEach((body) => {
    if (!body.isStatic) {
      Matter.Body.applyForce(body, body.position, windForce);
    }
  });
});
```

### Impulse vs Force

Matter.js does not have a separate impulse function. To simulate an impulse (instantaneous velocity change), set velocity directly:

```js
Matter.Body.setVelocity(body, {
  x: body.velocity.x + impulseX,
  y: body.velocity.y + impulseY,
});
```

## Collision Detection and Events

### Collision Events

```js
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((pair) => {
    const { bodyA, bodyB } = pair;
    // Collision just began between bodyA and bodyB
    handleCollision(bodyA, bodyB);
  });
});

Events.on(engine, "collisionActive", (event) => {
  // Fires every frame while bodies remain in contact
});

Events.on(engine, "collisionEnd", (event) => {
  // Bodies separated
});
```

### Collision Filtering

Control which bodies can collide using categories and masks.

```js
const CATEGORY_PLAYER = 0x0001;
const CATEGORY_ENEMY = 0x0002;
const CATEGORY_WALL = 0x0004;

const player = Bodies.circle(100, 100, 20, {
  collisionFilter: {
    category: CATEGORY_PLAYER,
    mask: CATEGORY_WALL | CATEGORY_ENEMY,
  },
});

const pickup = Bodies.circle(300, 100, 10, {
  collisionFilter: {
    category: CATEGORY_ENEMY,
    mask: CATEGORY_PLAYER, // Only collides with player
  },
});
```

Bodies in the same `group` (positive integer) always collide with each other. Bodies with `group = -1` never collide with others in group `-1`.

### Sensor Bodies

Bodies that detect collisions but do not produce physical responses.

```js
const trigger = Bodies.rectangle(400, 300, 100, 100, {
  isSensor: true,
  isStatic: true,
});
```

Sensor bodies fire collision events but pass through other bodies. Use them for trigger zones, checkpoints, and detection areas.

## Constraints

### Distance Constraint

Connect two bodies at a fixed distance.

```js
const constraint = Matter.Constraint.create({
  bodyA: bodyA,
  bodyB: bodyB,
  length: 100,        // rest length
  stiffness: 0.7,     // 0 to 1 (0 = limp, 1 = rigid)
  damping: 0.1,       // 0 to 1 (reduces oscillation)
});
Composite.add(engine.world, constraint);
```

### Point Constraint (Pin to World)

Pin a body to a fixed point in the world.

```js
const pin = Matter.Constraint.create({
  pointA: { x: 400, y: 50 }, // world coordinate
  bodyB: pendulumBob,
  length: 200,
  stiffness: 1,
});
```

### Spring Behavior

Low stiffness (0.01 to 0.1) with moderate damping (0.05) creates spring-like behavior. The body oscillates around the rest length.

```js
const spring = Matter.Constraint.create({
  bodyA: anchor,
  bodyB: weight,
  length: 100,
  stiffness: 0.05,
  damping: 0.02,
});
```

### Mouse Constraint

Enable drag-and-drop interaction.

```js
const mouse = Matter.Mouse.create(render.canvas);
const mouseConstraint = Matter.MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.2,
    render: { visible: false },
  },
});
Composite.add(engine.world, mouseConstraint);

// Keep render in sync with mouse
render.mouse = mouse;
```

For custom renderers (not using `Matter.Render`), create the `Mouse` on the canvas element and update it manually.

## Composite Bodies

Group multiple bodies and constraints into a single unit.

### Soft Body

```js
const softBody = Matter.Composites.softBody(
  200, 100,    // position
  5, 5,        // columns, rows
  0, 0,        // columnGap, rowGap
  true,         // crossBrace (diagonal constraints)
  18,           // particle size
  {             // particle options
    friction: 0.05,
    frictionStatic: 0.1,
  },
  {             // constraint options
    stiffness: 0.06,
    damping: 0.01,
  }
);
Composite.add(engine.world, softBody);
```

### Chain

```js
const chain = Matter.Composites.chain(
  composite,
  0.5, 0,      // offset A (relative to body center)
  -0.5, 0,     // offset B
  {
    stiffness: 0.8,
    length: 2,
  }
);
```

### Stack

Create a grid of bodies.

```js
const stack = Matter.Composites.stack(100, 100, 10, 5, 0, 0, (x, y) => {
  return Bodies.rectangle(x, y, 40, 40, { restitution: 0.5 });
});
Composite.add(engine.world, stack);
```

### Pyramid

```js
const pyramid = Matter.Composites.pyramid(200, 400, 9, 6, 0, 0, (x, y) => {
  return Bodies.rectangle(x, y, 30, 30);
});
```

## Custom Rendering

### Canvas 2D Renderer

```js
function drawBodies(ctx, bodies) {
  bodies.forEach((body) => {
    if (body.parts.length > 1) {
      // Composite body: draw each part
      body.parts.slice(1).forEach((part) => drawPart(ctx, part));
    } else {
      drawPart(ctx, body);
    }
  });
}

function drawPart(ctx, part) {
  const vertices = part.vertices;
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  for (let i = 1; i < vertices.length; i++) {
    ctx.lineTo(vertices[i].x, vertices[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = part.render.fillStyle || "#fff";
  ctx.fill();
  ctx.strokeStyle = "#666";
  ctx.stroke();
}
```

### p5.js Integration

```js
function draw() {
  background(20);
  Engine.update(engine, deltaTime);

  engine.world.bodies.forEach((body) => {
    if (body.isStatic) return;
    const pos = body.position;
    const angle = body.angle;

    push();
    translate(pos.x, pos.y);
    rotate(angle);
    if (body.circleRadius) {
      ellipse(0, 0, body.circleRadius * 2);
    } else {
      beginShape();
      body.vertices.forEach((v) => vertex(v.x - pos.x, v.y - pos.y));
      endShape(CLOSE);
    }
    pop();
  });
}
```

### PixiJS Integration

Create a PIXI.Sprite or PIXI.Graphics for each body. Each frame, sync sprite positions and rotations with body state.

```js
app.ticker.add(() => {
  Engine.update(engine);
  bodies.forEach(({ body, sprite }) => {
    sprite.x = body.position.x;
    sprite.y = body.position.y;
    sprite.rotation = body.angle;
  });
});
```

## Walls and Boundaries

Create a static boundary so bodies do not fall off screen.

```js
const thickness = 50;
const walls = [
  Bodies.rectangle(width / 2, height + thickness / 2, width, thickness, { isStatic: true }),  // floor
  Bodies.rectangle(width / 2, -thickness / 2, width, thickness, { isStatic: true }),           // ceiling
  Bodies.rectangle(-thickness / 2, height / 2, thickness, height, { isStatic: true }),         // left
  Bodies.rectangle(width + thickness / 2, height / 2, thickness, height, { isStatic: true }),  // right
];
Composite.add(engine.world, walls);
```

Place walls just outside the viewport so they are invisible but catch bodies.

## Removing Bodies

```js
Composite.remove(engine.world, body);
```

Remove bodies that leave the viewport to prevent unbounded memory growth.

```js
Events.on(engine, "afterUpdate", () => {
  const margin = 200;
  engine.world.bodies.forEach((body) => {
    if (body.isStatic) return;
    if (body.position.y > height + margin || body.position.x < -margin || body.position.x > width + margin) {
      Composite.remove(engine.world, body);
    }
  });
});
```

## Performance Tips

### Body Count Limits

Matter.js uses a broadphase (grid or SAP) collision detection. Performance scales roughly O(n log n) with body count.

| Body Count | Expected FPS | Notes |
|-----------|-------------|-------|
| < 100 | 60 | No concerns |
| 100 to 500 | 60 | Default settings fine |
| 500 to 1,000 | 45 to 60 | Optimize collision filtering |
| 1,000 to 2,000 | 30 to 50 | Use simple shapes, reduce constraints |
| > 2,000 | < 30 | Consider a different physics engine |

### Optimization Strategies

1. **Use circles** wherever possible. Circle-circle collision is the cheapest test.
2. **Enable sleeping.** Bodies at rest stop being simulated. `engine.enableSleeping = true`.
3. **Collision filtering.** Reduce the number of collision pairs with categories and masks.
4. **Remove off-screen bodies.** Clean up bodies that leave the viewport.
5. **Reduce constraint iterations.** Lower `engine.constraintIterations` (default 2) if constraints are not critical.
6. **Reduce position iterations.** Lower `engine.positionIterations` (default 6) for faster but less accurate simulation.
7. **Fixed timestep.** Pass a consistent delta to `Engine.update` to avoid variable-step instability.

### Sleeping

```js
const engine = Engine.create({ enableSleeping: true });

// Configure per body
const body = Bodies.rectangle(100, 100, 50, 50, {
  sleepThreshold: 60, // frames of low velocity before sleeping
});
```

Sleeping bodies are excluded from collision detection and integration. They wake automatically when another body collides with them.

### Debug Rendering

For performance profiling, enable wireframe mode in the built-in renderer.

```js
const render = Render.create({
  // ...
  options: { wireframes: true },
});
```

Wireframe mode skips fill, textures, and sprite rendering, showing only collision geometry. This isolates physics performance from rendering performance.
