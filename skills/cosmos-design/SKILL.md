---
name: cosmos-design
description: Visual planning partner for cosmos.gl + Mosaic + DuckDB-WASM + vgplot. Use when planning knowledge-graph answer experiences, choosing layer compositions, designing the Position/Weight/Edges picker UI, planning construction sequences (Galaxy, Filter, Build, Crystallize, Explore), or deciding between cosmos.gl and R3F for an answer. Triggers on "cosmos.gl", "cosmosgl", "cosmograph", "force graph", "WebGL graph", "Mosaic DuckDB", "vgplot", "how should this graph look", "histogram brush", "cross-filter graph", "knowledge graph view", "galaxy view", "what view should I build", "plan this cosmos.gl scene", "which layer", "position vs weight vs edges", "SceneDirective", "construction sequence for". Does NOT trigger on plain "graph" (too broad), plain "D3" (use d3-pro), plain "3D" (use three-design). Produces handoff documents for Claude Code with the cosmos-pro plugin.
---

# Cosmos Design Partner

Plan knowledge-graph answer scenes for Theseus using the cosmos.gl +
Mosaic + DuckDB-WASM + vgplot stack. This skill produces the design,
not the code; Claude Code with the `cosmos-pro` plugin executes the
plan.

## When to use this skill

Trigger on: knowledge-graph answer planning, layer composition questions,
ControlDock UI decisions, construction-sequence pacing, the
cosmos.gl-vs-R3F decision, or Mosaic cross-filter wiring. Do NOT
trigger on: plain D3 grammar (use d3-pro), plain 3D scenes (use
three-design), or pure visual identity questions (use vie-design).

## Mental model (one paragraph)

cosmos.gl is a GPU force-simulation engine. It owns Float32Arrays. It
takes a SceneDirective from upstream scene intelligence and renders it.
DuckDB-WASM holds the data. Mosaic is the cross-filter coordinator.
vgplot is the chart grammar. The four pieces are siblings; everything
flows through Mosaic Selections. cosmos.gl is NOT R3F — it does not
render 3D scenes. R3F is the right renderer for genuinely 3D answers
(NYC taxi heatmap surface, geographic flythroughs); cosmos.gl is the
right renderer for knowledge-graph answers, which is the default
answer mode.

## Design process

For every cosmos.gl design request, work through these questions in
order:

1. **What question is the user asking?** (Relevance? Similarity
   clusters? Change over time? Outliers? Causality?) See
   `references/layer-taxonomy.md` for the question-shape map.
2. **Which layer composition answers it?** Position, Weight, Edges —
   each independent. See `references/three-picker-ui.md` for the
   ControlDock model.
3. **What construction sequence makes it feel like an answer, not a
   dashboard?** Galaxy -> Filter -> Build -> Crystallize -> Explore.
   See `references/construction-phases.md`.
4. **What does the user interact with?** Brush a histogram? Click a
   node? Drag to reshape? Rectangle-select? Each interaction maps to
   a recipe in cosmos-pro.
5. **What is the data state?** All layers populated? Some pending?
   See `references/graceful-fallback.md` for the pending-state visual
   language.
6. **Is this even a cosmos.gl answer, or should it be R3F?** See
   `references/when-cosmos-vs-r3f.md`.

## Pipeline (read once)

See `references/mosaic-stack.md` for the full diagram and the
ownership boundaries between cosmos-pro, vie-design, d3-pro, and
three-pro.

```
TF.js (upstream, backend-fed)
  -> SceneDirective + layer_positions JSON
    -> DuckDB-WASM
      -> Mosaic coordinator + Selections
        -> vgplot (histograms, timelines, brushes)
        -> cosmos.gl/graph (WebGL force-directed renderer)
```

## Cross-plugin delegation

When the design needs work outside cosmos-pro's remit:

- **vie-design** — visual identity, tokens, datadot substrate, engine
  heat, construction-phasing aesthetics, text-answer panel placement,
  Mantine vocabulary. Always consult vie-design for the "feel" decisions.
- **three-design / animation-design** — R3F scenes for genuinely 3D
  answers. If the answer needs spatial 3D (heatmap surfaces, geographic
  flythroughs, Three.js scenes), route there.
- **d3-pro** — D3 modules used upstream to compute `layer_positions`
  (force, hierarchy, scale, delaunay, contour). D3 produces the layer;
  cosmos.gl renders it.
- **next-design / app-design** — page architecture, route structure,
  app-shell concerns.

## Output: handoff document for Claude Code

Produce a structured plan that cosmos-architect (in Claude Code) can
consume directly:

```
# Cosmos Scene Plan: <name>

## Question
<the primary question this view answers>

## View scope
Galaxy / Filtered answer / Hybrid

## Layer composition
- Position: <layer name> (rationale)
- Weight: <layer name> (rationale)
- Edges: <layer name(s)> (rationale)

## Recipe baseline
<recipe filename in cosmos-pro/recipes/> — adapted for <specifics>

## Mosaic Selections
| Name | Type | Published by | Consumed by |
|---|---|---|---|

## vgplot charts
| Chart | Type | Table.column | Publishes | Filters by |
|---|---|---|---|---|

## SceneDirective phasing
- Galaxy: <what user sees first>
- Filter: <emphasis logic>
- Build: <subgraph composition>
- Crystallize: <transition trigger>
- Explore: <interaction handlers>

## Pending state
<which points/layers might be missing data; how the pending visual handles it>

## Visual identity
- Token references (consult vie-design for token names)
- Engine heat coverage per phase
- Datadot grid state per phase

## Open questions
<anything still unresolved>
```

## Hard rules (mirrors cosmos-pro CLAUDE.md guards)

- Always import from `@cosmos.gl/graph`, never from
  `@cosmograph/react` or `@cosmograph/cosmograph`.
- One Mosaic Coordinator per page. Selections are named, hoisted,
  shared.
- SceneDirective is the contract. UI never calls cosmos.gl setters
  directly — everything flows through `applyDirective`.
- Pending state for missing layer data. Never drop points.
- Max 5000 labels simultaneously. Performance always wins over the
  "every node has its own label" visual wish.
- Colors come from VIE CSS variables. No hardcoded hex.
- vgplot for standard Mosaic-bound charts only. Custom layouts go
  through D3 (d3-pro) or a custom MosaicClient.

## Reference files

- `references/cosmos-mental-model.md` — how to think about cosmos.gl
  as a GPU force engine, not a chart library.
- `references/mosaic-stack.md` — the full pipeline diagram and the
  ownership map.
- `references/three-picker-ui.md` — the ControlDock architecture.
- `references/layer-taxonomy.md` — the full taxonomy of position /
  weight / edge layers and their question-shape mappings.
- `references/construction-phases.md` — Galaxy / Filter / Build /
  Crystallize / Explore in detail.
- `references/when-cosmos-vs-r3f.md` — the decision rule for choosing
  the right renderer.
- `references/graceful-fallback.md` — pending-state visual language
  and the 2D Sigma fallback trigger.
