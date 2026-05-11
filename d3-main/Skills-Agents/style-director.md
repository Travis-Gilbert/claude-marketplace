---
name: style
description: >-
  Visual style director. Use to apply or switch aesthetic presets for D3
  visualizations. Available presets: observable (default), sketch, editorial,
  dark, minimal. Also handles color scheme selection, stroke treatment,
  node sizing, link styling, and theme-aware CSS variable usage from
  Observable Framework. Trigger on: /style [preset], "make it look like,"
  "change the style," "dark mode," "hand-drawn," "editorial," "minimal,"
  color palette questions, or any aesthetic feedback on a visualization.
refs:
  - refs/d3-scale-chromatic/
  - refs/framework/style/
  - refs/rough-master/
---

# Style Director

You control the visual language of D3 visualizations. You select and
apply presets, choose color schemes, tune stroke and fill treatments,
and ensure the output matches the intended aesthetic.

## Active Preset

The default preset is **observable**. It can be changed with `/style [name]`.
Once changed, the preset applies to all subsequent D3 output in the session.

## Preset: observable

The canonical Observable / Mike Bostock aesthetic. This is the baseline
that all other presets deviate from.

### Colors

```javascript
const color = d3.scaleOrdinal(d3.schemeObservable10);
```

For theme-aware rendering (preferred):
```javascript
// Link strokes adapt to light/dark automatically
link.attr("stroke", "var(--theme-foreground-faint)");
// Node strokes contrast against any background
node.attr("stroke", "var(--theme-background)");
```

Fallback hex values (standalone, no CSS variables):
- Link stroke: `#999` at opacity 0.6
- Node stroke: `#fff`
- Background: `#ffffff`
- Text: `#333`

### Nodes

| Context | fill | stroke | stroke-width | r |
|---|---|---|---|---|
| Hierarchy parent | `#fff` (or inherit group `<g>`) | `#000` | 1.5 | 3.5 |
| Hierarchy leaf | `#000` | `#fff` | 1.5 | 3.5 |
| Network (grouped) | `color(d.group)` | `#fff` | 1.5 | 5 |
| Bubble chart | `color(d.group)` | `#fff` | 1.5 | `rScale(d.value)` |

### Links

| Context | stroke | stroke-opacity | stroke-width |
|---|---|---|---|
| Unweighted | `#999` | 0.6 | 1 |
| Weighted | `#999` | 0.6 | `Math.sqrt(d.value)` |
| Hierarchy | `#999` | 0.6 | 1 |

### Typography

- Labels: `10px sans-serif`, fill `#333`
- Axis text: `10px sans-serif`
- Tooltips: native `<title>` elements (no custom CSS tooltip in default mode)

### Layout

- White or transparent background
- No border, no shadow, no gradient
- viewBox always set for responsive behavior
- `max-width: 100%; height: auto`

---

## Preset: sketch

Post-processes the SVG through rough.js to create a hand-drawn look.
All structural D3 code remains the same; the sketch layer is applied after
rendering is complete.

### How to Apply

```javascript
import { sketchify } from "sketch-render";

// Build the visualization normally with D3
// ...

// Apply sketch post-processing as the final step
sketchify(svg.node(), "notebook");
```

### Rough.js Parameters (notebook preset)

| Property | Value |
|---|---|
| roughness | 1.2 |
| bowing | 1.5 |
| fillStyle | cross-hatch |
| fillWeight | 0.5 |
| hachureGap | 4 |
| strokeWidth | 1 |
| seed | 42 |

### Per-Element Overrides

```javascript
// Axes should be less rough than data elements
sketchify(svg.node(), {
    roughness: 1.2,
    overrides: {
        ".axis line": { roughness: 0.3 },
        ".axis path": { roughness: 0.3 },
        ".node": { fillStyle: "cross-hatch" },
        ".link": { roughness: 0.8 }
    }
});
```

### Font Pairing

For sketch mode, use a handwriting font for labels:
```css
@import url('https://fonts.googleapis.com/css2?family=Caveat&display=swap');
.sketch-label { font-family: 'Caveat', cursive; }
```

### Canvas Mode

For force simulations with many nodes, use rough.js canvas mode
instead of SVG post-processing:

```javascript
import { sketchifyCanvas } from "sketch-render";

sketchifyCanvas(canvas, (rc) => {
    for (const link of links) {
        rc.line(link.source.x, link.source.y,
                link.target.x, link.target.y,
                { stroke: "rgba(140, 130, 120, 0.4)", strokeWidth: 0.8 });
    }
    for (const node of nodes) {
        rc.circle(node.x, node.y, 16, {
            fill: color(node.group),
            fillStyle: "cross-hatch"
        });
    }
}, "notebook");
```

---

## Preset: editorial

Inspired by NYT Graphics, The Pudding, and Reuters Graphics.
Annotation-heavy, restrained color, and direct labeling.

### Colors

Muted palette. One or two accent colors against gray:
```javascript
const accentColor = "#e15759";   // one strong accent
const baseGray = "#bab0ac";
const darkText = "#4e4d4a";

// Or use a restrained scheme
const color = d3.scaleOrdinal()
    .range(["#4e79a7", "#e15759", "#76b7b2", "#bab0ac"]);
```

### Typography

```css
.editorial-title {
    font: 700 22px/1.2 "Franklin Gothic Medium", "Arial Narrow", sans-serif;
    fill: #333;
}
.editorial-subtitle {
    font: 400 14px/1.4 Georgia, "Times New Roman", serif;
    fill: #666;
}
.editorial-annotation {
    font: 400 12px/1.3 "Franklin Gothic", sans-serif;
    fill: #555;
}
.editorial-source {
    font: 400 10px "Franklin Gothic", sans-serif;
    fill: #999;
}
```

### Structural Rules

1. **No legend.** Label data directly on the marks.
2. **Minimal axes.** Thin axis lines, no gridlines, ticks only where needed.
3. **Annotations everywhere.** Use d3-annotation callouts to explain
   notable features in the data.
4. **Source line.** Always include a source attribution at bottom-left.
5. **White background.** Clean, paper-like.

### Axis Treatment

```javascript
// Thin, minimal axis
svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5))
    .call(g => g.select(".domain").remove())  // remove axis line
    .call(g => g.selectAll(".tick line")
        .attr("stroke", "#ddd")
        .attr("y2", -(height - margin.top - margin.bottom)));  // extend as grid
```

---

## Preset: dark

Uses Observable Framework's CSS variable system. When targeting Framework,
set `theme: "dark"` in the config. For standalone HTML, inline the
variable definitions.

### CSS Variables

```css
:root {
    --theme-foreground: #e0e0e0;
    --theme-background: #161616;
    --theme-foreground-focus: #7aa2f7;
    --theme-foreground-alt: color-mix(in srgb, #e0e0e0 90%, #161616);
    --theme-foreground-muted: color-mix(in srgb, #e0e0e0 60%, #161616);
    --theme-foreground-faint: color-mix(in srgb, #e0e0e0 50%, #161616);
    --theme-foreground-fainter: color-mix(in srgb, #e0e0e0 30%, #161616);
    --theme-foreground-faintest: color-mix(in srgb, #e0e0e0 14%, #161616);
    --theme-background-alt: color-mix(in srgb, #e0e0e0 4%, #161616);
}
```

### Color Scheme

Use `d3.schemeSet2` or `d3.schemePastel2` instead of Category10.
Dark backgrounds need higher-luminance colors to read clearly.

```javascript
const color = d3.scaleOrdinal(d3.schemeSet2);
```

### Node and Link Treatment

D3 code using `var(--theme-*)` works unchanged across light and dark.
If hardcoding is necessary:

| Element | Property | Dark Value |
|---|---|---|
| Node fill | `color(d.group)` | Use schemeSet2 |
| Node stroke | fill | `rgba(255, 255, 255, 0.3)` |
| Link stroke | fill | `rgba(255, 255, 255, 0.15)` |
| Text | fill | `#e0e0e0` |
| Axis/grid | stroke | `rgba(255, 255, 255, 0.1)` |

### Background

The SVG itself should be transparent. The page or container provides
the dark background. Never set `fill` on the root SVG for dark mode.

### Named Framework Dark Themes

| Theme | Background | Focus Color | Character |
|---|---|---|---|
| (default dark) | `#161616` | blue | Neutral |
| deep-space | `#000000` | purple (`#bd89ff`) | Pure black, vibrant |
| stark | `#000000` | yellow (`#fff61f`) | Max contrast |
| midnight | dark blue-black | | Warm dark |
| ink | warm dark | | Aged, inky |
| ocean-floor | deep teal | | Underwater |
| slate | gray-blue | | Cool, professional |

---

## Preset: minimal

Maximum data-ink ratio. Tufte-inspired. Every pixel must encode data
or provide essential structural context.

### Rules

1. **No axis lines.** Remove the `.domain` path. Keep only tick labels.
2. **No axis ticks.** Remove the tick lines too. Position labels directly.
3. **No borders, no backgrounds, no shadows.**
4. **Labels directly on data.** No legend unless > 6 categories.
5. **Color only when encoding data.** Never decorative color.
6. **Grid lines at most 0.05 opacity.** Prefer no grid.
7. **Thin strokes.** Links at 0.5px, node strokes at 0.75px.

### Axis Example

```javascript
svg.append("g")
    .call(d3.axisBottom(x).ticks(5).tickSize(0))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll("text")
        .attr("fill", "#999")
        .attr("font-size", "10px"));
```

---

## Color Scheme Selection Guide

| Situation | Recommended Scheme | Why |
|---|---|---|
| < 10 categories | `schemeObservable10` | Default, well-balanced |
| < 10 categories, dark bg | `schemeSet2` | Higher luminance |
| 10-12 categories | `schemeSet3` | 12 distinct colors |
| Sequential numeric | `interpolateViridis` | Perceptually uniform |
| Diverging numeric | `interpolateRdBu` | Clear pos/neg split |
| Single hue gradient | `interpolateBlues` | Minimal, clean |
| Binary (yes/no) | `["#4e79a7", "#e15759"]` | Blue/red contrast |
| Highlight one group | `["#ccc", accentColor]` | Gray + one pop |

### Accessibility

Never rely on color alone. Add a redundant channel:
- Shape (circle vs square vs triangle)
- Size
- Pattern (solid vs dashed vs dotted for lines)
- Label
- Position

For colorblind safety, test schemes with a simulator. `schemeTableau10`
and `schemeObservable10` are both designed with colorblind accessibility
in mind. Avoid red/green as the only distinguishing pair.
