# Cosmos-Pro Plugin

You have access to cosmos.gl source, the Mosaic + DuckDB-WASM + vgplot stack,
the Theseus SceneDirective contract, and a curated recipe library. Use them.
This plugin owns the knowledge-graph answer renderer path. It does not own
visual identity (vie-design owns tokens, datadots, heat) or 3D custom-viz
answer scenes (three-pro / animation-pro own R3F).

## Default entry point: `/cosmos-pro:cosmos`

When the user's task is open-ended, route through `/cosmos-pro:cosmos`
(the hub command). It reads `AGENTS.md` to map task signals to the right
agent + skill + recipe + refs bundle. It also reads
`knowledge/claims.jsonl` BEFORE routing and surfaces high-confidence
claims (`> 0.8`) as hard stops — this is how the plugin avoids
re-litigating recurring pain like hardcoded colors.

The compound learning loop is `/cosmos-pro:learn`. Run it at the end of
a substantial work session. See `patterns/PATTERNS-compound-learning.md`
for the full pattern.

## Pipeline truth (read this first)

```
TF.js (upstream, backend-fed)
  -> SceneDirective + layer_positions JSON
    -> DuckDB-WASM
      -> Mosaic coordinator + Selections
        -> vgplot (histograms, timelines, brushes)
        -> cosmos.gl/graph (WebGL force-directed renderer)
```

R3F is NOT in this path. R3F renders custom data-viz answer models
(NYC taxi heatmap archetype, geographic surfaces, genuinely 3D scenes).
For the knowledge-graph answer type, which is the default answer mode,
the renderer is cosmos.gl. Never render a knowledge-graph answer through
R3F. Never render a custom data-viz answer through cosmos.gl.

## Ownership boundaries (route correctly)

- vie-design owns: visual identity, tokens, datadot substrate, engine heat,
  construction phasing visual language, text-answer panel placement,
  Mantine material vocabulary.
- cosmos-pro owns: cosmos.gl configuration, Mosaic coordinator wiring,
  DuckDB-WASM loading, vgplot chart authoring, SceneDirective ->
  cosmos.gl adapter logic, the three-picker ControlDock, graceful fallback
  rules for missing layer data.
- d3-pro owns: D3 modules used upstream in TF.js layer computation
  (force, hierarchy, scale, delaunay, contour). cosmos.gl is NOT a D3
  replacement; D3 still computes layer positions that get stored in
  `Object.layer_positions`.
- three-pro / animation-pro own: R3F scenes for genuinely 3D answers.

When unsure which plugin owns a task:
"Does this touch cosmos.gl config, Mosaic SQL, vgplot, or DuckDB loading?
-> cosmos-pro. Does it touch tokens, datadots, heat, feel? -> vie-design.
Does it compute a layout that becomes `layer_positions`? -> d3-pro. Is the
answer an R3F scene? -> three-pro."

## When you start a cosmos-pro task

1. Identify the question shape (Relevance? Similarity clusters? Change?
   Outliers? Causality?). Skill `cosmos-recipes` maps question shapes to
   layer compositions.
2. Read the matching recipe in `recipes/`. Recipes encode tested
   configurations. Do not reinvent.
3. Grep `refs/cosmos-gl/` for any cosmos.gl API you intend to call.
   Verify against source, not training memory. Cosmos.gl v2 changed many
   APIs from v1 (data-update surface is now `setPointPositions` /
   `setLinks` / `setPointColors` / `setPointSizes` / `setLinkColors` /
   `setLinkWidths`, NOT `setData`).
4. If touching the data layer, read `skills/cosmos-mosaic-duckdb/SKILL.md`
   first. A single Mosaic Coordinator per page is non-negotiable.
5. If translating SceneDirectives, read
   `skills/cosmos-scene-directive/SKILL.md` and the contract in
   `refs/theseus-viz-types/SceneDirective.ts`.
6. If perf is in question, read `skills/cosmos-performance/SKILL.md`
   before adjusting anything. Most cosmos.gl bugs are perf bugs dressed
   as visual bugs.
7. Run `/cosmos-critic` after every change to files in
   `src/components/theseus/explorer/` or `src/lib/theseus-viz/`.

## Source references (grep these, do not paraphrase)

- `refs/cosmos-gl/` — cosmos.gl/graph engine source, pinned to the
  version in the runtime project's package.json.
- `refs/mosaic/` — Mosaic core, sql, vgplot from `uwdata/mosaic`.
- `refs/duckdb-wasm/` — DuckDB-WASM TypeScript source pinned to 1.32.0.
- `refs/theseus-viz-types/` — synced copy of
  `src/lib/theseus-viz/SceneDirective.ts` from the runtime project. The
  contract Claude Code must never violate.

If `refs/` is empty, run `install.sh` first. Do not improvise an API.

## Recipe library

Recipes live in `recipes/`. Each recipe answers one archetypal design
question and ends with "When to use this" and "When NOT to use this"
sections. If a new task duplicates an existing recipe's intent but
reinvents the structure, stop and use the recipe. If no recipe fits,
add one before shipping the work.

Active recipes:
- `basic-force-graph.md` — vanilla setup
- `pinned-layer-positions.md` — render precomputed layer positions
- `clustering-force.md` — combine cluster centers with simulation
- `mixed-position-weight-edges.md` — three-picker compositions
- `dynamic-filtering.md` — Mosaic Selections drive color/size updates
- `histogram-timeline-brush.md` — vgplot + cosmos.gl cross-filtering
- `gpu-heatmap-overlay.md` — luma.gl density layer behind the graph
- `hover-detail-panel.md` — index resolution, async-safe
- `drag-to-reshape.md` — capture user-defined layer positions
- `selection-rectangle.md` — subgraph workflow
- `focus-and-fit.md` — camera ease-in for SceneDirective focus
- `empty-state-and-loading.md` — what to render while DuckDB boots
- `degraded-fallback-2d.md` — Sigma/Graphology handoff

## Templates

Starter implementations live in `templates/`:
- `CosmosGraphClient.ts` — `MosaicClient` that owns a cosmos.gl `Graph`
- `duckdb-setup.ts` — pinned DuckDB-WASM init with worker bundle
- `mosaic-provider.tsx` — React provider for the shared `Coordinator`
- `applyDirective.ts` — SceneDirective -> cosmos.gl adapter

Copy and adapt. Do not import from templates at runtime.

## Deviation guards (MUST / MUST NOT)

The full guard set lives in `skills/cosmos-foundations/SKILL.md` and
the per-skill VERIFY checks. The most expensive ones to violate:

MUST:
- M1. Grep `refs/cosmos-gl/` before answering any API question.
- M2. Use `setConfigPartial` for updates after init; only `setConfig`
  for the initial configuration.
- M3. Verify Float32Array invariants
  (`pointPositions.length === 2 * pointCount`,
   `links.length === 2 * linkCount`) before any setter call.
- M4. Use VIE CSS variables for all colors passed into cosmos.gl
  color arrays. Convert via
  `getComputedStyle(document.documentElement).getPropertyValue(...)`.
- M5. Share a single Mosaic `Coordinator` across all clients on a page.
- M6. Route every SceneDirective through `applyDirective`; never call
  cosmos.gl setters directly from UI components.
- M7. Implement the pending-state visual for any point missing
  active-layer data. Never drop points.
- M8. Call `graph.destroy()` in the effect cleanup of every component
  that owns a cosmos.gl `Graph` instance.

MUST NOT:
- N1. Import from `@cosmograph/react` or `@cosmograph/cosmograph`.
  Use `@cosmos.gl/graph` directly.
- N2. Hardcode colors, sizes, or shadow values. Pull from VIE tokens.
- N3. Create a second cosmos.gl `Graph` instance without destroying
  the first.
- N4. Render more than 5000 labels simultaneously.
- N5. Allocate `Float32Array` inside per-frame update loops. Allocate
  once per data-size bucket; mutate in place.
- N6. Change `enableSimulation`, `initialZoomLevel`, `randomSeed`, or
  `attribution` after init. If a change is required, destroy and
  recreate the graph.
- N7. Use vgplot for custom D3 visualizations. vgplot is for standard
  Mosaic-bound charts only.
- N8. Bypass the SceneDirective contract. Every visual state in the
  canvas must correspond to a directive that produced it.

IF CONFLICT:
- When a cosmos.gl performance requirement conflicts with a VIE visual
  requirement (e.g., "every point has its own label" violates N4), the
  performance constraint wins. The visual design must adapt (e.g., label
  only the top-K). This is the one case where cosmos-pro overrides
  vie-design.

## Verify checks Claude Code runs after work

- V1. After any change to a file in `src/components/theseus/explorer/`
  or `src/lib/theseus-viz/`, invoke `/cosmos-critic`.
- V2. After any change to `package.json` dependencies touching cosmos,
  mosaic, duckdb, or luma, run `npm run build` and report the result.
- V3. After adding a new recipe, verify it ends with "When to use this"
  and "When NOT to use this" sections.
