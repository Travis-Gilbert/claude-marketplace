# Generative Patterns

Reference for algorithmic visual generation. Covers flow fields, noise functions, L-systems, cellular automata, reaction-diffusion, Voronoi, seeded randomness, and parameter exploration.

## Flow Fields

### Concept

A flow field is a 2D grid where each cell stores an angle (or vector). Particles moving through the field sample the angle at their current position and steer accordingly. The result is smooth, organic motion.

### Perlin Noise Grid

Generate angles from a noise function. The noise field changes smoothly in space, producing coherent flow.

```js
const COLS = 80;
const ROWS = 60;
const CELL_SIZE = 10;
const angles = new Float32Array(COLS * ROWS);

function generateField(time) {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const noiseVal = noise(x * 0.05, y * 0.05, time * 0.3);
      angles[y * COLS + x] = noiseVal * Math.PI * 4;
    }
  }
}
```

### Particle Advection

Move particles along the flow field by sampling the angle at their position.

```js
function advectParticle(p, dt) {
  const col = Math.floor(p.x / CELL_SIZE);
  const row = Math.floor(p.y / CELL_SIZE);

  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
    resetParticle(p); // respawn if out of bounds
    return;
  }

  const angle = angles[row * COLS + col];
  p.vx = Math.cos(angle) * p.speed;
  p.vy = Math.sin(angle) * p.speed;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
}
```

### Curl Noise

Curl noise produces a divergence-free vector field, meaning particles neither converge to points nor diverge from them. This creates swirling, smoke-like patterns without accumulation.

Compute the curl from two offset noise samples:

```js
function curlNoise(x, y, time, epsilon = 0.001) {
  const n1 = noise(x, y + epsilon, time);
  const n2 = noise(x, y - epsilon, time);
  const n3 = noise(x + epsilon, y, time);
  const n4 = noise(x - epsilon, y, time);

  const curlX = (n1 - n2) / (2 * epsilon);
  const curlY = -(n3 - n4) / (2 * epsilon);

  return { x: curlX, y: curlY };
}
```

Use the curl vector directly as velocity. No angle conversion needed.

### Visual Tuning

- **Noise scale** (0.01 to 0.1): lower values produce wider, gentler curves. Higher values produce tighter, chaotic motion.
- **Time speed**: controls how fast the field evolves. 0.0 = static. 0.5 = slowly morphing. 2.0 = rapidly shifting.
- **Particle count**: 5,000 to 50,000 for dense flow visualization.
- **Trail technique**: semi-transparent background clear (see `particle-systems.md`) is ideal for flow fields.
- **Color mapping**: map angle or speed to hue for visual variety.

## Noise Functions

### Perlin Noise

Gradient-based noise. Produces smooth, organic patterns. In p5.js, call `noise(x, y, z)`. The function returns values between 0 and 1.

Key properties:
- Continuous and smooth at all scales.
- Grid-aligned artifacts visible at integer boundaries.
- Controllable frequency by scaling input coordinates.
- Octave stacking (fractal noise) adds detail at multiple scales.

### Fractal / fBm (Fractal Brownian Motion)

Layer multiple octaves of noise at increasing frequency and decreasing amplitude.

```js
function fbm(x, y, octaves = 6, lacunarity = 2.0, gain = 0.5) {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise(x * frequency, y * frequency);
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return value / maxValue; // normalize to 0..1
}
```

- **Lacunarity** (typically 2.0): frequency multiplier per octave.
- **Gain/persistence** (typically 0.5): amplitude multiplier per octave. Higher values retain more high-frequency detail.

### Simplex Noise

Improved version of Perlin noise. Less grid-aligned artifacts. Faster in higher dimensions. Use the `simplex-noise` npm package.

```js
import { createNoise2D, createNoise3D } from "simplex-noise";
const noise2D = createNoise2D();
const value = noise2D(x * 0.01, y * 0.01); // returns -1 to 1
```

Note: simplex returns values in [-1, 1], not [0, 1] like p5's `noise()`. Remap as needed: `(value + 1) / 2`.

### Worley (Cellular) Noise

Based on distance to randomly placed feature points. Produces cell-like, organic patterns reminiscent of stone, cells, or cracked earth.

```js
function worleyNoise(px, py, points) {
  let minDist = Infinity;
  for (const pt of points) {
    const dx = px - pt.x;
    const dy = py - pt.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}
```

For efficiency, use a grid-based spatial lookup rather than checking all points.

### Value Noise

Random values at grid points, interpolated smoothly between them. Simpler than Perlin, but with more visible grid artifacts. Useful for prototyping.

## L-Systems

### Grammar

An L-system is a string rewriting system. Start with an axiom (initial string) and apply production rules iteratively.

```
Axiom: F
Rule: F -> F[+F]F[-F]F
Iterations: 4
```

After 4 iterations, the string expands exponentially. Each character is then interpreted as a drawing command.

### Turtle Graphics

Interpret the expanded string with a turtle (position + direction):

| Symbol | Action |
|--------|--------|
| F | Move forward and draw a line |
| f | Move forward without drawing |
| + | Turn right by angle |
| - | Turn left by angle |
| [ | Push state (position + angle) onto stack |
| ] | Pop state from stack |

```js
function drawLSystem(ctx, instructions, stepLength, angle) {
  const stack = [];
  let x = startX, y = startY, dir = -Math.PI / 2;

  for (const ch of instructions) {
    switch (ch) {
      case "F":
        const nx = x + Math.cos(dir) * stepLength;
        const ny = y + Math.sin(dir) * stepLength;
        ctx.lineTo(nx, ny);
        x = nx; y = ny;
        break;
      case "+": dir += angle; break;
      case "-": dir -= angle; break;
      case "[": stack.push({ x, y, dir }); break;
      case "]":
        const s = stack.pop();
        x = s.x; y = s.y; dir = s.dir;
        ctx.moveTo(x, y);
        break;
    }
  }
}
```

### Classic L-System Examples

**Koch Curve:** Axiom: `F`, Rule: `F -> F+F-F-F+F`, Angle: 90 degrees.

**Sierpinski Triangle:** Axiom: `F-G-G`, Rules: `F -> F-G+F+G-F`, `G -> GG`, Angle: 120 degrees.

**Plant (stochastic):** Axiom: `X`, Rules: `X -> F+[[X]-X]-F[-FX]+X`, `F -> FF`, Angle: 25 degrees.

### Branching Structures

L-systems with `[` and `]` produce natural branching. Vary the branch angle and step length per iteration depth for organic results. Reduce `stepLength` by a factor (e.g., 0.7) at each depth level.

Add randomness by varying the angle or skipping rules probabilistically. This produces natural, non-symmetric plant structures.

## Cellular Automata

### Conway's Game of Life

A 2D grid where each cell is alive or dead. Rules applied each step:
1. A live cell with 2 or 3 live neighbors survives.
2. A dead cell with exactly 3 live neighbors becomes alive.
3. All other cells die or stay dead.

```js
function stepGameOfLife(grid, width, height) {
  const next = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = (x + dx + width) % width;
          const ny = (y + dy + height) % height;
          neighbors += grid[ny * width + nx];
        }
      }
      const alive = grid[y * width + x];
      next[y * width + x] = (alive && (neighbors === 2 || neighbors === 3)) || (!alive && neighbors === 3) ? 1 : 0;
    }
  }
  return next;
}
```

Wrap edges toroidally (`% width`, `% height`) for seamless patterns.

### Elementary Cellular Automata (1D)

A 1D array where each cell's next state depends on its current state and its two neighbors (3 cells = 8 possible patterns = 8-bit rule number).

**Rule 110** is Turing-complete and produces complex patterns from simple seeds.

```js
function step1D(cells, rule) {
  const next = new Uint8Array(cells.length);
  for (let i = 0; i < cells.length; i++) {
    const left = cells[(i - 1 + cells.length) % cells.length];
    const center = cells[i];
    const right = cells[(i + 1) % cells.length];
    const pattern = (left << 2) | (center << 1) | right;
    next[i] = (rule >> pattern) & 1;
  }
  return next;
}
```

Render each generation as a row of pixels. Stack rows vertically for the classic "rule" visualization.

### Custom Rule Systems

Replace the neighbor count with different conditions:
- Larger neighborhoods (Moore neighborhood radius 2+).
- Multiple states (0, 1, 2, ... instead of binary).
- Continuous values (smooth Life).
- Asymmetric rules (different rules for different directions).

## Reaction-Diffusion

### Gray-Scott Model

Two chemicals (A and B) interact and diffuse across a 2D grid. A feeds into the system, B is produced from A, and both decay.

Parameters:
- `dA`: diffusion rate of A (typically 1.0).
- `dB`: diffusion rate of B (typically 0.5).
- `feed`: rate at which A is replenished (0.01 to 0.1).
- `kill`: rate at which B decays (0.04 to 0.07).

```js
function stepReactionDiffusion(a, b, nextA, nextB, width, height, dA, dB, feed, kill) {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const aVal = a[idx];
      const bVal = b[idx];
      const lapA = laplacian(a, x, y, width);
      const lapB = laplacian(b, x, y, width);
      const reaction = aVal * bVal * bVal;

      nextA[idx] = aVal + (dA * lapA - reaction + feed * (1 - aVal));
      nextB[idx] = bVal + (dB * lapB + reaction - (kill + feed) * bVal);
    }
  }
}

function laplacian(grid, x, y, w) {
  return (
    grid[(y - 1) * w + x] +
    grid[(y + 1) * w + x] +
    grid[y * w + (x - 1)] +
    grid[y * w + (x + 1)] -
    4 * grid[y * w + x]
  );
}
```

Different `feed` and `kill` combinations produce spots, stripes, spirals, and labyrinthine patterns. See the Pearson classification for a map of parameter space.

### Rendering

Map the B concentration to pixel brightness or color. Low B = dark, high B = light (or map to a color gradient).

```js
function renderRD(ctx, b, width, height) {
  const imageData = ctx.createImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const val = Math.floor((1 - b[i]) * 255);
    imageData.data[i * 4] = val;
    imageData.data[i * 4 + 1] = val;
    imageData.data[i * 4 + 2] = val;
    imageData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
}
```

Run 10 to 20 simulation steps per rendered frame for visible evolution speed.

## Voronoi

### Concept

Given a set of seed points, a Voronoi diagram partitions the plane into cells where every location in a cell is closer to its seed than to any other.

### D3 Voronoi

```js
import { Delaunay } from "d3-delaunay";

const points = Array.from({ length: 100 }, () => [Math.random() * width, Math.random() * height]);
const delaunay = Delaunay.from(points);
const voronoi = delaunay.voronoi([0, 0, width, height]);

// Draw cells
ctx.beginPath();
voronoi.render(ctx);
ctx.stroke();

// Draw cell polygons individually
for (let i = 0; i < points.length; i++) {
  const cell = voronoi.cellPolygon(i);
  if (!cell) continue;
  ctx.beginPath();
  ctx.moveTo(cell[0][0], cell[0][1]);
  for (let j = 1; j < cell.length; j++) {
    ctx.lineTo(cell[j][0], cell[j][1]);
  }
  ctx.closePath();
  ctx.fillStyle = colorForCell(i);
  ctx.fill();
}
```

### Delaunay Triangulation

The Delaunay triangulation is the dual of the Voronoi diagram. It connects seed points into triangles where no point lies inside any triangle's circumscribed circle.

```js
ctx.beginPath();
delaunay.render(ctx);
ctx.stroke();
```

### Lloyd Relaxation

Iteratively move each seed point to the centroid of its Voronoi cell. This produces a more even, organic spacing.

```js
function lloydRelax(points, width, height, iterations = 10) {
  for (let iter = 0; iter < iterations; iter++) {
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    for (let i = 0; i < points.length; i++) {
      const cell = voronoi.cellPolygon(i);
      if (!cell) continue;
      let cx = 0, cy = 0;
      for (const [x, y] of cell) { cx += x; cy += y; }
      points[i][0] = cx / cell.length;
      points[i][1] = cy / cell.length;
    }
  }
  return points;
}
```

After 10 to 20 iterations, the distribution becomes semi-regular, similar to a honeycomb.

## Seeded Randomness

### Why Seeds Matter

`Math.random()` is not reproducible. The same code produces different results each run. For generative art, reproducibility is essential: the same seed must produce the same image.

### Simple Seeded PRNG

```js
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(12345);
rng(); // always returns the same sequence for seed 12345
```

### Seed from String (Hash)

```js
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

const rng = mulberry32(hashString("my-artwork-title"));
```

### Seeded Noise

The `simplex-noise` library accepts a PRNG function as a seed source:

```js
import { createNoise2D } from "simplex-noise";
import alea from "alea";

const prng = alea("my-seed-string");
const noise2D = createNoise2D(prng);
```

`alea` is a fast, seedable PRNG. Use it as the noise source for reproducible flow fields, terrain, and generative patterns.

## Parameter Space Exploration

### Approach

Most generative systems have 3 to 10 parameters that dramatically affect output. Explore the parameter space systematically.

1. **Identify key parameters.** For a flow field: noise scale, particle count, speed, color palette, trail length.
2. **Set sensible ranges.** Noise scale: 0.001 to 0.1. Speed: 0.5 to 5.0.
3. **Generate a grid.** Create thumbnails across parameter combinations.
4. **Use DAT.GUI or Tweakpane** for live parameter adjustment during development.

```js
import { Pane } from "tweakpane";

const params = { noiseScale: 0.02, speed: 1.5, particleCount: 5000 };
const pane = new Pane();
pane.addBinding(params, "noiseScale", { min: 0.001, max: 0.1 });
pane.addBinding(params, "speed", { min: 0.1, max: 5.0 });
pane.addBinding(params, "particleCount", { min: 100, max: 50000, step: 100 });
```

### Saving States

Store parameter snapshots alongside the seed for reproducing specific outputs:

```js
const state = { seed: 42, params: { ...currentParams }, timestamp: Date.now() };
localStorage.setItem("gen-snapshot", JSON.stringify(state));
```

### Batch Rendering

For exploring large parameter spaces, render thumbnails at reduced resolution (200x200) across a grid of parameter combinations. Identify interesting regions, then render full-resolution versions of selected configurations.
