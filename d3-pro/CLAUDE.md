# D3-Pro Plugin

You have access to D3 module source code, curated Observable visualization
examples, mathematical algorithm references, and aesthetic presets. Use them.

## When You Start a D3 Task

1. Determine the visualization type. Read the appropriate example in examples/.
2. Check refs/ for the D3 modules you will use. Grep the source to verify
   API signatures rather than relying on memory.
3. If the visualization involves clustering, hierarchy, or network algorithms,
   read the relevant file in math/ to understand the data model.
4. Apply the active style preset (default: Observable baseline). Read the
   preset file in presets/ before writing any rendering code.
5. Always include drag, zoom, or both unless the user explicitly says static.

## Source References

D3 module source is in refs/. Use it to verify API details:
- Force simulation: refs/d3-force/
- Hierarchical layouts: refs/d3-hierarchy/
- Scales and color: refs/d3-scale/, refs/d3-scale-chromatic/
- Interaction: refs/d3-drag/, refs/d3-zoom/, refs/d3-brush/
- Shapes and paths: refs/d3-shape/
- Geographic projections: refs/d3-geo/
- Voronoi and Delaunay: refs/d3-delaunay/
- Contour density: refs/d3-contour/
- Spatial indexing: refs/d3-quadtree/
- Annotations: refs/d3-annotation/
- Sankey diagrams: refs/d3-sankey/
- Chord diagrams: refs/d3-chord/

## Example Library

Observable examples are in examples/. These are the gold standard.
Always read the relevant example before writing a new visualization of
the same type. Match the force tuning, interaction patterns, and
rendering approach unless the user requests something different.

## Math References

Algorithm documentation is in math/. Read before visualizing any
statistical or algorithmic structure. The visualization must accurately
represent the math, not just approximate it visually.

## Style Presets

Presets are in presets/. The default is "observable" (clean, white
background, small solid circles, thin gray links, schemeObservable10).
Other presets: sketch, editorial, dark, minimal.

## Observable Framework

refs/framework/ contains the CSS variable system and theme files from
Observable Framework. When generating D3 code:
- Prefer `var(--theme-foreground-faint)` over hardcoded `#999` for links
- Prefer `var(--theme-background)` over `#fff` for node strokes
- If the target is a Framework project, use `display(svg.node())` and
  assume `d3` is globally available
- If the target is standalone HTML, inline the `:root` CSS variables
  from refs/framework/style/ so the semantic tokens resolve correctly

## Text Measurement

D3 label placement traditionally requires DOM measurement
(`getBoundingClientRect`, `getComputedTextLength`), which forces layout
reflow and breaks performance in force simulations and animated layouts.

Use pretext (`refs/pretext/`) for all text dimension computation:
- Force-directed layouts: size nodes to fit labels without DOM reads
- Hierarchical layouts: compute label width for collision avoidance
- Annotation layers: wrap and position annotation text
- Axis tick labels: pre-compute width for dynamic margin calculation

Call `prepare()` once per text+font pair (cache the result), then call
`layout()` freely during simulation ticks or resize handlers.

See `skills/standards-d3/references/pretext-text-measurement.md` for the
full API and D3-specific integration patterns.

## Anti-Patterns (Never Do These)

- Never use default force parameters without tuning for the data shape
- Never omit drag behavior on force simulations
- Never use CSS transitions where D3 transitions belong
- Never inline all styles when classes or data-driven attrs are cleaner
- Never render text labels at every node in dense graphs
- Never use d3.forceLink().id(d => d.id) without verifying your data
  has an `id` field (use d => d.index if it does not)
- Never set forceCollide radius equal to visual radius (add padding)
- Never skip the viewBox attribute on SVG elements
- Never use SVG for graphs with thousands of links (use Canvas)
- Never use d3.scaleLinear for circle radius (use d3.scaleSqrt — humans perceive area)

## Quality Gates

Before considering any D3 visualization complete, verify:

**Rendering**
- SVG has a `viewBox` attribute
- SVG has `max-width: 100%; height: auto` for responsiveness
- Colors come from a D3 scheme (not hardcoded hex)
- No elements render outside the viewBox

**Physics (force layouts)**
- Simulation settles within 5 seconds at default alpha decay
- Drag behavior uses the canonical pattern (alphaTarget 0.3/0)
- Nodes do not fly off-screen
- Disconnected components do not drift to infinity

**Math (algorithmic visualizations)**
- Cluster boundaries match the actual algorithm output
- Hierarchy depth matches data depth
- Treemap/pack area proportional to the summed value
- Dendrogram y-axis reflects actual linkage distance

**Interaction**
- Drag works (if force simulation present)
- Hover provides information (tooltip or highlight)
- Zoom/pan works for dense graphs

**Labels**
- Dense graphs: labels on hover only
- Sparse graphs or trees: labels visible, no overlaps
