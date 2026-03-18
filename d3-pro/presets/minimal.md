# Minimal Preset

Maximum data-ink ratio. Tufte-inspired. Every pixel must encode data
or provide essential structural context.

## Rules

1. **No axis lines.** Remove the `.domain` path. Keep only tick labels.
2. **No axis ticks.** Remove the tick lines too. Position labels directly.
3. **No borders, no backgrounds, no shadows.**
4. **Labels directly on data.** No legend unless > 6 categories.
5. **Color only when encoding data.** Never decorative color.
6. **Grid lines at most 0.05 opacity.** Prefer no grid.
7. **Thin strokes.** Links at 0.5px, node strokes at 0.75px.

## Axis Example

```javascript
svg.append("g")
    .call(d3.axisBottom(x).ticks(5).tickSize(0))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll("text")
        .attr("fill", "#999")
        .attr("font-size", "10px"));
```

## Node Treatment

```javascript
node.attr("r", 3)
    .attr("fill", d => color(d.group))
    .attr("stroke", "none");  // no stroke in minimal mode
```

Or with very thin stroke:
```javascript
node.attr("stroke", "#fff")
    .attr("stroke-width", 0.75);
```

## Link Treatment

```javascript
link.attr("stroke", "#ddd")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 0.5);
```

## Typography

Minimal, no decorative text:
```css
.minimal-label {
    font: 9px -apple-system, sans-serif;
    fill: #999;
}
```

## Grid Lines (If Used)

```javascript
svg.append("g")
    .selectAll("line")
    .data(yScale.ticks(5))
    .join("line")
    .attr("x1", marginLeft)
    .attr("x2", width - marginRight)
    .attr("y1", d => yScale(d))
    .attr("y2", d => yScale(d))
    .attr("stroke", "#000")
    .attr("stroke-opacity", 0.05);
```

## Data-Ink Ratio Checklist

Before finalizing a minimal visualization:
- [ ] Can any element be removed without losing information?
- [ ] Is color encoding data or decorating?
- [ ] Are labels necessary or can the data speak for itself?
- [ ] Is the stroke width the minimum for legibility?
- [ ] Would removing grid lines lose important reference?
