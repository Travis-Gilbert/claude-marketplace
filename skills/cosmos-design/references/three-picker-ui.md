# The three-picker ControlDock

Theseus's primary cosmos.gl exploration UI is the ControlDock with
three independent pickers: Position, Weight, Edges. The pickers
compose freely; any combination is valid.

## The pickers

### Position
Which layer determines node x/y. Choices:
- Default force (vanilla simulation, no pinned positions)
- SBERT UMAP (semantic embedding projection)
- KGE UMAP (knowledge-graph embedding projection)
- GeoGCN (geographic graph convolutional network projection)
- Spacetime fusion (combined temporal + semantic)
- User-saved layouts (from drag-to-reshape)

### Weight
Which layer determines node size and (optionally) color emphasis.
Choices:
- Personalized PageRank (relevance to a focus set)
- Betweenness centrality (bridge nodes)
- Leiden cluster size (membership cardinality)
- Degree (raw connection count)
- Custom user-defined weight (e.g., "I marked these as important")

### Edges
Which edge sets to draw. Multi-select. Choices:
- Structural (literal links from the graph)
- SBERT similarity (top-K semantic neighbors)
- KGE similarity (top-K embedding neighbors)
- NLI agreement (claims that support each other)
- Contradiction (claims that disagree — usually highlighted)
- Causal (explicit causal edges)
- Temporal precedence (followed-by edges)

## Why three pickers and not one

A single "view preset" picker would force the user into curated
combinations. Three independent pickers let the user ask:

- "What does this look like under SBERT positions but Leiden cluster
  sizes?" (similarity layout, community emphasis)
- "What does it look like under default force but Personalized PageRank
  size and contradiction edges?" (structural layout, with contested
  claims popping out)
- "What does it look like under spacetime fusion with degree weights
  and temporal edges?" (timeline view, broad-impact nodes prominent)

Each combination answers a different shape of question. Constraining
to presets pre-decides the question.

## Picker UI design

The ControlDock is a vie-design surface — vie owns the visual. The
cosmos-pro skill covers the data-side requirements:

- The picker UI must show which combinations are sensible (e.g., "KGE
  positions + Structural edges" might produce edges that don't follow
  the spatial proximity, which is fine but worth surfacing).
- Each picker is a separate Mosaic Selection. Position picker
  publishes to `positionFilter`, etc.
- Active edge layers are an array, not a single value — the data
  layer queries multiple edge tables and unions the results.
- A "preset" button is acceptable as a shortcut (e.g., "Galaxy view"
  applies a known good combination), but it must just set the three
  pickers, not bypass them.

## When the picker doesn't apply

- If the runtime project only has one position layer computed, the
  Position picker is degenerate. Hide it or show it disabled.
- If the view is an answer to a specific question (not exploratory),
  the architect picks the composition, not the user. The pickers
  may still be present but pre-set.
- If the user is on mobile, the ControlDock becomes a sheet
  (vaul-style drawer). Interaction patterns differ but the data
  model is the same.

## Failure modes to avoid

- Combinations that produce no rendering. A picker setting must
  always result in SOMETHING on screen, even if it's mostly pending
  state.
- Surprising defaults. The first-load picker setting should be the
  "Galaxy view" preset, not the user's last-session state, until
  the user explicitly saves their default.
- Cascade resets. Changing the Position picker should not reset the
  Weight or Edges pickers — they're independent.
