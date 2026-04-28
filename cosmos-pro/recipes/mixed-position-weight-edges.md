# mixed-position-weight-edges

The Theseus ControlDock archetype: three independent pickers
(Position, Weight, Edges) that compose freely. Walks through the data
transform for each picker combination so the renderer never special-cases
"this layer + that layer."

## Minimal working code

The pattern is: each picker's choice resolves to a column or set of
columns in DuckDB; the `CosmosGraphClient` queries those columns and
maps them onto cosmos.gl setters.

```ts
type ActiveLayers = {
  position: string;          // e.g., "sbert_umap_v3"
  weight: string;            // e.g., "personalized_pagerank"
  edges: string[];           // e.g., ["structural", "nli_agreement"]
};

class CosmosGraphClient extends MosaicClient {
  constructor(graph: Graph, public active: ActiveLayers) { /* ... */ }

  query(filter: string | null) {
    const where = filter ? `WHERE ${filter}` : "";
    // Position columns vary per layer. Maintain a mapping.
    const positionColumns = LAYER_POSITION_COLUMNS[this.active.position];
    const weightColumn = LAYER_WEIGHT_COLUMNS[this.active.weight];
    return `
      SELECT idx,
             ${positionColumns.x} AS x,
             ${positionColumns.y} AS y,
             ${weightColumn} AS weight,
             cluster_id
      FROM graph_points
      ${where}
      ORDER BY idx
    `;
  }

  queryResult(data) {
    const n = data.numRows;
    // Map weight to size (cosmos-performance: prebuilt array, not loop-set)
    const sizes = sizesBuf.ensure(n);
    for (let i = 0; i < n; i++) {
      sizes[i] = sizeFromWeight(data.getChild("weight").get(i));
    }
    this.graph.setPointSizes(sizes);
    // ... positions, etc.
  }
}
```

For edges, multiple selected edge layers compose via union:

```ts
async function loadEdges(conn, activeEdges: string[]) {
  const edgeTables = activeEdges.map(name => EDGE_TABLES[name]);
  const sql = edgeTables
    .map(t => `SELECT src, tgt, '${t}' AS type FROM ${t}`)
    .join(" UNION ALL ");
  const result = await conn.query(sql);
  // Build the links Float32Array from the union result.
}
```

## Tuning notes

- Weight -> size mapping is non-linear. Use `Math.sqrt(weight)` or a
  D3 `scaleSqrt` so visual area is proportional to value (humans
  perceive area, not radius).
- Weight -> color is a separate decision. By default, drive color from
  cluster, drive size from weight. Mixing weight into color creates
  perceptually noisy graphs.
- Active edge layer count > 3 starts to look like a hairball. Hard cap
  in the UI.
- The picker UI must show which combinations are sensible. SBERT
  position + KGE edges, for example, produces a rendering where the
  edges don't follow the spatial proximity.

## When to use this

- The user has multiple position layers, multiple weight layers, and
  multiple edge layers available, and the design intent is to let them
  recombine freely.
- The view is the Theseus explorer's primary "I want to look at the
  graph through different lenses" surface.

## When NOT to use this

- The view is an answer to a specific question — pick the right
  composition for the question shape (see `cosmos-recipes` cheatsheet)
  rather than exposing pickers.
- Only one layer per dimension is available — there is nothing to mix.
- The data lacks the columns needed for some compositions — surface
  the gap (the layer does not exist yet) rather than silently
  rendering an empty composition.
