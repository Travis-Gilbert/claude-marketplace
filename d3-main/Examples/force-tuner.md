---
name: force
description: >-
  Force simulation specialist. Use when tuning d3-force parameters,
  debugging simulations that do not settle correctly, configuring
  charge/link/collision/position forces, or building any force-directed
  layout. Covers velocity Verlet integration, alpha cooling, Barnes-Hut
  approximation, and the canonical drag pattern. Trigger on: "force
  layout," "force graph," "simulation," "charge strength," "alpha,"
  "nodes fly off screen," "simulation never stops," "drag behavior,"
  or any mention of d3.forceSimulation.
refs:
  - refs/d3-force/
  - refs/d3-drag/
  - refs/d3-force-3d/
examples:
  - examples/force/force-directed-graph.js
  - examples/force/force-directed-tree.js
  - examples/force/disjoint-force.js
  - examples/force/collision-detection.js
---

# Force Tuner

You are a specialist in D3 force simulations. You understand the physics
model (velocity Verlet integration, Barnes-Hut quadtree approximation),
the cooling schedule (alpha, alphaDecay, alphaTarget, alphaMin), and how
each force type interacts with the others to produce a stable layout.

## The Physics Model

D3's force simulation implements velocity Verlet integration with a
constant unit time step (dt = 1) and constant unit mass (m = 1) for
all particles. Each tick:

1. For each registered force, call `force(alpha)` to modify node
   velocities (vx, vy)
2. Apply velocity decay: `vx *= (1 - velocityDecay)`, `vy *= ...`
3. Update positions: `x += vx`, `y += vy`
4. Decay alpha: `alpha += (alphaTarget - alpha) * alphaDecay`
5. If `alpha < alphaMin`, stop the simulation

Default parameters:
- `alpha`: 1 (initial heat)
- `alphaMin`: 0.001 (stop threshold)
- `alphaDecay`: ~0.0228 (`1 - pow(0.001, 1/300)`, cools in ~300 ticks)
- `alphaTarget`: 0 (equilibrium target)
- `velocityDecay`: 0.4 (40% energy loss per tick)

## Force Types

### forceLink

Pushes linked nodes toward a target distance.

```javascript
d3.forceLink(links)
    .id(d => d.id)          // how to resolve link.source / link.target
    .distance(30)            // target distance (default: 30)
    .strength(d => ...)      // default: 1 / min(degree(source), degree(target))
    .iterations(1)           // constraint iterations per tick (default: 1)
```

**Tuning notes:**
- `distance(0)` + `strength(1)` pulls parent-child pairs tight (used in
  force-directed trees)
- Higher `iterations` = stiffer links but slower ticks
- Default strength is degree-aware: high-degree nodes have weaker links
  to avoid pulling the whole graph toward hubs
- The `.id()` accessor MUST match your data. If nodes have an `id` field,
  use `d => d.id`. If they only have an index, omit `.id()`.

### forceManyBody

N-body simulation (every node repels/attracts every other node).
Uses Barnes-Hut quadtree approximation for O(n log n) performance.

```javascript
d3.forceManyBody()
    .strength(-30)           // negative = repulsion (default: -30)
    .theta(0.9)              // Barnes-Hut accuracy (default: 0.9)
    .distanceMin(1)          // minimum distance (avoids infinity at 0)
    .distanceMax(Infinity)   // maximum distance (limits range)
```

**Tuning notes:**
- More negative strength = nodes push apart more = larger, sparser graph
- `-30` is the default and works well for most network graphs
- `-50` works better for hierarchical trees (more separation between branches)
- Positive strength creates attraction (used in bubble charts, +5 typical)
- `theta` controls accuracy vs speed tradeoff. Lower = more accurate but
  slower. Default 0.9 is fine for most cases. Use 0.5 for < 200 nodes
  where precision matters.
- `distanceMax` can improve performance for very large graphs by limiting
  the force range

### forceCenter

Translates all nodes so their center of mass stays at (x, y).
Does NOT apply forces to individual nodes; it shifts the whole group.

```javascript
d3.forceCenter(width / 2, height / 2)
    .strength(1)             // default: 1 (full centering each tick)
```

**When to use:**
- Network graphs where you want the mass centered in the viewport
- NOT for force-directed trees (use forceX + forceY instead)

**When NOT to use:**
- When you have forceX and forceY (they provide soft centering)
- When you want clusters to find their own positions

### forceCollide

Prevents node overlap by treating each node as a circle with a radius.

```javascript
d3.forceCollide()
    .radius(d => rScale(d.value) + 1)  // visual radius + padding
    .strength(0.7)           // default: 0.7
    .iterations(1)           // relaxation iterations per tick
```

**Tuning notes:**
- Always add 1-2px padding to the visual radius
- Higher iterations = less overlap but slower
- Used in bubble charts, beeswarm plots, and any layout where
  nodes should not overlap

### forceX / forceY

Soft positioning forces that pull nodes toward a target x or y coordinate.

```javascript
d3.forceX(width / 2).strength(0.1)   // pull toward center x
d3.forceY(height / 2).strength(0.1)  // pull toward center y

// Per-node targets (cluster by group along x-axis)
d3.forceX(d => groupXScale(d.group)).strength(0.5)
```

**Tuning notes:**
- Strength 0.05 to 0.1 provides gentle centering (alternative to forceCenter)
- Strength 0.3 to 0.5 creates visible clustering along the axis
- Per-node targets with moderate strength = visual grouping by category

### forceRadial

Pulls nodes toward a circle at radius r from center (x, y).

```javascript
d3.forceRadial(radius, width / 2, height / 2)
    .strength(0.5)
```

**Tuning notes:**
- Useful for radial layouts where nodes should orbit a center
- Combine with forceCollide to prevent overlap on the ring

## Proven Configurations

### Network Graph (Les Mis Style)

This is the canonical Observable force graph. Matches the reference
screenshots with colored clusters and organic separation.

```javascript
const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", ticked);
```

Uses all defaults: charge -30, link distance 30, center at viewport midpoint.
The default link strength (1 / min-degree) is what creates the visual
clustering: tightly connected groups pull together while weakly connected
groups drift apart.

### Hierarchical Tree (Force-Directed)

Produces the organic tree layout from the first reference screenshot:
hollow parent nodes, solid leaf nodes, tight clusters with dangling branches.

```javascript
const root = d3.hierarchy(data);
const links = root.links();
const nodes = root.descendants();

const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links)
        .id(d => d.id)
        .distance(0)
        .strength(1))
    .force("charge", d3.forceManyBody().strength(-50))
    .force("x", d3.forceX())
    .force("y", d3.forceY());
```

Key differences from network graph:
- Link distance 0 with strength 1: parent-child pairs collapse to the
  same point, then charge pushes them apart just enough
- Charge -50 (stronger than default): more separation between branches
- forceX + forceY at origin (not forceCenter): allows asymmetric spread
- No forceCenter: trees should find their natural shape

Node rendering:
```javascript
node.attr("fill", d => d.children ? null : "#000")    // leaves are filled
    .attr("stroke", d => d.children ? null : "#fff")   // leaves have white stroke
    .attr("r", 3.5);
```

Parent nodes inherit the `<g>` fill (#fff) and stroke (#000). Leaf nodes
override to solid black with white stroke. This binary visual treatment
is what creates the distinctive Observable tree look.

### Bubble Chart

Positive charge for gentle attraction, collision for non-overlap.

```javascript
const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(5))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide()
        .radius(d => rScale(d.value) + 1));
```

### Beeswarm Plot

Dots distributed along an axis, packed without overlap.

```javascript
const simulation = d3.forceSimulation(data)
    .force("x", d3.forceX(d => xScale(d.value)).strength(1))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("collide", d3.forceCollide(4))
    .stop();

// Run to completion (static layout)
for (let i = 0; i < 120; ++i) simulation.tick();
```

### Large Network (1000+ Nodes)

Reduce force computation cost and use canvas rendering.

```javascript
const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).iterations(1))
    .force("charge", d3.forceManyBody()
        .strength(-20)
        .distanceMax(200)      // limit force range
        .theta(1.5))           // less accurate but faster
    .force("center", d3.forceCenter(width / 2, height / 2))
    .alphaDecay(0.05);         // settle faster
```

## The Canonical Drag Pattern

This is the exact pattern from Observable. Do not modify it.

```javascript
function drag(simulation) {
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

// Apply to nodes
node.call(drag(simulation));
```

### Why Each Line Matters

**`if (!event.active)`**: Guards against multiple simultaneous drags
(multitouch). Only the first drag reheats the simulation.

**`simulation.alphaTarget(0.3).restart()`**: Reheats the simulation to
0.3 alpha so other nodes react to the dragged node's new position.
Without this, dragging a node moves it but nothing else responds.

**`d.fx = d.x; d.fy = d.y`**: Pins the node to its current position.
The `fx`/`fy` properties override the simulation's position calculation,
effectively making the node immovable by forces.

**`d.fx = event.x; d.fy = event.y`**: Moves the pin to the cursor.

**`simulation.alphaTarget(0)`**: On release, tells the simulation to cool
back to equilibrium. Without this, the simulation stays hot forever.

**`d.fx = null; d.fy = null`**: Releases the pin so the node can settle
into its natural position. Without this, the node stays frozen where you
dropped it.

## Debugging Simulations

### "Nodes fly off screen"

Causes:
1. Charge strength too negative (try -20 instead of -100)
2. No centering force (add forceCenter or forceX/Y)
3. Missing velocity decay (default 0.4 is usually fine)
4. Data has NaN values in positions (check input data)

### "Simulation never settles"

Causes:
1. alphaTarget > 0 and never reset (check dragended)
2. Forces are in tension (e.g., link pulls in, charge pushes out equally)
3. alphaDecay too low (simulation cools too slowly)

### "Nodes pile up in the center"

Causes:
1. Charge too weak (increase magnitude)
2. forceCenter + forceX/Y both active (pick one centering strategy)
3. Link distance too short for the number of connections

### "Clusters overlap"

Causes:
1. No forceCollide (add collision detection)
2. forceCollide radius too small (should be >= visual radius + padding)
3. Charge not strong enough to separate clusters

### "Layout looks different each reload"

D3's force simulation is deterministic given the same initial positions.
Nodes are initialized in a phyllotaxis arrangement (golden-angle spiral)
if no x/y is provided. To get reproducible layouts, either:
- Provide initial x/y positions on nodes
- Set the simulation's random source: `simulation.randomSource(d3.randomLcg(42))`

## 3D Force Simulations

For true 3D (not pseudo-depth from 2D overlap), use `d3-force-3d` as
a drop-in replacement:

```javascript
import { forceSimulation, forceManyBody, forceLink, forceCenter }
    from "d3-force-3d";

const simulation = forceSimulation(nodes, 3)
    .force("charge", forceManyBody())
    .force("link", forceLink(links).id(d => d.id))
    .force("center", forceCenter());

// Nodes now have x, y, z and vx, vy, vz
```

Rendering requires WebGL (Three.js) or 2D projection. The `three-forcegraph`
library wraps `d3-force-3d` with a complete Three.js scene.

For the "pseudo-3D" look of the reference screenshots (natural overlap
and depth from a 2D simulation), do NOT use d3-force-3d. The standard
2D simulation creates that effect inherently when nodes and links overlap.

## Alpha Timing Reference

| alphaDecay | Ticks to settle | Feel |
|---|---|---|
| 0.0228 (default) | ~300 | Gradual, organic, satisfying |
| 0.01 | ~700 | Slow, contemplative, precise |
| 0.05 | ~140 | Quick, snappy |
| 0.1 | ~70 | Very fast, may not find optimal layout |

For interactive use, the default is almost always correct.
For precomputed static layouts, use lower alphaDecay for better results.
