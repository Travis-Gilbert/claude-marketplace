# Cosmos-Pro routing table

The `/cosmos-pro:cosmos` hub command reads this file to decide which agent
and which skill to load. Each row maps a task signal to a bundle:
(primary agent, co-agents, skills to load, recipes to consult, refs to grep).

This table supplements the agents' own descriptions; when an agent's
description says "trigger on X", that's the truth, this table is the
shortcut.

## Routing table

### Plan a scene

- **Signals:** "plan a cosmos.gl scene", "design this graph view",
  "what view should I build", "knowledge graph view of", "explorer
  screen for", any open-ended cosmos.gl design request.
- **Primary agent:** `cosmos-architect`
- **Co-agents:** none up front; the architect delegates to data/render/chart
  after the plan lands
- **Skills:** `cosmos-recipes` (for the question-shape → layer cheatsheet),
  `cosmos-scene-directive` (for the construction phasing language)
- **Recipes:** all recipes in `recipes/` are candidates; the architect picks
  one as baseline
- **Refs:** none required at planning time, but the architect must verify
  upstream data exists before producing a plan

### Wire the data layer

- **Signals:** "set up DuckDB", "wire Mosaic", "Coordinator", "Selection
  graph", "table schemas", "MosaicClient", "register Parquet"
- **Primary agent:** `cosmos-data`
- **Co-agents:** `cosmos-architect` if no plan exists yet
- **Skills:** `cosmos-mosaic-duckdb`
- **Templates:** `templates/duckdb-setup.ts`, `templates/mosaic-provider.tsx`,
  `templates/CosmosGraphClient.ts`
- **Refs:** `refs/duckdb-wasm/`, `refs/mosaic/packages/core/`,
  `refs/mosaic/packages/sql/`

### Implement the renderer

- **Signals:** "implement the renderer", "write CosmosGraphCanvas",
  "applyDirective", "@cosmos.gl/graph", "force-directed", "setPointPositions",
  "setLinks", "setConfig", "setConfigPartial"
- **Primary agent:** `cosmos-render`
- **Co-agents:** `cosmos-data` if data layer not yet wired
- **Skills:** `cosmos-foundations`, `cosmos-scene-directive`,
  `cosmos-performance`
- **Templates:** `templates/CosmosGraphClient.ts`, `templates/applyDirective.ts`
- **Refs:** `refs/cosmos-gl/src/`, `refs/theseus-viz-types/SceneDirective.ts`
- **Hard stops (read claims first):** color discipline (M4/N2), Float32Array
  reuse (V-perf-2), `setConfig` vs `setConfigPartial` (V-foundations-3),
  `graph.destroy()` in cleanup (M8)

### Author a chart

- **Signals:** "vgplot chart", "histogram", "timeline brush",
  "GraphHistogram", "GraphTimeline", "GraphSearch", "intervalX", "intervalY",
  "rectY", "areaY", "dot plot"
- **Primary agent:** `cosmos-chart`
- **Co-agents:** `cosmos-data` if a new Selection or column is needed
- **Skills:** `cosmos-mosaic-duckdb`
- **Recipes:** `recipes/histogram-timeline-brush.md`,
  `recipes/dynamic-filtering.md`
- **Refs:** `refs/mosaic/packages/vgplot/`

### Review work

- **Signals:** "review", "audit", "lint", "verify", "cosmos-critic",
  "performance check", "after change to explorer"
- **Primary agent:** `cosmos-critic`
- **Co-agents:** none
- **Skills:** all five (the critic runs every VERIFY suite)
- **Refs:** as needed by each VERIFY check
- **Auto-trigger:** any change to
  `src/components/theseus/explorer/` or `src/lib/theseus-viz/` (V1)

### Color / token discipline (high-frequency pain point)

- **Signals:** "color", "token", "hardcoded color", "VIE variable",
  "rgba", "linkDefaultColor", "pointDefaultColor", "hex"
- **Primary agent:** `cosmos-render`
- **Hard stop:** Read `knowledge/claims.jsonl` for any claim about color
  discipline FIRST. Never write a hardcoded color triplet. Pull from
  `var(--cp-*)` via `cssVarToRgba` helper (in `templates/applyDirective.ts`).
  vie-design owns the token names.
- **Recipe:** every recipe references VIE tokens; treat hardcoded colors
  as an automatic critic failure (M4/N2).

### Performance / smoothness

- **Signals:** "janky", "slow graph", "missing nodes", "flashing colors",
  "leak", "GPU memory", "iOS crash", "Android low-end"
- **Primary agent:** `cosmos-render`, then `cosmos-critic`
- **Skills:** `cosmos-performance`
- **Diagnostic order:** Float32Array allocation in hot path → setter call
  granularity → label cap → simulation warmup → capability check → instance
  lifecycle (`graph.destroy()`)

### WebGL capability / fallback

- **Signals:** "WebGL fallback", "Sigma 2D", "iOS Safari", "EXT_float_blend",
  "OES_texture_float", "low-end Android", "doesn't render on this device"
- **Recipes:** `recipes/degraded-fallback-2d.md`
- **Primary agent:** `cosmos-render`
- **Skills:** `cosmos-performance`

### Loading / empty / error states

- **Signals:** "loading", "empty state", "error state", "DuckDB booting",
  "no rows match"
- **Recipes:** `recipes/empty-state-and-loading.md`
- **Primary agent:** `cosmos-render`

### "What does cosmos.gl support?" (foundational API question)

- **Signals:** "v2 vs v1", "setConfig vs setConfigPartial", "what setters
  exist", "PointShape", "init-only fields"
- **Skills:** `cosmos-foundations`
- **Action:** grep `refs/cosmos-gl/` first, then answer. Never paraphrase
  from training data.

## When the routing table doesn't fit

Two cases:

1. **The task is outside cosmos-pro's remit.** Route to the right plugin
   and stop:
   - Visual identity, tokens, feel → vie-design
   - D3 layout computation upstream → d3-pro
   - R3F 3D scenes → three-pro
   - Animation timing → animation-pro
   - React internals, Next.js routing → js-pro / next-pro
   - Backend reasoning, KG embeddings → theseus-pro

2. **The task is genuinely new (no row matches).** Ask the user to
   clarify which surface area is involved (data, renderer, chart, scene
   intelligence, fallback, or none of those). After the answer, add a
   row to this table so the next session doesn't re-ask.
