# dynamic-filtering

Use Mosaic Selections to drive `setPointColors` / `setPointSizes` /
`setLinkColors` updates on cross-filter change, WITHOUT rebuilding the
whole Float32Array. The graph topology is stable; only the visual
attributes change.

## Minimal working code

The pattern: split the data layer into "stable" (positions, links) and
"filterable" (colors, sizes, opacities). The stable layer is set once;
the filterable layer subscribes to a Selection and updates on filter
change.

```ts
class CosmosFilterClient extends MosaicClient {
  constructor(graph: Graph, filterBy: Selection) {
    super(filterBy);
    this.graph = graph;
  }

  fields() {
    return [
      { table: "graph_points", column: "idx" },
      { table: "graph_points", column: "year" },
      { table: "graph_points", column: "topic_id" },
    ];
  }

  query(filter: string | null) {
    // Always selects all rows; the predicate is applied to a derived
    // boolean column the client uses for color/opacity.
    return `
      SELECT idx, (${filter || "TRUE"}) AS in_filter FROM graph_points
      ORDER BY idx
    `;
  }

  queryResult(data) {
    const n = data.numRows;
    const colors = colorsBuf.ensure(n);
    const accent = cssVarToRgba("--cp-accent");

    for (let i = 0; i < n; i++) {
      const off = i * 4;
      const inFilter = data.getChild("in_filter").get(i);
      colors[off] = accent[0];
      colors[off + 1] = accent[1];
      colors[off + 2] = accent[2];
      colors[off + 3] = inFilter ? 1.0 : 0.15;
    }

    // ONE setter call. Not one per index.
    this.graph.setPointColors(colors);
  }
}
```

## Tuning notes

- The Float32Array is preallocated by `colorsBuf.ensure(n)`. The hot
  path mutates a slice in place. No allocation per filter change.
- Opacity for "out of filter" should be low enough to fade visually but
  high enough that the user still perceives the surrounding context.
  0.15 is the Theseus default.
- For larger graphs, consider greyout via the cosmos.gl built-in
  `pointGreyoutOpacity` config. It updates faster than per-point alpha
  for the global "everything not in focus" case.
- Link greyout is more expensive than point greyout because there are
  typically more links than points. Consider `setLinkColors` once with
  globally low alpha, then only highlight links touching the in-filter
  points.

## When to use this

- The user is brushing a histogram or timeline and the graph should
  visually narrow without rebuilding.
- The graph topology is stable across the filter — no points enter or
  leave, only their visual emphasis changes.
- The filter result might be a large fraction of all points (a true
  rebuild would be wasteful).

## When NOT to use this

- The filter dramatically narrows the graph (e.g., 50K -> 200 points)
  and showing the other 49,800 at low alpha is just visual noise. Use
  `histogram-timeline-brush.md` with a true rebuild instead.
- The filter is binary and persistent (e.g., "only show items I have
  read"). Set the static visuals once at load and skip the dynamic
  client.
- The filter changes the active layer. Layer change is a Build phase,
  not a Filter phase.
