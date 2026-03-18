---
name: standards-d3
description: D3.js visualization coding standards — v7 patterns, scale selection, data joins, SVG best practices, and anti-patterns. Auto-loads when D3 is in the tech stack.
type: context
applies_to: [d3, d3js, visualization, observable-plot, svg-charts]
file_extensions: []
---

# D3 Visualization Standards

> These standards apply to D3.js v7+ code. When writing D3 code in a JS-Pro project, verify APIs against `~/.claude/js-pro/refs/d3-main/` and check `~/.claude/js-pro/examples/D3js-code-examples-I-love/` for idiomatic patterns before writing.

## Core Principles

1. **Verify before using** — grep the D3 source to confirm an API exists
2. **Use v7 patterns** — `.join()`, `(event, d)` parameter order, ESM imports
3. **Responsive by default** — `viewBox` + `max-width: 100%` on every SVG
4. **Copy before mutating** — force simulations and hierarchy layouts mutate data

## Data Binding — The Join Pattern

Always use `.join()` for data binding. Never use the old enter/update/exit pattern.

```javascript
// CORRECT — v7 join pattern
svg.selectAll("circle")
   .data(data)
   .join("circle")
   .attr("cx", d => x(d.value))
   .attr("cy", d => y(d.category))
   .attr("r", 5);

// WRONG — v3/v4 enter/append pattern
svg.selectAll("circle")
   .data(data)
   .enter().append("circle")  // ← Never use this
   .attr("r", 5);
```

For transitions on enter/update/exit, use the callback form:

```javascript
svg.selectAll("rect")
   .data(data, d => d.id)
   .join(
     enter => enter.append("rect").attr("opacity", 0).call(enter =>
       enter.transition().attr("opacity", 1)),
     update => update.call(update =>
       update.transition().attr("width", d => x(d.value))),
     exit => exit.call(exit =>
       exit.transition().attr("opacity", 0).remove())
   );
```

## Scale Selection Guide

| Data Type | Scale | When to Use |
|-----------|-------|-------------|
| Continuous → continuous | `scaleLinear()` | Most numeric axes |
| Exponential / ratios | `scaleLog()` | Data spanning orders of magnitude |
| Compressed high values | `scaleSqrt()` or `scalePow()` | Area encoding (circle radius) |
| Categories → colors | `scaleOrdinal(schemeCategory10)` | Discrete color mapping |
| Categories → positions | `scaleBand()` | Bar charts (equal-width bands) |
| Categories → ordered | `scalePoint()` | Dot plots on categorical axis |
| Temporal | `scaleTime()` | Date/time x-axes |
| Continuous → color ramp | `scaleSequential(interpolateBlues)` | Heatmaps, choropleths |
| Bipolar → diverging color | `scaleDiverging(interpolateRdBu)` | Positive/negative data |
| Rank-based equal buckets | `scaleQuantile()` | Classification maps |

**Diverging scale pattern** (from mortality example):

```javascript
const color = d3.scaleLinear()
  .domain([-max, 0, max])
  .range([-1, 0, 1])
  .interpolate((a, b) => a < 0
    ? t => d3.interpolateBlues(1 - t)
    : t => d3.interpolateReds(t));
```

## SVG Setup Convention

Every D3 visualization should start with responsive SVG + margin convention:

```javascript
const width = 928;
const height = 600;
const margin = { top: 20, right: 30, bottom: 30, left: 40 };

const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
```

For force-directed graphs, center the viewBox:

```javascript
.attr("viewBox", [-width / 2, -height / 2, width, height])
```

## Hierarchy Layouts

**Always copy data** before passing to hierarchy layouts (they mutate):

```javascript
// Treemap
const root = d3.treemap()
    .tile(d3.treemapBinary)
    .size([width, height])
    .padding(1)
    .round(true)
    (d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value));

// Use root.leaves() to render only leaf nodes
```

```javascript
// Circle Pack
const root = d3.pack()
    .size([width, height])
    .padding(3)
    (d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value));
```

## Force Simulation

```javascript
// Always copy nodes to prevent mutating source data
const nodes = data.nodes.map(d => ({...d}));
const links = data.links.map(d => ({...d}));

const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id))  // Always specify .id()
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

simulation.on("tick", () => {
  // Update positions each tick
});
```

**Drag pattern** for force graphs:

```javascript
const drag = simulation => d3.drag()
    .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    })
    .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
    })
    .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    });

node.call(drag(simulation));
```

## Axes

```javascript
// Bottom axis with tick control
const xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80))
    .call(g => g.select(".domain").remove());  // Optional: remove axis line

// Left axis
const yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .call(g => g.select(".domain").remove());
```

## Tooltips

Use native SVG `<title>` elements for simple tooltips (zero-cost):

```javascript
node.append("title")
    .text(d => `${d.name}: ${d.value}`);
```

For rich tooltips, use a positioned `<div>` overlay.

## Color Schemes

```javascript
// Categorical (10 or 20 colors)
d3.scaleOrdinal(d3.schemeCategory10)
d3.scaleOrdinal(d3.schemeTableau10)

// Sequential (single hue)
d3.scaleSequential(d3.interpolateBlues)

// Diverging (two hues)
d3.scaleSequential(d3.interpolateRdBu)
```

## Number and Date Formatting

```javascript
d3.format(",d")       // 1,234 (comma-separated integer)
d3.format("+.1%")     // +12.3%
d3.format("$.2f")     // $1,234.56
d3.timeFormat("%B %d, %Y")  // January 15, 2026
```

## Observable Plot (Declarative Alternative)

When the task is better served by a declarative API, prefer Observable Plot:

```javascript
Plot.plot({
  marks: [
    Plot.dot(data, { x: "weight", y: "height", fill: "species" }),
    Plot.line(data, { x: "date", y: "value", stroke: "category" })
  ]
})
```

Plot handles scales, axes, and layout automatically. Use D3 when you need fine-grained SVG control; use Plot when you need quick exploratory charts.

## Theme-Aware Code

Prefer CSS variables from Observable Framework for automatic dark/light support:

```javascript
link.attr("stroke", "var(--theme-foreground-faint)");
node.attr("stroke", "var(--theme-background)");
node.attr("fill", d => color(d.group));
```

For standalone HTML, inline the `:root` CSS variable definitions.

## Performance

| Node Count | Renderer |
|---|---|
| < 500 | SVG |
| 500-10,000 | Canvas |
| > 10,000 | Canvas + WebGL |

## Anti-Patterns

| Don't | Do Instead | Why |
|-------|-----------|-----|
| `.enter().append()` | `.join()` | v7 standard; handles enter+update+exit |
| `function(d)` in event handlers | `(event, d) =>` | v7 changed parameter order |
| Mutate source data in force/hierarchy | Copy with `map(d => ({...d}))` | Prevents side effects |
| Omit `.id()` on `forceLink` | `.id(d => d.id)` | Explicit node-link binding |
| Hard-code `width`/`height` in CSS | Use `viewBox` + `max-width: 100%` | Responsive sizing |
| `d3.select("#chart")` in components | `d3.create("svg")` or `useRef` | Avoids global selector conflicts |
| Import all of D3 | Import specific modules | `import { scaleLinear } from "d3-scale"` |
| Skip `key` function in `.data()` | `.data(data, d => d.id)` | Enables stable transitions |

## D3 Sub-Package Reference

| Package | What It Does | Verify Path |
|---------|-------------|-------------|
| `d3-selection` | DOM manipulation, `.join()` | `refs/d3-main/` |
| `d3-scale` | All scale types | `refs/d3-main/` |
| `d3-scale-chromatic` | Color schemes | `refs/d3-main/` |
| `d3-axis` | Axis rendering | `refs/d3-main/` |
| `d3-shape` | Line, area, arc, pie generators | `refs/d3-main/` |
| `d3-hierarchy` | Treemap, pack, cluster, tree | `refs/d3-main/` |
| `d3-force` | Force simulation | `refs/d3-main/` |
| `d3-transition` | Animated transitions | `refs/d3-main/` |
| `d3-zoom` | Pan and zoom | `refs/d3-main/` |
| `d3-drag` | Drag interactions | `refs/d3-main/` |
| `d3-array` | extent, sum, group, bin | `refs/d3-main/` |
| `d3-geo` | Map projections | `refs/d3-main/` |
| `d3-annotation` | Chart annotations | `refs/d3-annotation-master/` |
| `d3-sankey` | Sankey diagrams | `refs/d3-sankey-master/` |
| `observable-plot` | Declarative charting | `refs/plot-main/` |
