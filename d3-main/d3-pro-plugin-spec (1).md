# D3-Pro: Claude Code D3 Visualization Plugin

> A standalone Claude Code plugin that makes Claude Code extraordinarily good at building D3 visualizations that are mathematically accurate, physically believable, and aesthetically grounded in the Mike Bostock / Observable canon.

**What this is**: A skill directory for Claude Code containing agent definitions, D3 module source code, curated Observable examples, clustering/hierarchy algorithm references, and aesthetic guidelines. When Claude Code works inside this directory (or a project that references it), it produces D3 visualizations that look and feel like they belong on Observable, with correct math underneath.

**What this is NOT**: A library, an npm package, or a wrapper around D3. Nothing here executes in production. It is all context and guidance for Claude Code.

---

## The Problem

Claude Code can write D3 code. But "can write D3 code" has serious gaps:

1. **Aesthetic flatness.** Claude Code produces D3 that works but looks like a tutorial exercise. The gap between functional D3 and the Observable canon (clean force physics, organic clustering, confident color, readable label placement) is enormous. Most of that gap is taste, and taste can be encoded.

2. **Force tuning is voodoo.** Getting a force simulation to settle into a layout that feels right requires specific knowledge of charge strength, link distance, alpha decay, velocity decay, and how they interact. Claude Code guesses these values. This plugin encodes the working configurations from proven Observable examples.

3. **Math under the hood.** Visualizing clusters, hierarchies, and networks requires understanding the algorithms that produce the data: k-means centroids, DBSCAN density cores, hierarchical linkage methods, graph community detection. Without that understanding, the visualization may render correctly but misrepresent the data.

4. **Interaction as physics.** The drag/settle/release cycle in a force simulation is what makes it feel alive. Claude Code often gets drag behavior partially right but misses the alpha target management that creates smooth re-settling. The Observable pattern (alphaTarget 0.3 on start, 0 on end, fx/fy pinning during drag, null release) is specific and must be followed exactly.

5. **D3 API surface is vast.** D3 v7 has 30+ modules. Knowing which force to compose with which layout, when to use `d3.hierarchy` vs. flat node/link arrays, how `d3.pack` differs from `d3.treemap` in its sizing model: this requires deep familiarity that training data alone does not reliably provide.

---

## Directory Structure

```
D3-Pro/
├── CLAUDE.md                          # Plugin root config
├── AGENTS.md                          # Agent registry and routing
│
├── agents/                            # Agent role definitions (slash commands)
│   ├── d3-architect.md                # Core D3 expertise, layout selection, API mastery
│   ├── force-tuner.md                 # Force simulation specialist
│   ├── hierarchy-builder.md           # Hierarchical layout specialist
│   ├── cluster-math.md                # Statistical clustering + visualization
│   ├── interaction-engineer.md        # Drag, zoom, pan, brush, hover
│   ├── label-placer.md                # Text placement, occlusion, annotation
│   └── style-director.md             # Visual presets, color, stroke, aesthetic
│
├── refs/                              # D3 module source code
│   ├── d3-force/                      # Force simulation (velocity Verlet)
│   ├── d3-hierarchy/                  # Hierarchical layouts
│   ├── d3-scale/                      # Scale functions
│   ├── d3-scale-chromatic/            # Color schemes
│   ├── d3-selection/                  # DOM manipulation
│   ├── d3-shape/                      # Shapes, links, arcs, curves
│   ├── d3-transition/                 # Animated transitions
│   ├── d3-zoom/                       # Zoom + pan
│   ├── d3-drag/                       # Drag behavior
│   ├── d3-brush/                      # Rectangular selection
│   ├── d3-delaunay/                   # Voronoi and Delaunay
│   ├── d3-geo/                        # Geographic projections
│   ├── d3-contour/                    # Contour and density
│   ├── d3-quadtree/                   # Spatial indexing
│   ├── d3-array/                      # Data utilities
│   ├── d3-interpolate/                # Value interpolation
│   ├── d3-color/                      # Color manipulation
│   ├── d3-annotation/                 # Callouts and labels
│   ├── d3-sankey/                     # Sankey diagrams
│   ├── d3-chord/                      # Chord diagrams
│   ├── d3-force-3d/                   # 3D force simulation (drop-in)
│   └── rough-master/                  # rough.js (for sketch preset)
│
├── examples/                          # Curated Observable examples
│   ├── force/
│   │   ├── force-directed-graph.js    # Les Mis co-occurrence (the canonical example)
│   │   ├── force-directed-tree.js     # Hierarchy via force layout
│   │   ├── disjoint-force.js          # Disconnected components
│   │   └── collision-detection.js     # Circle packing via forceCollide
│   ├── hierarchy/
│   │   ├── treemap.js                 # Nested rectangles
│   │   ├── circle-packing.js          # Nested circles
│   │   ├── tree-of-life.js            # Radial dendrogram
│   │   ├── tidy-tree.js              # Reingold-Tilford
│   │   ├── cluster-dendrogram.js      # Bottom-aligned leaves
│   │   └── sunburst.js               # Radial partition
│   ├── statistical/
│   │   ├── scatterplot-matrix.js      # Multi-axis scatter grid
│   │   ├── voronoi-stippling.js       # Density as dots
│   │   ├── contour-density.js         # 2D KDE contours
│   │   ├── hexbin.js                  # Hexagonal binning
│   │   └── beeswarm.js               # Force-positioned dots on axis
│   ├── network/
│   │   ├── sankey.js                  # Flow diagram
│   │   ├── chord.js                   # Relationship matrix
│   │   ├── arc-diagram.js            # Nodes on line, arcs for links
│   │   └── adjacency-matrix.js       # Grid encoding
│   ├── geo/
│   │   ├── choropleth.js             # Filled regions
│   │   ├── bubble-map.js             # Sized circles on geography
│   │   └── star-map.js               # Stereographic projection
│   ├── labels/
│   │   ├── centerline-labels.js       # Text along polygon medial axis
│   │   └── occlusion.js             # Label collision avoidance
│   └── canvas/
│       ├── raster-vector.js          # Canvas + SVG hybrid
│       └── vector-tiles.js           # Tiled canvas rendering
│
├── math/                              # Algorithm reference docs
│   ├── clustering.md                  # k-means, DBSCAN, HDBSCAN, agglom.
│   ├── hierarchical-linkage.md        # Ward, complete, average, single
│   ├── dimensionality-reduction.md    # t-SNE, UMAP, PCA
│   ├── graph-algorithms.md            # Community detection, centrality
│   ├── force-physics.md               # Verlet integration, Barnes-Hut
│   └── spatial-indexing.md           # Quadtree, octree, R-tree
│
├── presets/                           # Visual style presets
│   ├── observable.md                  # Default baseline (from screenshots)
│   ├── sketch.md                      # rough.js hand-drawn
│   ├── editorial.md                   # NYT / Pudding style
│   ├── dark.md                        # Dark background variant
│   └── minimal.md                    # Maximum data-ink ratio
│
├── data/                              # Test datasets
│   ├── flare-2.json                   # Hierarchical (D3 modules, ~100 nodes)
│   ├── miserables.json               # Co-occurrence network (77 nodes)
│   ├── sfhh.json                      # Temporal network
│   ├── mobile-patent-suits.json      # Directed graph
│   └── us-counties.json              # GeoJSON for maps
│
└── templates/                         # Starter scaffolds
    ├── force-graph/                   # Force layout with drag + zoom
    ├── hierarchy-explorer/            # Switchable hierarchy layouts
    ├── cluster-scatter/               # Scatter + cluster overlay
    ├── react-d3/                      # React + D3 integration pattern
    └── canvas-force/                  # Canvas rendering for large graphs
```

---

## CLAUDE.md (Plugin Root Config)

```markdown
# D3-Pro Plugin

You have access to D3 module source code, curated Observable visualization
examples, mathematical algorithm references, and aesthetic presets. Use them.

## When You Start a D3 Task

1. Determine the visualization type. Read the appropriate example in examples/.
2. Check refs/ for the D3 modules you will use. Grep the source to verify
   API signatures rather than relying on memory.
3. If the visualization involves clustering, hierarchy, or network algorithms,
   read the relevant file in math/ to understand the data model.
4. Apply the active style preset (default: Observable baseline). Read the
   preset file in presets/ before writing any rendering code.
5. Always include drag, zoom, or both unless the user explicitly says static.

## Source References

D3 module source is in refs/. Use it to verify API details:
- Force simulation: refs/d3-force/
- Hierarchical layouts: refs/d3-hierarchy/
- Scales and color: refs/d3-scale/, refs/d3-scale-chromatic/
- Interaction: refs/d3-drag/, refs/d3-zoom/, refs/d3-brush/

## Example Library

Observable examples are in examples/. These are the gold standard.
Always read the relevant example before writing a new visualization of
the same type. Match the force tuning, interaction patterns, and
rendering approach unless the user requests something different.

## Math References

Algorithm documentation is in math/. Read before visualizing any
statistical or algorithmic structure. The visualization must accurately
represent the math, not just approximate it visually.

## Style Presets

Presets are in presets/. The default is "observable" (clean, white
background, small solid circles, thin gray links, schemeCategory10).
Other presets are activated via slash command: /style sketch, /style dark.

## Anti-Patterns (Never Do These)

- Never use default force parameters without tuning for the data shape
- Never omit drag behavior on force simulations
- Never use CSS transitions where D3 transitions belong
- Never inline all styles when classes or data-driven attrs are cleaner
- Never render text labels at every node in dense graphs
- Never use d3.forceLink().id(d => d.id) without verifying your data
  has an `id` field (use d => d.index if it does not)
- Never set forceCollide radius equal to visual radius (add padding)
- Never skip the viewBox attribute on SVG elements
```

---

## Agent System

### Agent Routing

Agents are Claude Code slash commands. Each one loads a specialized context
that shapes how Claude Code approaches the task. Multiple agents can compose
for a single task.

### Slash Commands

| Command | Agent | What It Does |
|---|---|---|
| `/d3` | d3-architect | General D3 expertise. Layout selection, API guidance, module composition. |
| `/force` | force-tuner | Force simulation tuning. Charge, link, collision, alpha, drag, settle. |
| `/hierarchy` | hierarchy-builder | Tree, treemap, pack, partition, cluster, sunburst. Stratify from tabular. |
| `/cluster` | cluster-math | Statistical clustering + D3 visualization. k-means, DBSCAN, linkage. |
| `/interact` | interaction-engineer | Drag, zoom, pan, brush, tooltip, hover highlight. |
| `/labels` | label-placer | Text placement, collision avoidance, annotation, centerline. |
| `/style [preset]` | style-director | Apply or switch visual presets. Default: observable. |

### Composability

A request like "Build a force-directed graph of hierarchical cluster results
with drag interaction and labeled centroids" touches:

1. `cluster-math.md` for the clustering algorithm
2. `force-tuner.md` for the simulation configuration
3. `interaction-engineer.md` for drag behavior
4. `label-placer.md` for centroid labels
5. `presets/observable.md` for visual style
6. `examples/force/force-directed-graph.js` for the canonical pattern
7. `refs/d3-force/` for API verification

The CLAUDE.md config tells Claude Code to pull from all relevant sources.

---

## Aesthetic Baseline: The Observable Style

This is the default visual language. It is derived from the canonical
Observable examples by Mike Bostock and matches the reference screenshots.

### Core Visual Properties

**Background**: White (#ffffff) or transparent. Never gray. Never gradient.

**Nodes (circles)**:

| Property | Branch / Parent Nodes | Leaf Nodes |
|---|---|---|
| fill | `#fff` (white, transparent to structure) | `#000` (black, solid) |
| stroke | `#000` | `#fff` |
| stroke-width | 1.5 | 1.5 |
| r | 3.5 (hierarchy) or 5 (network) | 3.5 (hierarchy) or 5 (network) |

When color-coding by group (e.g., community or cluster):

| Property | Value |
|---|---|
| fill | `d3.schemeCategory10` (or schemeTableau10) indexed by group |
| stroke | `#fff` |
| stroke-width | 1.5 |
| r | 5 |

**Links (lines)**:

| Property | Value |
|---|---|
| stroke | `#999` |
| stroke-opacity | 0.6 |
| stroke-width | `Math.sqrt(d.value)` for weighted, or 1 for unweighted |
| fill | none |

**Labels**: Not shown by default on force layouts. Appear via `<title>` on
hover (native browser tooltip). For static layouts (treemaps, trees),
labels use `font: 10px sans-serif` in `#333`.

**SVG Container**:

```javascript
const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])   // or centered: [-w/2, -h/2, w, h]
    .attr("style", "max-width: 100%; height: auto;");
```

Always set `viewBox`. Always set `max-width: 100%` for responsive scaling.

### Force Simulation Defaults

These are the proven configurations from the Observable examples. Start
here and adjust based on node count and data density.

**Network graph (Les Mis style)**:

```javascript
const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));
```

Key: `forceManyBody()` uses default strength of -30. `forceLink()` uses
default distance of 30 and strength based on degree. `forceCenter` anchors
to viewport center. This produces the organic clustering visible in the
Les Mis example.

**Hierarchical tree (force-directed)**:

```javascript
const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links)
        .id(d => d.id)
        .distance(0)
        .strength(1))
    .force("charge", d3.forceManyBody().strength(-50))
    .force("x", d3.forceX())
    .force("y", d3.forceY());
```

Key: Link distance 0 with strength 1 pulls parent-child pairs tight.
Charge of -50 pushes clusters apart. forceX and forceY (no center force)
allow the tree to spread organically while staying centered.

**Collision / bubble chart**:

```javascript
const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(5))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => rScale(d.value) + 1));
```

Key: Positive charge (slight attraction). Collision radius equals visual
radius plus 1px padding.

### Drag Behavior (Canonical Pattern)

This is the exact pattern from Observable. Do not deviate.

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
```

Why this works:
- `alphaTarget(0.3)` on start reheats the simulation so other nodes react
- `fx`/`fy` pins the dragged node to the cursor position
- `alphaTarget(0)` on end lets the simulation cool back to equilibrium
- `fx = null` on end releases the pin so the node can settle naturally
- `!event.active` guards against multiple simultaneous drag events

### Zoom Behavior

```javascript
const zoom = d3.zoom()
    .scaleExtent([0.5, 8])
    .on("zoom", (event) => {
        g.attr("transform", event.transform);
    });

svg.call(zoom);
```

Wrap all rendered content in a `<g>` element (`g`) and apply the transform
to that group. The SVG itself stays fixed; the inner group moves.

When combining drag and zoom on the same SVG, attach zoom to the SVG
and drag to the individual nodes. D3 handles event propagation correctly
if you do not call `event.stopPropagation()` in drag handlers.

---

## Force Physics Reference

### Velocity Verlet Integration

D3's force simulation uses velocity Verlet, a symplectic integrator that
conserves energy better than Euler integration. Each tick:

1. Apply forces to compute acceleration for each node
2. Update velocity: `vx += ax`, `vy += ay`
3. Apply velocity decay: `vx *= (1 - velocityDecay)`, same for vy
4. Update position: `x += vx`, `y += vy`

Default velocity decay is 0.4 (40% energy loss per tick). Higher values
make the simulation settle faster but feel more damped. Lower values
create longer, more fluid motion.

### Alpha and Cooling

Alpha starts at 1 and decays toward alphaTarget (default 0) via:
`alpha += (alphaTarget - alpha) * alphaDecay`

Default alphaDecay is ~0.0228 (derived from `1 - Math.pow(0.001, 1/300)`,
meaning alpha drops below alphaMin in ~300 ticks).

When alpha drops below alphaMin (default 0.001), the simulation stops.

**Tuning implications**:
- Lower alphaDecay = slower cooling = more time to find good layout
- Higher alphaTarget (temporarily) = reheating for user interaction
- alphaMin controls when "settled" means "done"

### Barnes-Hut Approximation

`forceManyBody` uses a quadtree to compute n-body interactions in
O(n log n) rather than O(n^2). The `theta` parameter (default 0.9)
controls the accuracy/speed tradeoff. Lower theta = more accurate
(treats more distant node groups as individual nodes). For most
visualizations, the default is fine. For very precise layouts with
< 200 nodes, theta 0.5 gives better results.

### Force Composition Patterns

| Goal | Forces | Key Parameters |
|---|---|---|
| Network graph | link + manyBody + center | manyBody strength -30 (default) |
| Hierarchical tree | link + manyBody + x + y | link distance 0, strength 1, charge -50 |
| Bubble chart | manyBody + center + collide | charge +5, collide radius = visual + pad |
| Beeswarm | x + collide | x targets axis position, collide = radius |
| Cluster layout | link + manyBody + radial/x/y | custom per cluster type |
| Large graph (1000+) | link + manyBody | reduce iterations, use canvas |

### Node Count and Performance

| Nodes | Renderer | Strategy |
|---|---|---|
| < 500 | SVG | Standard approach, all features available |
| 500 to 2000 | SVG or Canvas | Canvas for links, SVG for interactive nodes |
| 2000 to 10000 | Canvas | Full canvas rendering, quadtree hit testing |
| > 10000 | Canvas + WebGL | Consider three-forcegraph or custom shaders |

---

## Hierarchical Layout Reference

### Layout Selection Guide

| Layout | Best For | D3 Method | Sizing Model |
|---|---|---|---|
| Tidy tree | Small trees, readability | `d3.tree()` | Even node spacing |
| Cluster | Dendrograms, aligned leaves | `d3.cluster()` | Leaves at same depth |
| Treemap | Part-to-whole, area encoding | `d3.treemap()` | Area = value |
| Circle packing | Nested groups, approximate size | `d3.pack()` | Area = value |
| Partition / icicle | Depth + size | `d3.partition()` | Width = value |
| Sunburst | Radial partition | `d3.partition()` + polar | Angle = value |
| Force tree | Organic, interactive exploration | `d3.hierarchy()` + force | Physics-driven |

### Data Preparation Pattern

All hierarchical layouts require `d3.hierarchy()` first:

```javascript
const root = d3.hierarchy(data)
    .sum(d => d.value)             // required for treemap, pack, partition
    .sort((a, b) => b.value - a.value);  // largest first

// Then apply layout
d3.treemap()
    .size([width, height])
    .padding(1)
    (root);

// Nodes now have x0, y0, x1, y1 (for treemap)
// or x, y (for tree, cluster)
// or x, y, r (for pack)
```

### Stratify (Tabular to Hierarchy)

When data is flat (CSV with id + parentId columns):

```javascript
const root = d3.stratify()
    .id(d => d.id)
    .parentId(d => d.parentId)
    (flatData);
```

This produces a `d3.hierarchy` node identical to what `d3.hierarchy()`
returns from nested JSON. All layouts work identically after this step.

---

## Clustering Math Reference

### Algorithm Overview

| Algorithm | Type | Parameters | When to Use |
|---|---|---|---|
| K-Means | Centroid | k (cluster count) | Known k, convex clusters |
| DBSCAN | Density | eps (radius), minPts | Unknown k, arbitrary shapes, noise |
| HDBSCAN | Density | min_cluster_size | Variable density, robust |
| Agglomerative | Hierarchical | linkage method, cut height | Dendrogram needed, any shape |
| Spectral | Graph | k, affinity | Non-convex, graph structure |
| Gaussian Mixture | Model | k, covariance type | Overlapping, probabilistic |

### Visualizing Cluster Results

**K-Means**: Show centroids as larger markers. Draw Voronoi cells around
centroids to show decision boundaries. Color points by cluster assignment.

```javascript
// Voronoi decision boundaries for k-means centroids
const delaunay = d3.Delaunay.from(centroids, d => xScale(d[0]), d => yScale(d[1]));
const voronoi = delaunay.voronoi([0, 0, width, height]);

svg.append("g")
    .selectAll("path")
    .data(centroids)
    .join("path")
    .attr("d", (d, i) => voronoi.renderCell(i))
    .attr("fill", "none")
    .attr("stroke", "#ccc")
    .attr("stroke-dasharray", "4,2");
```

**DBSCAN**: Color core points, border points, and noise differently.
Core points get full opacity. Border points get reduced opacity.
Noise points get gray fill. Draw convex hulls around cluster cores.

**Hierarchical / Agglomerative**: Render as a dendrogram using
`d3.cluster()`. The y-axis represents linkage distance (merge height).
A horizontal cut line at a given height shows the resulting clusters.

**Silhouette analysis**: Bar chart of silhouette coefficients per point,
grouped by cluster. Average silhouette score shown as a vertical line.

### Linkage Methods (for Hierarchical Clustering)

| Method | Distance Between Clusters | Visual Character |
|---|---|---|
| Single | Minimum pairwise distance | Long, chaining dendrograms |
| Complete | Maximum pairwise distance | Compact, spherical clusters |
| Average (UPGMA) | Mean pairwise distance | Balanced, moderate |
| Ward | Minimum variance increase | Most even cluster sizes |

Ward linkage produces dendrograms that visually match what most people
expect from hierarchical clustering. Use it as the default unless the
user specifies otherwise.

---

## Interaction Patterns

### Drag (Force Simulations)

See the canonical pattern in the Aesthetic Baseline section above.
Never modify it without reason. It handles:
- Multi-touch (via `!event.active` guard)
- Simulation reheating on grab
- Smooth release and re-settling

### Zoom + Pan

Always use `d3.zoom()` for camera control. Never implement manual
pan via mousedown/mousemove.

```javascript
// Standard zoom setup
const g = svg.append("g");  // all content goes here
svg.call(d3.zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", ({transform}) => g.attr("transform", transform)));
```

### Tooltip (Hover)

For simple cases, `<title>` elements provide native browser tooltips
with zero overhead. For rich tooltips:

```javascript
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("opacity", 0);

node.on("mouseover", (event, d) => {
    tooltip.transition().duration(200).style("opacity", 0.9);
    tooltip.html(d.data.name)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
})
.on("mouseout", () => {
    tooltip.transition().duration(500).style("opacity", 0);
});
```

### Brush (Selection)

```javascript
const brush = d3.brush()
    .extent([[0, 0], [width, height]])
    .on("brush end", ({selection}) => {
        if (!selection) return;
        const [[x0, y0], [x1, y1]] = selection;
        node.classed("selected", d =>
            x0 <= xScale(d.x) && xScale(d.x) <= x1 &&
            y0 <= yScale(d.y) && yScale(d.y) <= y1
        );
    });
```

### Linked Highlighting

When a visualization has both nodes and links, hovering a node should
highlight its connected links and neighbors:

```javascript
node.on("mouseover", (event, d) => {
    link.style("stroke-opacity", l =>
        (l.source === d || l.target === d) ? 1 : 0.1);
    node.style("opacity", n =>
        (n === d || links.some(l =>
            (l.source === d && l.target === n) ||
            (l.target === d && l.source === n)
        )) ? 1 : 0.2);
});

node.on("mouseout", () => {
    link.style("stroke-opacity", 0.6);
    node.style("opacity", 1);
});
```

---

## Label Placement

### When to Show Labels

| Visualization | Default | On Hover | On Click |
|---|---|---|---|
| Force graph (dense) | No | Yes (tooltip) | Yes (pin label) |
| Force graph (sparse, < 30 nodes) | Yes (offset) | Bold/enlarge | n/a |
| Tree / dendrogram | Yes (leaf labels) | Highlight path | n/a |
| Treemap | Yes (cell labels with clip) | Full text | n/a |
| Scatter + clusters | Centroid labels only | Point label | n/a |

### Occlusion Avoidance

For graphs with visible labels, use a force-based or greedy label
placement algorithm to prevent overlap:

```javascript
// Simple force-based label offset
const labelForce = d3.forceSimulation(labelNodes)
    .force("collide", d3.forceCollide(12))
    .force("anchor", d3.forceLink(anchorLinks).distance(8))
    .stop();

for (let i = 0; i < 120; ++i) labelForce.tick();
```

### Annotation (d3-annotation)

For callout-style labels on specific nodes:

```javascript
import { annotation, annotationCallout } from "d3-svg-annotation";

const makeAnnotations = annotation()
    .type(annotationCallout)
    .annotations([{
        note: { label: "Key node", title: "Hub" },
        x: xScale(d.x),
        y: yScale(d.y),
        dx: 40,
        dy: -30
    }]);

svg.append("g").call(makeAnnotations);
```

---

## Style Presets

### /style observable (default)

The baseline described in the Aesthetic Baseline section.
White background, small solid circles, thin gray links,
`schemeCategory10` for group coloring, no visible labels on
dense graphs.

### /style sketch

Applies rough.js post-processing. Nodes become hand-drawn circles,
links become wobbly lines. Uses the `sketch-render` spec's
`notebook` preset: roughness 1.2, bowing 1.5, cross-hatch fill,
seed 42 for determinism.

```javascript
import { sketchify } from "sketch-render";
// After D3 renders the SVG:
sketchify(svg.node(), "notebook");
```

### /style editorial

Inspired by NYT Graphics and The Pudding. Differences from observable:
- `font-family: 'Franklin Gothic', sans-serif` (or Georgia for serif)
- Annotation-heavy: labeled axes, callout text, source attribution
- Muted color palette: grays with one or two accent colors
- Thicker axis lines, no gridlines
- Data labels directly on marks (no legend)

### /style dark

Observable baseline inverted for dark backgrounds:
- Background: `#1a1a2e` (not pure black)
- Node fill: use `d3.schemeSet2` (higher luminance than Category10)
- Node stroke: `rgba(255, 255, 255, 0.3)`
- Link stroke: `rgba(255, 255, 255, 0.15)`
- Text: `#e0e0e0`
- Axis and grid: `rgba(255, 255, 255, 0.1)`

### /style minimal

Maximum data-ink ratio. Tufte-inspired:
- No axis lines (only ticks)
- No borders, no backgrounds
- Labels placed directly on data
- Color used only when encoding data (never decoration)
- Grid lines at 0.05 opacity if present at all

---

## React + D3 Integration

When the target is a React application (Next.js, Vite, etc.), D3 must
integrate without fighting React's DOM ownership.

### The Pattern: React Owns the Container, D3 Owns the Contents

```jsx
import { useRef, useEffect } from "react";
import * as d3 from "d3";

function ForceGraph({ data, width = 928, height = 600 }) {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!data) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();  // clear previous render

        // Standard D3 rendering code goes here
        // Use svg as the root selection
        // All DOM manipulation happens inside this useEffect

        return () => {
            // Cleanup: stop simulation, remove listeners
            simulation.stop();
        };
    }, [data, width, height]);

    return <svg ref={svgRef} width={width} height={height} />;
}
```

### Rules

1. Never mix React JSX rendering and D3 selection rendering in the same
   subtree. Pick one owner per subtree.
2. D3 code lives inside `useEffect`. The dependency array controls when
   it re-runs.
3. Always clean up simulations and event listeners in the useEffect
   return function.
4. For React-driven animations (not D3 transitions), use `useMemo` to
   run the layout computation and React to render the positioned elements.

---

## Canvas Rendering (Large Graphs)

For graphs with over 500 nodes, canvas rendering avoids the DOM overhead
of thousands of SVG elements.

```javascript
const canvas = d3.select("#chart").append("canvas")
    .attr("width", width)
    .attr("height", height);
const context = canvas.node().getContext("2d");

simulation.on("tick", () => {
    context.clearRect(0, 0, width, height);

    // Draw links
    context.beginPath();
    context.strokeStyle = "rgba(153, 153, 153, 0.6)";
    context.lineWidth = 0.5;
    for (const link of links) {
        context.moveTo(link.source.x, link.source.y);
        context.lineTo(link.target.x, link.target.y);
    }
    context.stroke();

    // Draw nodes
    for (const node of nodes) {
        context.beginPath();
        context.arc(node.x, node.y, 5, 0, 2 * Math.PI);
        context.fillStyle = color(node.group);
        context.fill();
        context.strokeStyle = "#fff";
        context.lineWidth = 1.5;
        context.stroke();
    }
});
```

### Hit Testing on Canvas

Canvas elements are not individually interactive. Use quadtree or
`simulation.find()` for mouse interaction:

```javascript
canvas.on("mousemove", (event) => {
    const [x, y] = d3.pointer(event);
    const node = simulation.find(x, y, 20);  // 20px search radius
    // highlight node if found
});
```

---

## Quality Gates

Before considering any D3 visualization complete, verify:

**Rendering**
- [ ] SVG has a `viewBox` attribute
- [ ] SVG has `max-width: 100%; height: auto` for responsiveness
- [ ] Colors come from a D3 scheme (not hardcoded hex)
- [ ] Stroke widths are proportional to the visualization scale
- [ ] No elements render outside the viewBox

**Physics (force layouts)**
- [ ] Simulation settles within 5 seconds at default alpha decay
- [ ] Drag behavior uses the canonical pattern (alphaTarget 0.3/0)
- [ ] Nodes do not fly off-screen during simulation
- [ ] Disconnected components do not drift to infinity (use forceCenter or forceX/Y)

**Math (algorithmic visualizations)**
- [ ] Cluster boundaries match the actual algorithm output
- [ ] Hierarchy depth matches data depth
- [ ] Treemap/pack area is proportional to the summed value
- [ ] Dendrogram y-axis reflects actual linkage distance

**Interaction**
- [ ] Drag works (if force simulation present)
- [ ] Hover provides information (tooltip or highlight)
- [ ] Zoom/pan works for dense graphs
- [ ] No event listener leaks (cleanup in React useEffect)

**Labels**
- [ ] Dense graphs: labels on hover only
- [ ] Sparse graphs or trees: labels visible, no overlaps
- [ ] Font size readable at default zoom

---

## D3 Module Quick Reference

| Module | Import | Purpose | Key Methods |
|---|---|---|---|
| d3-force | `d3.forceSimulation` | Physics layout | forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY, forceRadial |
| d3-hierarchy | `d3.hierarchy` | Tree data | tree, cluster, treemap, pack, partition, stratify |
| d3-scale | `d3.scaleLinear` | Data mapping | scaleLinear, scaleLog, scaleSqrt, scaleOrdinal, scaleBand, scalePoint |
| d3-scale-chromatic | `d3.schemeCategory10` | Color | schemeCategory10, schemeTableau10, schemeSet2, interpolateViridis |
| d3-selection | `d3.select` | DOM | select, selectAll, join, data, enter, exit, attr, style, text |
| d3-shape | `d3.line` | Geometry | line, area, arc, pie, stack, linkHorizontal, linkVertical |
| d3-transition | `selection.transition` | Animation | duration, delay, ease, attrTween |
| d3-zoom | `d3.zoom` | Camera | scaleExtent, translateExtent, on("zoom") |
| d3-drag | `d3.drag` | Interaction | on("start"), on("drag"), on("end") |
| d3-brush | `d3.brush` | Selection | extent, on("brush"), on("end") |
| d3-delaunay | `d3.Delaunay` | Voronoi | from, voronoi, find, renderCell |
| d3-geo | `d3.geoPath` | Maps | geoMercator, geoAlbersUsa, geoPath, geoGraticule |
| d3-contour | `d3.contourDensity` | KDE | bandwidth, thresholds, size |
| d3-quadtree | `d3.quadtree` | Spatial | add, find, visit |
| d3-array | `d3.extent` | Utilities | extent, min, max, group, rollup, bin, range |
| d3-interpolate | `d3.interpolate` | Tweening | interpolateRgb, interpolateNumber, piecewise |
| d3-sankey | `d3.sankey` | Flow | nodeWidth, nodePadding, links, nodes |
| d3-chord | `d3.chord` | Relations | padAngle, sortSubgroups, ribbon |
| d3-annotation | `annotation()` | Callouts | annotationCallout, annotationLabel |
| d3-force-3d | `d3.forceSimulation` | 3D physics | Drop-in replacement, adds z axis. numDimensions(3) |

---

## 3D Force Graphs

When the user requests true 3D (not just the pseudo-depth of 2D force
overlap), use `d3-force-3d` as a drop-in replacement:

```javascript
import { forceSimulation, forceManyBody, forceLink, forceCenter }
    from "d3-force-3d";

const simulation = forceSimulation(nodes, 3)  // 3 dimensions
    .force("charge", forceManyBody())
    .force("link", forceLink(links).id(d => d.id))
    .force("center", forceCenter());
```

Nodes gain `z` and `vz` properties. Rendering requires WebGL (via
Three.js) or a 2D projection. For Three.js integration, use
`three-forcegraph` which wraps `d3-force-3d` with a full scene graph.

For the "pseudo-3D" feel of the reference screenshots (2D simulation
with natural overlap and depth), do not use d3-force-3d. The standard
2D simulation achieves this look inherently.

---

## Test Data Library

| File | Type | Nodes | Use Case |
|---|---|---|---|
| `flare-2.json` | Hierarchical tree | ~100 leaves, 9 groups | Treemap, pack, tree, force tree |
| `miserables.json` | Co-occurrence network | 77 nodes, 254 links | Force graph (the canonical demo) |
| `sfhh.json` | Temporal network | Nodes + timestamped edges | Animated network evolution |
| `mobile-patent-suits.json` | Directed graph | Companies + lawsuits | Arc diagram, directed force |
| `us-counties.json` | GeoJSON | US county boundaries | Choropleth, bubble map |

These are pre-loaded so Claude Code can prototype immediately without
the user needing to provide data.

---

## Install

```bash
#!/bin/bash
# install.sh
D3_PRO_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Installing D3-Pro plugin from: $D3_PRO_DIR"

# Organize agents into agents/
mkdir -p "$D3_PRO_DIR/agents"

# Create slash command symlinks
mkdir -p "$D3_PRO_DIR/.claude/commands"
for agent in "$D3_PRO_DIR/agents/"*.md; do
  name=$(basename "$agent" .md)
  ln -sf "$agent" "$D3_PRO_DIR/.claude/commands/$name.md"
  echo "  Registered command: /$name"
done

echo ""
echo "D3-Pro plugin installed."
echo "  Agents: $(ls "$D3_PRO_DIR/agents/" 2>/dev/null | wc -l | tr -d ' ')"
echo "  Refs:   $(ls "$D3_PRO_DIR/refs/" 2>/dev/null | wc -l | tr -d ' ')"
echo "  Launch Claude Code from $D3_PRO_DIR to use."
```
