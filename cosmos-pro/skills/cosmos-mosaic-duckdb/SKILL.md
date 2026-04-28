---
name: cosmos-mosaic-duckdb
description: >-
  Data layer for cosmos.gl: DuckDB-WASM ingestion, Mosaic Coordinator and
  Selections, MosaicClient subclassing, vgplot grammar, and the binding model
  that wires vgplot charts to the cosmos.gl graph through shared Selections.
  Trigger on: "DuckDB", "DuckDB-WASM", "Mosaic", "@uwdata/mosaic-core",
  "Coordinator", "Selection", "MosaicClient", "vgplot", "intervalX",
  "intervalY", "cross-filter", "data layer", "Parquet", "registerFileBuffer",
  or any question about loading data into cosmos.gl or wiring chart filters.
version: 1.0.0
---

# Mosaic + DuckDB-WASM data layer

cosmos.gl and vgplot are siblings. They do not talk to each other directly.
Both subscribe to a Mosaic `Coordinator`, both publish and listen to
`Selection` objects, and both query DuckDB-WASM for their data. All
cross-filtering flows through `Selection`. Get this mental model right and
the data layer is straightforward; get it wrong and you will reach for
component-level state and end up fighting Mosaic.

Before writing any data-layer code, read the source under `refs/mosaic/` —
specifically `packages/core` for the Coordinator and Selection lifecycle,
`packages/sql` for the SQL builder, and `packages/vgplot` for the chart
grammar. The Mosaic spec docs are also useful but the source is canonical.

## The four pieces (and how they compose)

```
DuckDB-WASM (registers Parquet/JSON/CSV)
  -> Coordinator (single instance per page)
    <-> Selection (named, shared by clients)
      -> MosaicClient subclasses (e.g., CosmosGraphClient)
      -> vgplot charts (histogram, timeline, brush)
```

A `Coordinator` owns the DuckDB connection and the dispatcher. A `Selection`
expresses cross-filter state — "rows where year ∈ [1990, 2000]". Every
`MosaicClient` subscribes to one or more Selections and translates them
into SQL. vgplot charts both PUBLISH (a brush emits a range to its
Selection) and CONSUME (a histogram redraws when its filter Selection
updates).

## DuckDB-WASM init

The runtime project pins `@duckdb/duckdb-wasm` to 1.32.0 under
`overrides`. Do not upgrade without checking compatibility with
`@uwdata/mosaic-core` 0.24.x.

Canonical init pattern (see `templates/duckdb-setup.ts`):

```ts
import * as duckdb from "@duckdb/duckdb-wasm";
import duckdb_wasm from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import duckdb_worker from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";

const bundle = {
  mainModule: duckdb_wasm,
  mainWorker: duckdb_worker,
};
const worker = new Worker(bundle.mainWorker!);
const logger = new duckdb.ConsoleLogger();
const db = new duckdb.AsyncDuckDB(logger, worker);
await db.instantiate(bundle.mainModule);
const conn = await db.connect();
```

Register data with `registerFileBuffer` (in-memory bytes) or
`registerFileText` (inline CSV/JSON). Parquet is preferred for graph data
because of column compression — a 50K-node graph in Parquet is ~3 MB
versus ~30 MB in JSON.

## Coordinator: one per page (M5)

A `Coordinator` owns the DB connection and the Selection dispatcher. Two
coordinators on the same page mean two DuckDB connections, two dispatcher
states, and Selections that don't propagate between them. The user
brushes a histogram and the graph doesn't update — and the bug is invisible
because both halves of the page render fine.

Always create the Coordinator at the page or app shell level, share it via
React context (or equivalent), and pass the same instance into every
client. See `templates/mosaic-provider.tsx` for the React pattern.

```ts
import { coordinator } from "@uwdata/mosaic-core";
const coord = coordinator();   // singleton-style; or new Coordinator()
coord.databaseConnector(makeConnector(db, conn));
```

## Selection: name it, share it, never recreate it inline

Selections are state. They are named, registered with the Coordinator, and
referenced by name from every client that participates in their filter.

```ts
import { Selection } from "@uwdata/mosaic-core";

const yearFilter = Selection.crossfilter();
const topicFilter = Selection.crossfilter();
```

Anti-pattern: creating a Selection inside a render function. Each render
makes a new instance, the previous one is orphaned, the chart renders
"a Selection" but it isn't the one any other client subscribes to. Hoist
Selections to module scope or a stable React ref.

`Selection.crossfilter()` is the most common variant: each client's
contribution is excluded from its own view, so a histogram brush filters
the graph but doesn't filter itself out of existence.

`Selection.intersect()` and `Selection.union()` exist for cases where
multiple filters AND or OR. Pick the one that matches the user's mental
model of how the filters compose.

## MosaicClient: the bridge to cosmos.gl

`MosaicClient` is the abstract base. A concrete client overrides:

- `query(filter)` — returns a SQL string (or SQL builder) that, when
  evaluated by DuckDB with the given filter applied, produces the rows
  the client needs.
- `queryResult(data)` — called when DuckDB returns results. The client
  renders or updates from the data (in cosmos.gl's case: build/update
  Float32Arrays and call setters).
- `fields()` — declares which columns the client reads, so Mosaic can
  optimize.

`templates/CosmosGraphClient.ts` is the starter implementation. It owns a
cosmos.gl `Graph`, queries DuckDB for points and links, and updates the
Float32Arrays on selection change. Highlights:

```ts
class CosmosGraphClient extends MosaicClient {
  private graph: Graph;
  private positions: Float32Array;   // allocated once per data-size bucket
  private links: Float32Array;

  query(filter) {
    return `
      SELECT idx, x, y FROM graph_points WHERE ${filter || "1=1"}
    `;
  }

  queryResult(data) {
    // 1) Resize Float32Arrays only if pointCount changed
    // 2) Mutate in place from data rows
    // 3) Call graph.setPointPositions(this.positions)
  }
}
```

The client never reads or mutates anything outside its declared fields.
The cosmos.gl `Graph` instance lives inside the client; UI components own
the canvas element and the client lifecycle.

## vgplot: declarative charts bound to Selections

vgplot is a chart grammar — `plot(...)`, marks (`rectY`, `areaY`, `lineX`,
`dot`), `from(tableName)`, and brush helpers (`intervalX`, `intervalY`,
`toggleY`, `nearestX`).

Canonical histogram-with-brush:

```ts
import { plot, from, rectY, intervalX, name, width, height } from "@uwdata/vgplot";

plot(
  name("year-hist"),
  width(640),
  height(120),
  rectY(
    from("graph_points", { filterBy: yearFilter }),
    { x: "year", y: { count: {} }, fill: "var(--cp-accent)" }
  ),
  intervalX({ as: yearFilter })   // brush publishes range to yearFilter
)
```

`intervalX({ as: selection })` is the publishing side; `from(table, { filterBy: selection })`
is the consuming side. A chart can do either, both, or neither.

vgplot is for STANDARD Mosaic-bound charts. For custom D3 visualizations
(unusual layouts, hand-tuned interactions, anything beyond the grammar),
use D3 directly via d3-pro. N7 forbids reaching into vgplot internals to
draw custom things — write a `MosaicClient` instead.

## SQL safety — column allowlist

Client `query(filter)` methods build SQL strings. Never interpolate
user input or arbitrary identifiers. Maintain an allowlist of expected
table and column names:

```ts
const TABLES = {
  POINTS: "graph_points",
  LINKS: "graph_links",
  ENTITIES: "graph_entities",
} as const;

const COLUMNS = {
  POINTS: ["idx", "x", "y", "cluster_id", "year", "topic_id"],
  LINKS: ["src", "tgt", "weight"],
} as const;
```

Mosaic will quote identifiers correctly when given builders, but raw SQL
string assembly is the place for an extra check. `filter` from Mosaic is
already parameterized; the risk is in your own column references.

## The binding (worked example)

A vgplot histogram brush filters the cosmos.gl graph:

1. User drags brush on a vgplot year histogram.
2. `intervalX({ as: yearFilter })` publishes `{ field: "year", range: [1990, 2000] }`
   to `yearFilter`.
3. Coordinator notifies every client subscribing to `yearFilter`, including
   our `CosmosGraphClient`.
4. `CosmosGraphClient.query(filter)` builds
   `SELECT idx, x, y FROM graph_points WHERE year >= 1990 AND year <= 2000`.
5. DuckDB executes; results flow back into `queryResult(data)`.
6. The client mutates its preallocated Float32Arrays in place and calls
   `graph.setPointPositions(this.positions)` and `graph.setLinks(this.links)`.
7. cosmos.gl rerenders.

Nothing else in the page needs to know about the filter. No callbacks
threaded through props, no global event bus, no Redux.

## VERIFY checks

V-data-1. Exactly one `Coordinator` is created per page. Grep for
`coordinator()` and `new Coordinator(`; expect one match.
V-data-2. Selections are named, hoisted to module scope or a stable ref,
never created inline in render functions.
V-data-3. SQL strings reference table and column names from a TypeScript
allowlist; raw user input is never interpolated into SQL.
V-data-4. `@duckdb/duckdb-wasm` version in `package.json` matches the
runtime project pin (1.32.0).
V-data-5. Every `MosaicClient` subclass declares `fields()` so Mosaic can
optimize.

## Where to look in refs/

- Coordinator: `refs/mosaic/packages/core/src/Coordinator.js`
- Selection: `refs/mosaic/packages/core/src/Selection.js`
- MosaicClient: `refs/mosaic/packages/core/src/MosaicClient.js`
- vgplot grammar: `refs/mosaic/packages/vgplot/src/`
- DuckDB-WASM init: `refs/duckdb-wasm/packages/duckdb-wasm/src/`

## Anti-patterns

- Never create a second `Coordinator` for "isolation."
- Never construct a Selection inside a render function.
- Never bypass MosaicClient by reading DuckDB directly from a UI component.
  All data flows through the client.
- Never use vgplot for a custom D3 visualization (N7).
- Never assume `await db.connect()` is fast — pool the connection at app
  start and pass it to the Coordinator.
- Never load JSON when Parquet is an option for graph data over 10K nodes.
