# D3 Transition Patterns

Reference for animating data visualizations with D3's transition system. Covers the transition API, custom interpolation, chaining, enter/update/exit, staggering, interpolation types, events, and performance.

## Transition API Basics

### Creating a Transition

Call `.transition()` on any D3 selection to create a transition. Attribute and style changes after `.transition()` are interpolated over time instead of applied immediately.

```js
d3.select("circle")
  .transition()
  .duration(750)
  .attr("cx", 300)
  .attr("r", 20)
  .style("fill", "steelblue");
```

### Duration

```js
.transition()
.duration(500)  // milliseconds
```

Default duration is 250ms. Set duration before specifying attributes.

### Delay

```js
.transition()
.delay(200)     // wait 200ms before starting
.duration(500)
```

Delay can also be a function of data and index:

```js
.delay((d, i) => i * 50)  // stagger by 50ms per element
```

### Easing

```js
.transition()
.ease(d3.easeCubicOut)
```

See `easing-catalog.md` for all available easing functions. The default is `d3.easeCubic` (cubic InOut).

### Named Transitions

Name transitions to prevent conflicts when multiple transitions target the same element.

```js
d3.selectAll("rect")
  .transition("position")
  .duration(500)
  .attr("x", (d) => xScale(d.value));

d3.selectAll("rect")
  .transition("color")
  .duration(300)
  .style("fill", (d) => colorScale(d.category));
```

Without names, starting a new transition on the same element interrupts the previous one. Named transitions run independently.

## attrTween and styleTween

### attrTween

For custom interpolation logic that cannot be expressed as a simple start-to-end value.

```js
d3.select("path")
  .transition()
  .duration(2000)
  .attrTween("d", function () {
    const start = this.getAttribute("d");
    const end = targetPathD;
    return d3.interpolatePath(start, end);
  });
```

The function receives no arguments when called as a factory. It returns an interpolator function that takes `t` (0 to 1) and returns the attribute value for that moment.

### styleTween

Same pattern for CSS styles.

```js
d3.select("div")
  .transition()
  .duration(1000)
  .styleTween("background-color", () => {
    return d3.interpolateRgb("red", "blue");
  });
```

### textTween

Animate text content (e.g., counting numbers).

```js
d3.select(".counter")
  .transition()
  .duration(2000)
  .textTween(() => {
    const interp = d3.interpolateNumber(0, 1000);
    return (t) => Math.round(interp(t)).toLocaleString();
  });
```

### Custom Arc Tween (Pie Charts)

```js
function arcTween(newAngle) {
  return function (d) {
    const interpolate = d3.interpolate(d.endAngle, newAngle);
    return function (t) {
      d.endAngle = interpolate(t);
      return arc(d);
    };
  };
}

path.transition()
  .duration(750)
  .attrTween("d", arcTween(newEndAngle));
```

Store the current angle on the datum so subsequent transitions start from the correct state.

## Chained Transitions

Call `.transition()` on an existing transition to chain them sequentially.

```js
d3.select("circle")
  .transition()
  .duration(500)
  .attr("cx", 200)
  .attr("fill", "red")
  .transition()           // second transition starts after the first ends
  .duration(500)
  .attr("cx", 400)
  .attr("fill", "blue")
  .transition()           // third
  .duration(500)
  .attr("cx", 200)
  .attr("fill", "green");
```

Each chained `.transition()` inherits the previous transition's delay plus duration as its start time. Easing and duration can differ per chain segment.

### Looping with Chained Transitions

```js
function pulse() {
  d3.select("circle")
    .transition()
    .duration(800)
    .attr("r", 30)
    .ease(d3.easeSinInOut)
    .transition()
    .duration(800)
    .attr("r", 15)
    .ease(d3.easeSinInOut)
    .on("end", pulse);
}
pulse();
```

Attach the `end` event to the last transition in the chain and recall the function.

## Enter / Update / Exit Transitions

The core D3 pattern: bind data, handle entering elements (new data), updating elements (changed data), and exiting elements (removed data).

### Full Pattern

```js
function update(data) {
  const t = d3.transition().duration(750);

  const bars = d3.select("svg")
    .selectAll("rect")
    .data(data, (d) => d.id);

  // EXIT: remove elements no longer in data
  bars.exit()
    .transition(t)
    .attr("width", 0)
    .style("opacity", 0)
    .remove();

  // ENTER: create elements for new data
  const enter = bars.enter()
    .append("rect")
    .attr("x", (d) => xScale(d.category))
    .attr("y", height)          // start from bottom
    .attr("width", xScale.bandwidth())
    .attr("height", 0)          // start with zero height
    .style("fill", (d) => colorScale(d.category))
    .style("opacity", 0);

  // ENTER + UPDATE: transition to final state
  enter.merge(bars)
    .transition(t)
    .attr("y", (d) => yScale(d.value))
    .attr("height", (d) => height - yScale(d.value))
    .attr("width", xScale.bandwidth())
    .style("opacity", 1);
}
```

### Key Function

The second argument to `.data()` is the key function. It determines which data point corresponds to which DOM element.

```js
.data(data, (d) => d.id)
```

Without a key function, D3 matches by index. This causes incorrect transitions when data is reordered, inserted, or removed from the middle.

### Transition Ordering

For smooth visual results, stagger transitions: exit first, then update, then enter.

```js
const t = d3.transition().duration(500);

// Exit with quick fade
bars.exit()
  .transition(t)
  .style("opacity", 0)
  .remove();

// Update positions (starts after exit due to shared transition)
bars.transition(t)
  .delay(300)
  .attr("y", (d) => yScale(d.value))
  .attr("height", (d) => height - yScale(d.value));

// Enter with delayed fade-in
enter
  .transition(t)
  .delay(600)
  .style("opacity", 1)
  .attr("y", (d) => yScale(d.value))
  .attr("height", (d) => height - yScale(d.value));
```

## Staggered Transitions

### Index-Based Delay

```js
d3.selectAll("rect")
  .transition()
  .delay((d, i) => i * 30)
  .duration(500)
  .attr("y", (d) => yScale(d.value))
  .attr("height", (d) => height - yScale(d.value));
```

### Data-Based Delay

Stagger by a data property (e.g., geographic position, alphabetical order).

```js
.delay((d) => xScale(d.date) * 2)  // left-to-right reveal
```

### Reverse Stagger

```js
.delay((d, i, nodes) => (nodes.length - 1 - i) * 30)
```

### Cascade Pattern

Group elements and stagger groups, then stagger within each group.

```js
const groups = d3.selectAll(".bar-group");
groups.each(function (groupData, groupIndex) {
  d3.select(this)
    .selectAll("rect")
    .transition()
    .delay((d, i) => groupIndex * 200 + i * 40)
    .duration(600)
    .attr("height", (d) => yScale(d.value));
});
```

## Interpolation Types (d3-interpolate)

### Built-in Interpolators

| Function | Input Types | Notes |
|----------|------------|-------|
| `d3.interpolateNumber(a, b)` | Numbers | Linear numeric interpolation |
| `d3.interpolateString(a, b)` | Strings with numbers | Finds numbers in strings and interpolates them |
| `d3.interpolateRgb(a, b)` | Colors (string or RGB) | Perceptually uniform in RGB space |
| `d3.interpolateHsl(a, b)` | Colors | HSL interpolation (can cause unexpected hue shifts) |
| `d3.interpolateHcl(a, b)` | Colors | Perceptually uniform; recommended for color transitions |
| `d3.interpolateLab(a, b)` | Colors | CIELAB color space; perceptually uniform |
| `d3.interpolateDate(a, b)` | Date objects | Returns Date objects |
| `d3.interpolateArray(a, b)` | Arrays | Element-wise interpolation |
| `d3.interpolateObject(a, b)` | Objects | Property-wise interpolation |
| `d3.interpolateTransformSvg(a, b)` | SVG transform strings | Decomposes and interpolates transforms |
| `d3.interpolatePath(a, b)` | SVG path `d` strings | From `d3-interpolate-path` (separate package) |

### Automatic Interpolation

D3 transitions automatically select the appropriate interpolator based on the attribute type. Setting `.attr("cx", 300)` uses number interpolation. Setting `.style("fill", "red")` uses color interpolation. Override with `attrTween` or `styleTween` when automatic selection is incorrect.

### Custom Interpolator

```js
function interpolateWithSnap(a, b) {
  const range = b - a;
  return function (t) {
    // Snap to nearest 10
    return Math.round((a + range * t) / 10) * 10;
  };
}

selection.transition()
  .attrTween("width", function () {
    const start = +this.getAttribute("width");
    return interpolateWithSnap(start, targetWidth);
  });
```

## Transition Events

### Available Events

```js
selection.transition()
  .on("start", function (event, d) {
    // Fires when transition begins (after delay)
    d3.select(this).style("stroke", "red");
  })
  .on("end", function (event, d) {
    // Fires when transition completes
    d3.select(this).style("stroke", null);
  })
  .on("interrupt", function (event, d) {
    // Fires when transition is interrupted by another transition
    console.log("Transition interrupted for", d);
  });
```

### Event Timing

- `start`: fires once per element when the transition begins (after any delay).
- `end`: fires once per element when the transition completes normally.
- `interrupt`: fires if a new transition overrides this one before completion.

### Common Patterns

**Chain logic on end:**

```js
.on("end", function () {
  d3.select(this)
    .transition()
    .duration(200)
    .style("opacity", 0)
    .remove();
});
```

**Track completion of all elements:**

```js
let remaining = nodes.length;

selection.transition()
  .duration(500)
  .attr("y", (d) => yScale(d.value))
  .on("end", () => {
    remaining--;
    if (remaining === 0) {
      onAllComplete();
    }
  });
```

### selection.interrupt()

Cancel all active transitions on a selection.

```js
d3.selectAll("circle").interrupt();
```

Useful for stopping transitions when data changes rapidly (e.g., real-time streaming data).

## Performance with Many Transitioning Elements

### Thresholds

| Element Count | Transition Behavior | Notes |
|--------------|-------------------|-------|
| < 100 | Smooth at 60fps | No optimization needed |
| 100 to 500 | Generally smooth | Watch for complex attrTween |
| 500 to 2,000 | May drop frames | Simplify interpolation, reduce DOM attributes |
| 2,000 to 5,000 | Likely janky | Consider Canvas rendering with manual interpolation |
| > 5,000 | Use Canvas | D3 transitions on DOM elements are impractical |

### Optimization Strategies

**Reduce DOM mutations.** Each `.attr()` and `.style()` call in a transition triggers a DOM mutation per frame per element. Minimize the number of animated properties.

**Use CSS transforms.** Animate `transform` instead of `cx`/`cy`/`x`/`y`. CSS transforms are GPU-composited and do not trigger layout.

```js
selection.transition()
  .style("transform", (d) => `translate(${xScale(d.x)}px, ${yScale(d.y)}px)`);
```

**Batch transitions.** Create one transition and share it across selections.

```js
const t = d3.transition().duration(500);

bars.transition(t).attr("height", (d) => yScale(d.value));
labels.transition(t).text((d) => d.value);
axis.transition(t).call(d3.axisLeft(yScale));
```

**Canvas fallback.** For thousands of elements, skip DOM transitions entirely. Use D3 for data processing and scales, then render to Canvas with manual easing:

```js
const ease = d3.easeCubicOut;

d3.timer((elapsed) => {
  const t = Math.min(1, ease(elapsed / duration));
  ctx.clearRect(0, 0, width, height);

  data.forEach((d) => {
    const x = d.startX + (d.endX - d.startX) * t;
    const y = d.startY + (d.endY - d.startY) * t;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  if (t >= 1) return true; // stop timer
});
```

**Debounce rapid updates.** If data changes faster than transitions complete, interrupt and restart with the latest data rather than queuing transitions.

```js
let pending = null;

function scheduleUpdate(newData) {
  if (pending) clearTimeout(pending);
  pending = setTimeout(() => {
    d3.selectAll("rect").interrupt();
    update(newData);
    pending = null;
  }, 100);
}
```

### Axis Transitions

Axes can be transitioned smoothly when scales change.

```js
const yAxis = d3.axisLeft(yScale);
const axisGroup = svg.select(".y-axis");

yScale.domain([0, d3.max(newData, (d) => d.value)]);

axisGroup.transition()
  .duration(750)
  .call(yAxis);
```

D3 automatically transitions tick positions, labels, and gridlines. For large datasets with many ticks, reduce tick count to limit DOM elements:

```js
yAxis.ticks(5);
```

### Interaction During Transitions

Elements remain interactive during transitions. Hover and click events fire normally. For tooltips, read the current (interpolated) attribute value:

```js
.on("mouseover", function () {
  const currentY = parseFloat(d3.select(this).attr("y"));
  showTooltip(currentY);
});
```

Avoid starting new data transitions on hover, as they interrupt the ongoing transition. Use named transitions to separate interaction animations from data animations.
