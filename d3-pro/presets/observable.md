# Observable Preset (Default)

The canonical Observable / Mike Bostock aesthetic. This is the baseline.

## Colors

```javascript
const color = d3.scaleOrdinal(d3.schemeObservable10);
```

Theme-aware (preferred for new work):
```javascript
link.attr("stroke", "var(--theme-foreground-faint)");
node.attr("stroke", "var(--theme-background)");
node.attr("fill", d => color(d.group));
```

Fallback hex (standalone, no CSS variables):
- Link stroke: `#999` at opacity 0.6
- Node stroke: `#fff`
- Background: `#ffffff`
- Text: `#333`

## Nodes

| Context | fill | stroke | stroke-width | r |
|---|---|---|---|---|
| Hierarchy parent | `#fff` | `#000` | 1.5 | 3.5 |
| Hierarchy leaf | `#000` | `#fff` | 1.5 | 3.5 |
| Network (grouped) | `color(d.group)` | `#fff` | 1.5 | 5 |
| Bubble chart | `color(d.group)` | `#fff` | 1.5 | `rScale(d.value)` |

## Links

| Context | stroke | stroke-opacity | stroke-width |
|---|---|---|---|
| Unweighted | `#999` | 0.6 | 1 |
| Weighted | `#999` | 0.6 | `Math.sqrt(d.value)` |
| Hierarchy | `#999` | 0.6 | 1 |

## Typography

- Labels: `10px sans-serif`, fill `#333`
- Axis text: `10px sans-serif`
- Tooltips: native `<title>` elements

## Layout

- White or transparent background
- No border, no shadow, no gradient
- viewBox always set
- `max-width: 100%; height: auto`

## SVG Container

```javascript
const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");
```
