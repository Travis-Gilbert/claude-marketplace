---
name: standards-d3
description: >-
  D3.js visualization coding standards — v7 patterns, scale selection, data
  joins, SVG best practices, force simulation tuning, and anti-patterns.
  Auto-loads when D3 is in the tech stack or when writing D3 code.
  Trigger on: any D3 visualization code, "d3," "force graph," "treemap,"
  "hierarchy," "SVG chart," "Observable," or data visualization work.
version: 1.0.0
---

# D3.js Coding Standards

These standards apply to all D3 v7 code. Follow them when writing,
reviewing, or modifying D3 visualizations.

## Data Joins

Always use the modern `.join()` pattern. Never use the v3 enter/update/exit
pattern in new code.

```javascript
// Correct (v5+)
svg.selectAll("circle")
    .data(nodes, d => d.id)
    .join("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);

// Wrong (v3 legacy)
const circles = svg.selectAll("circle").data(nodes);
circles.enter().append("circle");
circles.exit().remove();
```

Always include a key function (`d => d.id`) when data can change order.

## SVG Setup

Every SVG must include `viewBox` and responsive sizing:

```javascript
const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");
```

## Scales

- Use `d3.scaleSqrt()` for circle radius (not linear — humans perceive area)
- Use `d3.scaleOrdinal(d3.schemeObservable10)` for categorical color
- Always set `.domain()` from data, not hardcoded
- Use `.nice()` on axes for clean tick values

## Force Simulations

- Always include drag behavior using the canonical pattern
- Always copy data before passing to simulation (`nodes.map(d => ({...d}))`)
- Set `alphaTarget(0.3)` on drag start, `alphaTarget(0)` on drag end
- Release pinned nodes: `d.fx = null; d.fy = null` on drag end
- For disconnected graphs, use `forceX`/`forceY` toward center

## Color

- Default categorical: `d3.schemeObservable10`
- Dark backgrounds: `d3.schemeSet2` (higher luminance)
- Sequential: `d3.interpolateViridis` (perceptually uniform)
- Diverging: `d3.interpolateRdBu`
- Never use hardcoded hex when a D3 scheme exists
- Never rely on color alone — add redundant encoding (shape, size, label)

## Theme-Aware Code

Prefer CSS variables from Observable Framework:

```javascript
link.attr("stroke", "var(--theme-foreground-faint)");
node.attr("stroke", "var(--theme-background)");
```

For standalone HTML, inline the `:root` CSS variable definitions.

## Performance

| Node Count | Renderer |
|---|---|
| < 500 | SVG |
| 500-10,000 | Canvas |
| > 10,000 | Canvas + WebGL |

## Anti-Patterns

- Never skip `viewBox` on SVG elements
- Never use default force parameters without tuning
- Never omit drag behavior on force simulations
- Never use CSS transitions for data-driven animations (use D3 transitions)
- Never render labels at every node in dense graphs
- Never use `d3.forceLink().id(d => d.id)` without verifying `id` field exists
- Never set `forceCollide` radius equal to visual radius (add padding)
- Never mutate source data — copy first if shared or reactive

## Transitions

```javascript
selection.transition()
    .duration(750)
    .attr("cx", d => xScale(d.x));
```

Use D3 transitions (not CSS) for data-bound animations. They correctly
interpolate numbers, colors, transforms, and paths.

## Margins Convention

```javascript
const margin = { top: 20, right: 20, bottom: 35, left: 40 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
```

## API Verification

Before using any D3 method, grep the source in `refs/` to confirm
the API signature. Do not rely on training data for parameter order
or default values.
