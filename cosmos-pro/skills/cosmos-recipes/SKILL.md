---
name: cosmos-recipes
description: >-
  Bank of runnable annotated cosmos.gl + Mosaic recipes for archetypal design
  questions. Each recipe encodes a tested configuration with tuning notes,
  failure modes, and explicit "when to use" / "when NOT to use" sections.
  Trigger on: "cosmos.gl recipe", "force graph example", "pinned positions",
  "cluster centers", "histogram + graph", "drag to reshape", "rectangle
  selection", "fit view", "loading state", "fallback to 2D", "GPU heatmap
  overlay", "hover detail panel", or any request for a working cosmos.gl
  configuration for a known design pattern.
version: 1.0.0
---

# cosmos.gl recipes

This skill is the bank of working configurations. Each recipe in
`recipes/<name>.md` encodes one archetypal design question, gives the
minimal working code, lists the tuning knobs and failure modes, and ends
with explicit "When to use this" and "When NOT to use this" sections.

If you are about to write a cosmos.gl scene from scratch, stop. Check
whether a recipe already covers the case. Reinventing duplicates work,
fragments style, and creates new bugs.

## How recipes are structured

Every recipe follows this shape, enforced by `/cosmos-critic`:

```
# <recipe name>

One-paragraph description of the use case and why cosmos.gl is right for it.

## Minimal working code
[init + data + config, ~30-80 lines]

## Tuning notes
- Which config keys to adjust for which visual outcome.
- Failure modes at the extremes (too high, too low).
- Common variations.

## When to use this
[explicit list of design questions this recipe answers]

## When NOT to use this
[explicit list of cases where another recipe fits better, or where the
problem is not a knowledge-graph answer at all]
```

Recipes without "When to use" / "When NOT to use" are rejected by the
critic. The two sections are what makes the recipe library useful — they
let Claude pick correctly without re-evaluating every option.

## Recipe index

| Recipe | Question it answers |
|---|---|
| `basic-force-graph.md` | "How do I render this graph at all?" |
| `pinned-layer-positions.md` | "I have SBERT/KGE positions; how do I show them?" |
| `clustering-force.md` | "Show clusters but keep the simulation alive." |
| `mixed-position-weight-edges.md` | "Three pickers compose freely — how?" |
| `dynamic-filtering.md` | "Filter changed; update color/size without rebuilding." |
| `histogram-timeline-brush.md` | "vgplot brushes filter the graph." |
| `gpu-heatmap-overlay.md` | "Density heatmap behind the graph." |
| `hover-detail-panel.md` | "Hover a node, fetch domain object, show detail." |
| `drag-to-reshape.md` | "Let the user nudge clusters; capture as a layer." |
| `selection-rectangle.md` | "Box-select a subgraph; expand neighborhood." |
| `focus-and-fit.md` | "SceneDirective focused some nodes; ease the camera." |
| `empty-state-and-loading.md` | "DuckDB is booting; query is in flight; result is empty." |
| `degraded-fallback-2d.md` | "WebGL unavailable or device weak; switch to Sigma 2D." |

## How to pick a recipe (mental flow)

1. What is the question shape? (Relevance, similarity, change over time,
   outliers, causality.) Map it to layer composition — see
   `references/question-to-layers.md`.
2. Is the user asking about the GRAPH itself, an INTERACTION, an OVERLAY,
   or a STATE (loading/empty/fallback)? That determines which sub-bank
   of recipes applies.
3. Read the matching recipe's "When to use" section and confirm fit.
4. If two recipes look like fits, read both "When NOT to use" sections.
   That's how you choose between them.
5. If no recipe fits, ask whether the request is actually a custom
   data-viz answer (R3F territory, owned by three-pro) rather than a
   knowledge-graph answer.

## Question shape -> layer composition cheatsheet

| Question | Position layer | Weight layer | Edge layer |
|---|---|---|---|
| Relevance | Default force | Personalized PageRank | Structural edges |
| Similarity clusters | SBERT | Leiden cluster | SBERT edges |
| Change over time | Spacetime fusion | PageRank | NLI agreement |
| Outliers | Default force | Betweenness | Contradiction (highlighted) |
| Causality | KGE | Degree | Causal edges |

This is the cheatsheet the architect agent uses. The full taxonomy lives
in `references/layer-taxonomy.md` (and is mirrored in the cosmos-design
chat skill). Add to it whenever a new layer ships in the runtime project.

## Adding a new recipe

When a real task surfaces a pattern not in the library:

1. Implement the task.
2. Extract the minimal code, tuning notes, and failure modes.
3. Write a new file under `recipes/<name>.md` following the shape above.
4. Include both "When to use" and "When NOT to use" sections.
5. Add an index entry to this skill.
6. Add an entry to the question-to-layer cheatsheet if it introduces a
   new layer combination.

The "When NOT to use" section is non-negotiable. Recipes without it pull
Claude into using them in cases they weren't designed for. The negative
boundary is what makes the positive boundary useful.

## Source material — scraping cosmograph.app/dev

The `cosmograph.app/dev/` gallery is the upstream source of recipe
candidates. Scraped examples land in `examples/raw/` (gitignored). Curate
into annotated recipes by:

1. Run the scrape (separate manual step; not part of `install.sh`).
2. Read each scraped example.
3. If it's already covered by an existing recipe, skip.
4. If it's a new pattern, promote: add the "use case", "when to use",
   "when NOT to use", and tuning notes that are missing from the raw
   example.
5. Move (do not copy) into `recipes/`.

Raw scraped examples are NOT recipes until they have the four required
sections.

## VERIFY checks

V-recipes-1. Every file in `recipes/` ends with both "When to use this"
and "When NOT to use this" headed sections.
V-recipes-2. Every cosmos.gl scene Claude writes corresponds to one or
more recipes (or adds a new one before completing the task).
V-recipes-3. The question-to-layer cheatsheet here matches the layer
taxonomy in the cosmos-design chat skill.

## Where to look in refs/

- For recipe code patterns: `refs/cosmos-gl/packages/graph/examples/`
- For Mosaic + vgplot recipes: `refs/mosaic/packages/vgplot/examples/`
- For the upstream cosmos.gl gallery: `https://cosmograph.app/dev/`
  (scrape separately into `examples/raw/`)

## Anti-patterns

- Never write a one-off cosmos.gl scene that duplicates a recipe's
  intent. Use the recipe.
- Never promote a scraped example to a recipe without the four required
  sections.
- Never let the cheatsheet here drift from the chat skill's
  layer-taxonomy reference.
