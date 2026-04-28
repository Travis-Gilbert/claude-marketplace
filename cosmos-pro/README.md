# cosmos-pro

Claude Code plugin for designing and building knowledge-graph answer
experiences with cosmos.gl on top of DuckDB-WASM, Mosaic, and vgplot.

Sister plugins:
- **vie-design** — visual identity, tokens, datadots, engine heat
- **d3-pro** — D3 modules used upstream to compute `layer_positions`
- **three-pro / animation-pro** — R3F scenes for genuinely 3D answers
- **cosmos-design** (chat skill) — Claude.ai planning companion

## What this plugin does

cosmos-pro is the implementation half of the cosmos.gl path. It produces
real code: cosmos.gl configurations, Mosaic clients, vgplot specs, and
SceneDirective adapters. It does NOT plan visual identity, choose tokens,
or design construction phasing aesthetics — that's vie-design's job.

The pipeline cosmos-pro implements:

```
TF.js (upstream, backend-fed)
  -> SceneDirective + layer_positions JSON
    -> DuckDB-WASM
      -> Mosaic coordinator + Selections
        -> vgplot (histograms, timelines, brushes)
        -> cosmos.gl/graph (WebGL force-directed renderer)
```

## Components

### Skills (5)

- **cosmos-foundations** — cosmos.gl v2 API, data contract, init-only fields,
  `setConfig` vs `setConfigPartial`, point shapes, event model.
- **cosmos-mosaic-duckdb** — DuckDB-WASM init, Mosaic coordinator + Selections,
  `MosaicClient` subclassing, vgplot grammar, the binding model.
- **cosmos-recipes** — bank of runnable annotated recipes for common design
  questions. Each recipe ends with "When to use" and "When NOT to use."
- **cosmos-scene-directive** — the SceneDirective contract and the
  `applyDirective` adapter. Construction phases (Galaxy, Filter, Build,
  Crystallize, Explore) and pending-state fallback rules.
- **cosmos-performance** — Float32Array discipline, label budgeting, simulation
  warmup, GPU memory budget, capability detection, instance lifecycle.

### Agents (5)

- **cosmos-architect** — plans a scene from a problem description. Refuses to
  plan until 3 questions are answered (question shape, upstream data, view scope).
- **cosmos-data** — wires DuckDB + Mosaic + table schemas + Selection graph.
- **cosmos-render** — writes cosmos.gl config, `CosmosGraphClient`,
  `applyDirective`.
- **cosmos-chart** — authors a single vgplot chart bound to a named Selection.
- **cosmos-critic** — reviews work after implementation; runs all VERIFY checks.

### Recipes (13)

The "goldmine." Each recipe is a runnable example tied to one archetypal
design question, with tuning notes and failure modes.

### Templates (4)

Starter implementations: `CosmosGraphClient.ts`, `duckdb-setup.ts`,
`mosaic-provider.tsx`, `applyDirective.ts`. Copy and adapt; do not import
from templates at runtime.

### References (cloned at install time)

- `refs/cosmos-gl/` — cosmos.gl/graph engine source, pinned.
- `refs/mosaic/` — Mosaic core/sql/vgplot from uwdata/mosaic.
- `refs/duckdb-wasm/` — DuckDB-WASM TypeScript source pinned to 1.32.0.
- `refs/theseus-viz-types/` — synced copy of the SceneDirective contract.

### Chat skill

`chat-skill/SKILL.md` is the Claude.ai planning companion (`cosmos-design`).
It is mirrored to `codex-plugins/skills/cosmos-design/` by `sync-plugins.sh`
so both surfaces stay in sync.

## Install

```bash
cd codex-plugins/cosmos-pro
./install.sh        # clones refs/ from cosmos.gl, mosaic, duckdb-wasm
```

The script clones at the version pins documented in `install.sh`. Do not
upgrade pins without checking compat with the runtime project.

## Architectural rules

The full guard set is in `CLAUDE.md`. Highlights:

- ALWAYS import from `@cosmos.gl/graph` directly. NEVER use the
  `@cosmograph/react` branded wrapper.
- ALWAYS share a single Mosaic `Coordinator` across all clients on a page.
- ALWAYS route SceneDirectives through `applyDirective`. Never call cosmos.gl
  setters directly from UI components.
- ALWAYS implement the pending-state visual for points missing active-layer
  data. Never drop points.
- NEVER render more than 5000 labels simultaneously.
- NEVER hardcode colors, sizes, or shadows. Pull from VIE tokens.

## Slash commands

**Hub commands** (start here for open-ended tasks):
- `/cosmos-pro:cosmos <task>` — routing hub; reads `AGENTS.md`, surfaces
  high-confidence claims as hard stops, dispatches to the right specialist
- `/cosmos-pro:learn` — compound learning loop; saves the session, runs
  Bayesian confidence updates on `knowledge/claims.jsonl`, presents the
  review queue

**Specialist agents** (invoke directly when you know the task type):
- `/cosmos-architect` — plan a scene
- `/cosmos-data` — wire the data layer
- `/cosmos-render` — write the renderer
- `/cosmos-chart` — author a vgplot chart
- `/cosmos-critic` — review after implementation

## Compound learning

The plugin learns from every session. `knowledge/claims.jsonl` ships
with 12 seed claims (high-confidence rules from the spec, including
the color-discipline rule that bites this project repeatedly). The
hub command surfaces relevant claims as hard stops before routing.

After a substantial session, run `/cosmos-pro:learn` to:
1. Save a session log to `knowledge/session_log/`
2. Apply Bayesian updates (alpha for accepted suggestions, beta for
   rejected) and temporal decay (every 30 days)
3. Review auto-captured claims, new tensions, and attention items
4. Print a one-line stats summary

See `patterns/PATTERNS-compound-learning.md` for the full pattern.

## Why this exists as its own plugin

vie-design owns the visual identity of Theseus. Mixing cosmos.gl + Mosaic +
DuckDB + vgplot domain knowledge into vie-design would bloat that plugin
past its visual-judgment remit. d3-pro already exists for D3 chart grammar;
cosmos-pro is its analog for the cosmos.gl/Mosaic stack.

The first real job once installed: drive the migration from
`@cosmograph/react` to `@cosmos.gl/graph` and fill in the explorer
chart skeletons (`GraphHistogram.tsx`, `GraphTimeline.tsx`,
`GraphSearch.tsx`).
