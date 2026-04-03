# Renderer Pipeline Contract

## Pipeline Architecture

D3 and R3F are not alternatives. They are a pipeline:

```
Backend reasoning → D3 layout computation → TF.js scene intelligence → R3F rendering
```

### D3: The Math Layer

D3 computes layout. Force simulations, hierarchical positioning, geographic projections, data scales, topology analysis. D3 produces positions, edges, groupings, and data-mapped values.

**Responsibilities:**
- Force simulation parameters (charge, link distance, collision)
- Hierarchical layout (tree, treemap, pack, partition)
- Geographic projections (geoMercator, geoAlbersUsa, etc.)
- Data scales (linear, log, ordinal, sequential color)
- Topology analysis (connected components, centrality)
- Binning and aggregation for data-viz answers

### TF.js: The Scene Intelligence Layer

TensorFlow.js is the scene intelligence layer between D3's layout and R3F's rendering. It is Theseus's visual cortex: it interprets the same graph-embedded knowledge that the LLM reasons over, but through a visual lens.

**Responsibilities:**
- Salience scoring (which nodes matter most for this query)
- Emphasis determination (size, brightness, position priority)
- Hypothesis styling (visual treatment for uncertain vs. confirmed)
- Construction sequencing (order of node/edge appearance during build)
- Camera placement (where to look, zoom level, orbit path)
- Learning from user interaction over time

TF.js does not serve the LLM. It serves the same underlying intelligence (the GNN-fused knowledge graph) through a different modality.

### R3F: The Rendering Layer

React Three Fiber takes D3's computed layout and renders it as a 3D interactive experience.

**Responsibilities:**
- Node meshes with materials and lighting
- Edge rendering (lines, tubes, particle trails)
- Camera control and animation
- Scene lighting (ambient, point, directional)
- Interaction handlers (click, hover, drag)
- Post-processing effects

### Sigma: The 2D Fallback

When 3D is inappropriate (mobile, accessibility, very dense graphs where 2D clarity wins), Sigma/Graphology renders the D3-computed layout in 2D. This is a renderer swap, not a different pipeline.

**When to use Sigma instead of R3F:**
- Mobile devices with limited GPU
- Accessibility contexts requiring 2D navigation
- Graphs >5,000 nodes where 2D clarity wins
- Contexts where WebGL is unavailable

### Vega-Lite: The Declarative Chart Path

For standard statistical charts where custom D3 layout is overkill, Vega-Lite can produce the chart directly. R3F is not involved in these cases unless the chart needs to exist within a 3D scene context.

**When to use Vega-Lite:**
- Standard bar, line, scatter, area charts
- Statistical summaries (histograms, box plots)
- Small multiples and faceted views
- Quick exploratory charts during data acquisition

### Observable Framework: Layout Patterns

Observable Framework provides additional layout algorithms and chart composition patterns that complement D3's computation layer.

**When to consult Observable Framework:**
- Complex multi-view compositions
- Responsive chart layouts
- Data-driven page structures
- Plot-based visualizations as an alternative to hand-coded D3

## Pipeline Configuration by Answer Type

### Graph-Native Answers

```
D3: d3.forceSimulation()
  - forceLink: distance based on edge strength
  - forceManyBody: charge -30 to -300 based on node count
  - forceCenter: viewport center
  - forceCollide: radius based on node importance

TF.js: GraphSceneDirective
  - salience: cosine similarity to query embedding
  - topology: community detection for cluster coloring
  - sequence: high-salience nodes first, then edges
  - camera: orbit around centroid, pull toward focal cluster

R3F: <ForceGraph3D>
  - nodeMaterial: MeshStandardMaterial with emissive at type color
  - edgeMaterial: LineBasicMaterial, opacity from edge strength
  - lighting: ambient 0.4 + directional 0.6
  - interaction: onClick → detail drawer, onHover → glow
```

### Data-Visualization Answers

```
D3: scales + projection
  - geographic: d3.geoMercator() for heatmaps
  - temporal: d3.scaleTime() for timelines
  - statistical: d3.scaleBand/Linear for charts

TF.js: DataVizSceneDirective
  - emphasis: highlight outliers and patterns
  - pacing: progressive data point appearance
  - camera: overview first, then guided zoom

R3F: <DataSurface>
  - heatmap: PlaneGeometry with vertex colors
  - timeline: extruded path geometry
  - scatter: InstancedMesh for performance
```

### Hybrid Answers

```
D3: graph layout + data scales (both active)

TF.js: HybridSceneDirective
  - compose graph context with data visualization
  - determine spatial relationship between graph and viz
  - camera path visits both

R3F: <HybridScene>
  - graph nodes in one region
  - data surface in another
  - connecting elements between them
```

## Rules

1. Never bypass the pipeline. D3 always computes layout, even for 2D rendering.
2. TF.js always directs scene intelligence. Never hardcode salience or camera placement.
3. R3F is the 3D renderer. Sigma is the 2D renderer. Both consume D3 output.
4. Vega-Lite is for declarative charts only. Use when D3 layout is overkill.
5. Observable Framework supplements D3 patterns but does not replace the pipeline.
6. The pipeline order is strict: D3 → TF.js → R3F/Sigma.
