# The Mosaic stack

The full data + render pipeline for the knowledge-graph answer path.

## Diagram

```
TF.js (upstream, backend-fed)
  -> SceneDirective + layer_positions JSON
    -> DuckDB-WASM (registered Parquet/JSON)
      -> Mosaic Coordinator (one per page)
        <-> Selection (named, shared)
          -> MosaicClient subclasses (CosmosGraphClient et al.)
            -> cosmos.gl Graph (WebGL force-directed renderer)
          -> vgplot charts
            -> histograms, timelines, brushes
```

The arrows say a lot. cosmos.gl and vgplot are SIBLINGS. They do not
talk to each other directly. Both subscribe to Mosaic Selections;
filter changes propagate via the Selection dispatcher.

## Ownership boundaries

| Plugin | Owns |
|---|---|
| cosmos-pro | cosmos.gl config, Mosaic wiring, vgplot authoring, SceneDirective adapter, three-picker ControlDock, fallback rules |
| vie-design | Visual identity, tokens, datadots, engine heat, construction phasing aesthetics, text-answer panel placement, Mantine vocabulary |
| d3-pro | D3 modules used upstream (force, hierarchy, scale, delaunay, contour) to compute layer_positions |
| three-pro / animation-pro | R3F scenes for genuinely 3D answer types (heatmap surface, flythrough) |

When in doubt about ownership: "Does this touch cosmos.gl config,
Mosaic SQL, vgplot, or DuckDB loading? -> cosmos-pro. Does it touch
tokens, datadots, heat, feel? -> vie-design. Does it compute a layout
that becomes layer_positions? -> d3-pro. Is the answer an R3F scene?
-> three-pro."

## Two parallel paths exist

For knowledge-graph answers (default): TF.js -> DuckDB-WASM -> Mosaic
-> cosmos.gl (+ vgplot). Sigma is the 2D fallback.

For custom data-visualization answers (NYC taxi heatmap archetype):
D3 computes layout -> TF.js directs scene intelligence -> R3F renders.
Vega-Lite for declarative charts when D3 is overkill.

The renderer field on the SceneDirective tells cosmos-pro which path
applies. Never render a knowledge-graph answer through R3F or a
custom data-viz answer through cosmos.gl.

## Pinning matters

The runtime project pins specific versions:
- `@duckdb/duckdb-wasm` 1.32.0 (in `overrides`)
- `@uwdata/mosaic-core` 0.24.x
- `@cosmos.gl/graph` (track the version aligned with cosmos v2.x)
- `@luma.gl/shadertools` 9.2.6

Mosaic 0.24 + DuckDB-WASM 1.32 is a tested pair. Upgrading either
without checking the pair compatibility breaks Selection -> SQL
generation in subtle ways.

## Why a single Coordinator

Two `Coordinator` instances on the same page mean two DuckDB
connections, two dispatcher states, and Selections that don't propagate
between them. The user brushes a histogram, the graph doesn't update,
and both halves of the page render fine in isolation. The bug is
invisible without the Coordinator-multiplication audit.

cosmos-pro's M5 rule and V-data-1 verify check enforce this.

## Why Selections are named and hoisted

A Selection IS state. Inline `Selection.crossfilter()` inside a render
function makes a new instance per render, orphaning the previous one.
The chart appears to render "a selection," but it isn't the one any
other client subscribes to. Hoist Selections to module scope or stable
refs.

## Why MosaicClient and not direct SQL

`MosaicClient.query(filter)` is the contract that lets Mosaic apply
cross-filter logic correctly. Bypassing the client with a raw `await
conn.query(...)` from a UI component breaks the cross-filter graph —
the result doesn't propagate back through Selection updates.
