# Force Physics

Reference for the physics model underlying D3 force simulations.

## Velocity Verlet Integration

D3's force simulation uses velocity Verlet, a second-order symplectic
integrator that conserves energy better than Euler integration.

Each tick:
1. Apply all forces → compute acceleration (ax, ay) for each node
2. Update velocity: `vx += ax`, `vy += ay`
3. Apply velocity decay: `vx *= (1 - velocityDecay)`, `vy *= (1 - velocityDecay)`
4. Update position: `x += vx`, `y += vy`

Default velocity decay: **0.4** (40% energy loss per tick).
- Higher → faster settling, more damped feel
- Lower → longer fluid motion, more "alive"

## Alpha Cooling Schedule

Alpha controls force strength. Starts at 1, decays toward alphaTarget.

```
alpha += (alphaTarget - alpha) * alphaDecay
```

**Defaults**:
- `alpha`: 1 (initial)
- `alphaTarget`: 0 (equilibrium)
- `alphaDecay`: ~0.0228 = `1 - Math.pow(0.001, 1/300)`
- `alphaMin`: 0.001 (simulation stops when alpha < alphaMin)

This means: alpha drops below alphaMin in ~300 ticks. At 60fps,
that's ~5 seconds of visible motion.

**Tuning**:
| Want | Adjust |
|---|---|
| Faster settling | Higher alphaDecay (e.g., 0.05) |
| More exploration | Lower alphaDecay (e.g., 0.01) |
| Interactive reheat | Set alphaTarget(0.3), then alphaTarget(0) on release |
| Instant layout | `simulation.tick(300)` without rendering |

## Barnes-Hut Approximation

`forceManyBody` computes n-body interactions (every node repels/attracts
every other node). Naive approach is O(n²).

Barnes-Hut uses a quadtree to approximate distant node groups as single
bodies. The **theta** parameter controls this:

- `theta = 0`: Exact (O(n²))
- `theta = 0.9` (default): Fast approximation
- `theta = 1.5+`: Very approximate, fastest

**Recommendation**:
- < 200 nodes: theta 0.5 for better layout quality
- 200-2000 nodes: theta 0.9 (default)
- > 2000 nodes: theta 1.2+ and use canvas rendering

## Force Types

### forceLink

Pulls linked nodes together (spring force).

**Parameters**:
- `distance`: target link length (default: 30)
- `strength`: proportional to `1 / min(degree(source), degree(target))`
- `iterations`: number of constraint iterations per tick (default: 1)

Higher iterations = stiffer links. Use 2-3 for rigid structures.

### forceManyBody

N-body force (repulsion when negative, attraction when positive).

**Parameters**:
- `strength`: force magnitude (default: -30)
  - More negative → more repulsion → more spread
  - Positive → attraction → clustering
- `theta`: Barnes-Hut accuracy (default: 0.9)
- `distanceMin`: minimum distance threshold (default: 1)
- `distanceMax`: maximum distance for force (default: Infinity)

### forceCenter

Translates the center of mass to a target point. Does NOT attract
individual nodes — it shifts the entire system.

### forceX / forceY

Attracts individual nodes toward target x/y positions.

```javascript
.force("x", d3.forceX(targetX).strength(0.1))
```

Useful for: beeswarms, bipartite layouts, gravity toward center.

### forceCollide

Prevents node overlap using circle collision detection.

**Parameters**:
- `radius`: collision radius (function or constant)
- `strength`: collision response strength (default: 1)
- `iterations`: collision resolution passes (default: 1)

**Critical**: Set collision radius = visual radius + padding.
Never set equal to visual radius (nodes touch).

### forceRadial

Attracts nodes toward a circle of given radius.

```javascript
.force("radial", d3.forceRadial(200, width/2, height/2).strength(0.5))
```

## Energy and Stability

The simulation is "settled" when alpha < alphaMin. But visual stability
can be different from mathematical convergence:

- **Jittering**: Nodes oscillate because of competing forces.
  Fix: increase velocityDecay to 0.5-0.6.
- **Drifting**: The entire graph slowly moves.
  Fix: add forceCenter or forceX/forceY.
- **Splitting**: Disconnected components fly apart.
  Fix: add forceX/forceY toward center, or forceCenter.

## Pre-Computing Layout

For static visualizations, run the simulation to completion without rendering:

```javascript
const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .stop();

// Run to convergence
for (let i = 0; i < 300; ++i) simulation.tick();

// Now render with final positions
```

This is useful for server-side rendering or avoiding animation overhead.
