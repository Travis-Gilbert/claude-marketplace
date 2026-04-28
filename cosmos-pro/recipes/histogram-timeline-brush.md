# histogram-timeline-brush

The canonical pattern: a vgplot histogram and a vgplot timeline both
publish ranges to Selections; the cosmos.gl graph subscribes and
re-queries. All cross-filtering flows through Mosaic Selections — the
graph and charts never talk to each other directly.

## Minimal working code

Selections (in `selections.ts`):

```ts
import { Selection } from "@uwdata/mosaic-core";
export const yearFilter = Selection.crossfilter();
export const topicFilter = Selection.crossfilter();
```

Histogram (publishes to `topicFilter`):

```ts
import { plot, from, rectY, intervalX, name, width, height } from "@uwdata/vgplot";
import { TABLES } from "@/lib/theseus/cosmos/tables";
import { topicFilter } from "@/lib/theseus/cosmos/selections";

export function GraphHistogram() {
  return plot(
    name("graph-topic-hist"),
    width(640),
    height(120),
    rectY(
      from(TABLES.POINTS, { filterBy: topicFilter }),
      { x: "topic_id", y: { count: {} }, fill: "var(--cp-accent)" }
    ),
    intervalX({ as: topicFilter })
  );
}
```

Timeline (publishes to `yearFilter`):

```ts
import { plot, from, areaY, intervalX, name, width, height } from "@uwdata/vgplot";
import { yearFilter } from "@/lib/theseus/cosmos/selections";

export function GraphTimeline() {
  return plot(
    name("graph-timeline"),
    width(800),
    height(80),
    areaY(
      from(TABLES.POINTS, { filterBy: yearFilter }),
      { x: "captured_at", y: { count: {} }, fill: "var(--cp-warm)" }
    ),
    intervalX({ as: yearFilter })
  );
}
```

Graph client (subscribes to BOTH):

```ts
import { Selection } from "@uwdata/mosaic-core";
const combinedFilter = Selection.intersect([yearFilter, topicFilter]);

const client = new CosmosGraphClient(graph, combinedFilter);
coordinator.connect(client);
```

That's the whole binding. The user brushes; the histogram or timeline
publishes; Mosaic re-runs the graph client's `query`; DuckDB returns the
filtered subset; the client mutates Float32Arrays and calls cosmos.gl
setters.

## Tuning notes

- `Selection.crossfilter()` excludes a client's own contribution from
  its own view. Histogram filtered by `topicFilter` doesn't filter
  itself out of existence — only other clients are filtered.
- `Selection.intersect([...])` is the right combinator when the user
  expects AND semantics ("year ∈ range AND topic ∈ range"). For OR,
  use `Selection.union(...)`.
- Brush release should NOT trigger an animation. The graph already
  re-queries on every brush move; an animation on top of that is
  visual noise.
- Debounce the brush only if DuckDB queries are slow (>200ms). The
  default Mosaic debouncing is usually fine.

## When to use this

- The view has 1+ vgplot charts and a cosmos.gl graph that all need
  to cross-filter together.
- The user expects "brush a histogram, see the graph narrow" as the
  primary interaction.
- The data lives in DuckDB and the columns the charts need exist.

## When NOT to use this

- The interaction is "click to select" rather than "brush a range" —
  use `toggleY` or a different selection helper.
- The graph is small enough that the user could just see all points;
  a brush adds friction without value.
- The chart is a custom D3 visualization rather than a standard
  Mosaic-bound chart — write a `MosaicClient` that publishes to the
  Selection directly, do not bend vgplot to non-vgplot rendering (N7).
