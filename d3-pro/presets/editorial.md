# Editorial Preset

Inspired by NYT Graphics, The Pudding, and Reuters Graphics.
Annotation-heavy, restrained color, and direct labeling.

## Colors

Muted palette. One or two accent colors against gray:

```javascript
const accentColor = "#e15759";
const baseGray = "#bab0ac";
const darkText = "#4e4d4a";

const color = d3.scaleOrdinal()
    .range(["#4e79a7", "#e15759", "#76b7b2", "#bab0ac"]);
```

## Typography

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

## Structural Rules

1. **No legend.** Label data directly on the marks.
2. **Minimal axes.** Thin axis lines, no gridlines, ticks only where needed.
3. **Annotations everywhere.** Use d3-annotation callouts to explain
   notable features in the data.
4. **Source line.** Always include a source attribution at bottom-left.
5. **White background.** Clean, paper-like.

## Axis Treatment

```javascript
svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(5))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line")
        .attr("stroke", "#ddd")
        .attr("y2", -(height - margin.top - margin.bottom)));
```

## Chart Structure

```
┌─────────────────────────────────────────────────┐
│  Title (22px, bold, Franklin Gothic)             │
│  Subtitle (14px, Georgia, gray)                  │
│                                                   │
│  ┌─ Visualization ─────────────────────────────┐ │
│  │                                               │ │
│  │  [Data marks with direct labels]              │ │
│  │                                               │ │
│  │  ← Annotation callout                         │ │
│  │                                               │ │
│  └───────────────────────────────────────────────┘ │
│                                                   │
│  Source: Dataset Name (10px, gray)                │
└─────────────────────────────────────────────────┘
```

## Annotation Pattern

```javascript
import { annotation, annotationCalloutElbow } from "d3-svg-annotation";

const annotations = [{
    note: { label: "Peak value", title: "Maximum", wrap: 120 },
    x: xScale(peakX), y: yScale(peakY),
    dx: 40, dy: -30,
    color: "#555"
}];

svg.append("g")
    .attr("class", "annotation-group")
    .call(annotation()
        .type(annotationCalloutElbow)
        .annotations(annotations));
```
