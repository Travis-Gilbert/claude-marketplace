# Construction phases

Five phases turn a raw graph into a constructed answer. Each phase has
its own visual language, its own cosmos.gl state, and its own user-
interaction rules. The SceneDirective's `construction_phase` field
selects which phase the adapter applies.

The phases are meant to feel like watching an answer build itself.
They are not a dashboard of states the user navigates manually.

## Galaxy

The starting universe. All points visible at low opacity. Simulation
running gently. No filter applied.

- **Visual:** datadot grid behind, faint cosmos.gl points at ~0.4
  opacity, links at near-invisible alpha, gentle drift from the
  simulation.
- **Engine heat:** broad coverage, low intensity (the engine knows
  about all of this but isn't computing anything specific).
- **Text panel:** absent, or showing a generic prompt like "What do
  you want to know?"
- **Duration:** indefinite. The user lingers here until they ask.

## Filter

A question lands. Upstream scene intelligence emits a directive with
`highlight_node_ids` and (often) `dim_node_ids`.

- **Visual:** highlighted nodes pop to full opacity at boosted size;
  dimmed nodes fade to ~0.1 alpha; links dim to near-invisible.
  Galaxy is still visible but de-emphasized.
- **Engine heat:** narrowing — heat coverage shrinks to the
  highlighted region.
- **Text panel:** appearing in a "thinking" state if the LLM is mid-
  generation, or holding off until Build.
- **Duration:** brief, ~300-600ms. The user sees what survived the
  filter without losing context.

## Build

The model becomes specific. The directive resolves to a subgraph,
positions update to just the relevant nodes, edges set to the
active edge layer, camera transitions.

- **Visual:** subgraph in focus; surrounding context fades further
  or hides entirely; cosmos.gl's `fitViewOfPoints` eases the camera
  to the subgraph extent; active edge layer becomes prominent.
- **Engine heat:** focused, intense — the engine is "working on this."
- **Text panel:** revealing partial generation; positioned by the
  TF.js scene composition.
- **Duration:** while the LLM streams. The graph is animated; text
  is animated. Both should feel synchronized to the same answer
  emerging.

## Crystallize

The answer holds still. Simulation damps. Labels appear for the focus
nodes. The text panel finalizes.

- **Visual:** simulation friction goes to 0.3 (settling fast); labels
  fade in for top-K focus nodes (capped at 5000 globally); the graph
  visibly stops moving.
- **Engine heat:** sustained but no longer growing.
- **Text panel:** finalized, full text visible.
- **Duration:** brief, ~600-1000ms. The transition to Explore is the
  user's first interaction.

## Explore

The user takes over. Simulation fully damps. User interactions feed
back into new SceneDirectives via the upstream scene intelligence.

- **Visual:** static unless the user interacts. Click highlights a
  node and shows detail. Drag reshapes. Rectangle-select expands
  neighborhood.
- **Engine heat:** ambient — the engine is listening but not
  composing.
- **Text panel:** present but secondary to the graph.
- **Duration:** until the user asks a follow-up question, which
  emits a new directive and the cycle returns to Filter.

## Pacing

The five phases are not fixed-duration. The directive carries timing
hints (or the upstream module determines them based on data complexity
and LLM streaming rate). cosmos-pro implements the phasing; vie-design
owns the timing language.

Common pacing failures:
- Too fast through Filter — the user doesn't see what was emphasized.
- Too long in Build — the user wonders if it's done.
- No visible Crystallize — Explore arrives without warning, the user
  doesn't know they can interact now.

## Construction-phase rendering rules (summary)

| Phase | Friction | Greyout opacity | Active layer | Camera |
|---|---|---|---|---|
| Galaxy | 0.85 | 0.4 | Default position | Default zoom |
| Filter | 0.85 | 0.15 | Default position | Hold |
| Build | 0.85 | 0.05 | Active position from directive | fitViewOfPoints |
| Crystallize | 0.3 | 0.05 | Active position | Hold |
| Explore | 1.0 | 0.05 | Active position | User-controlled |
