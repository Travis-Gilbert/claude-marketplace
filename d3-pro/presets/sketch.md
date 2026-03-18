# Sketch Preset

Post-processes SVG through rough.js to create a hand-drawn look.
All structural D3 code remains the same; the sketch layer applies after
rendering is complete.

## How to Apply

```javascript
import { sketchify } from "sketch-render";

// Build the visualization normally with D3
// ...

// Apply sketch post-processing as the final step
sketchify(svg.node(), "notebook");
```

## Rough.js Parameters (notebook preset)

| Property | Value |
|---|---|
| roughness | 1.2 |
| bowing | 1.5 |
| fillStyle | cross-hatch |
| fillWeight | 0.5 |
| hachureGap | 4 |
| strokeWidth | 1 |
| seed | 42 |

## Per-Element Overrides

```javascript
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

Axes should be less rough than data elements.

## Font Pairing

```css
@import url('https://fonts.googleapis.com/css2?family=Caveat&display=swap');
.sketch-label { font-family: 'Caveat', cursive; }
```

## Canvas Mode

For force simulations with many nodes, use rough.js canvas mode:

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

## Color Adjustments

Use slightly muted, warm-toned colors to complement the hand-drawn feel:
```javascript
const color = d3.scaleOrdinal()
    .range(["#5c8a97", "#d4826a", "#8fb370", "#c9a95f", "#9b7bb0",
            "#d68a8a", "#6ba3a0", "#b5955e"]);
```

Background: off-white (`#faf8f5`) or cream for a paper-like feel.
