# Custom Data-Visualization Answer Models

## What This Is

When Theseus's graph isn't confident enough, it searches the web, gathers data, and constructs a custom visualization. This is the product's highest expression.

**Example:** "What is the traffic pattern of New York taxis?" produces a luminous geographic heatmap built from actual data, animated into existence, interactive.

## Framework

| Component | Role |
|-----------|------|
| DuckDB | Data processing (in-browser SQL on gathered data) |
| D3 | Layout computation, scales, projections, binning |
| TF.js | Scene intelligence: emphasis, pacing, camera, learning |
| R3F | 3D rendering of data surfaces, point clouds, meshes |
| Vega-Lite | Declarative chart alternative when custom D3 is overkill |
| Observable Framework | Additional layout and chart patterns |

## Construction Flow

### Phase 1: Partial Answer (Graph Knowledge)

The graph shows what Theseus knows. Relevant nodes brighten, partial connections form. This is the "here's what I know so far" state.

### Phase 2: Data Acquisition

A progress bar appears (Ink-style) showing data acquisition stages:
- "Searching web for taxi data..."
- "Processing 3.2M records with DuckDB..."
- "Computing geographic projection..."

Real stages, real progress. Not a fake loading bar.

### Phase 3: Progressive Construction

As data arrives, the visualization reshapes in real time:

**Geographic heatmap:**
- D3 computes geo projection (d3.geoMercator or geoAlbersUsa)
- Data bins into hex grid (d3.hexbin)
- R3F renders as extruded PlaneGeometry with vertex colors
- Heat values map to color scale (cool blue → hot amber → white)
- Surface builds progressively as data loads

**Timeline:**
- D3 computes time scale (d3.scaleTime)
- Events position along temporal axis
- R3F renders as extruded path geometry with event markers
- Timeline extends as data arrives

**Scatter / Point Cloud:**
- D3 computes scales for each dimension
- R3F renders as InstancedMesh (performance-critical for large datasets)
- Points flow into position with staggered animation
- Color encodes a dimension via D3 sequential color scale

**Statistical Charts (Vega-Lite path):**
- When the answer is a standard bar, line, or area chart
- Vega-Lite spec generated from data schema
- Rendered directly without R3F involvement
- Can be composed alongside graph context in hybrid view

### Phase 4: Crystallization

Data visualization completes. Labels appear. Text answer panel provides the LLM's analysis of the data alongside the visual.

### Phase 5: Exploration

User can interact with the data visualization:
- Hover for data point details
- Click regions for drill-down
- Brush to select subsets
- Toggle between aggregation levels
- Ask follow-up questions that refine the visualization

## D3 Configuration by Visualization Type

### Geographic Heatmap
```javascript
const projection = d3.geoMercator()
  .fitSize([width, height], geoData);

const hexbin = d3.hexbin()
  .radius(hexRadius)
  .extent([[0, 0], [width, height]]);

const colorScale = d3.scaleSequential(d3.interpolateInferno)
  .domain([0, maxDensity]);
```

### Timeline
```javascript
const timeScale = d3.scaleTime()
  .domain(d3.extent(data, d => d.date))
  .range([0, width]);

const yScale = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.value)])
  .range([height, 0]);
```

### Scatter Plot
```javascript
const xScale = d3.scaleLinear()
  .domain(d3.extent(data, d => d.x))
  .range([0, width]);

const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
```

## TF.js Scene Intelligence for Data Viz

TF.js plays a different role for data-viz answers than for graph answers:

- **Emphasis:** Identify outliers and patterns in the data; highlight them visually
- **Pacing:** Determine how fast data points appear (faster for large datasets, slower for dramatic reveals)
- **Camera:** Overview first, then guided zoom to interesting regions
- **Learning:** Track which data regions the user explores; surface similar patterns in future answers

## Vega-Lite Integration

For standard charts, generate a Vega-Lite spec:

```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {"values": []},
  "mark": "bar",
  "encoding": {
    "x": {"field": "category", "type": "nominal"},
    "y": {"field": "value", "type": "quantitative"},
    "color": {"field": "group", "type": "nominal"}
  }
}
```

Render with `vegaEmbed` using VIE dark theme configuration. Style with VIE tokens.

## Observable Framework Integration

For layout composition and Plot-based alternatives:
- Consult Observable Framework for multi-view dashboard layouts
- Consider Observable Plot for quick exploratory charts during data acquisition
- Framework patterns complement D3 computation without replacing the pipeline
