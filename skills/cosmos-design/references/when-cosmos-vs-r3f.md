# When cosmos.gl, when R3F

The renderer choice is determined by the answer type, not by aesthetic
preference. Pick wrong and the user gets either a knowledge graph
shoehorned into a 3D scene or a custom data viz crammed into a
node-link layout.

## The rule

- **Knowledge-graph answers** -> cosmos.gl + vgplot + Mosaic +
  DuckDB-WASM. Sigma 2D as fallback.
- **Custom data-visualization answers** -> R3F + D3 + TF.js scene
  intelligence. Vega-Lite for declarative charts when D3 is overkill.

The SceneDirective's `renderer` field carries the decision. The
upstream classifier (in the Theseus backend) emits the right value
based on the answer type. cosmos-pro renders directives where
`renderer === "cosmos.gl"`; routing for `renderer === "r3f"` belongs
to three-pro.

## What's a knowledge-graph answer

A knowledge-graph answer is one where the structure is the message.
The user is asking "how do these things relate?" or "what cluster is
this in?" or "what are the bridges between these communities?"

Examples:
- "Show me my reading history clustered by topic"
- "What are the connections between AI safety and Bayesian rationality?"
- "Which claims contradict the most other claims I've saved?"
- "What's the path from this idea to that one?"

The answer is fundamentally a graph. cosmos.gl is the right renderer.

## What's a custom data-viz answer

A custom data-viz answer is one where the data SHAPE has its own
visual form that isn't a node-link graph. The structure may be
spatial (geographic, physical), surface-based (heatmap, terrain),
or volumetric.

Examples:
- "Show me NYC taxi pickups by hour as a heatmap surface"
- "Render the Manhattan street grid with annotations"
- "Visualize this terrain model with overlay data"
- "Show this protein structure with ligand binding sites"

The answer is fundamentally a custom visual. R3F is the right renderer.

## What about hybrid answers

Sometimes the answer is "graph in some regions, surface in others."
The classifier will pick a primary renderer; the secondary is rendered
as an embedded view (e.g., a small R3F preview inside a knowledge-
graph answer panel, or vice versa).

cosmos-pro doesn't render embedded R3F views — three-pro does. The
two plugins coordinate via the SceneDirective contract.

## Boundary cases

- **Geographic graphs (e.g., a map of cities with travel routes)** —
  if the geography is the structure, R3F (with d3-geo). If the city
  identity is the structure and geography is just position, cosmos.gl
  with `geogcn_v1` as the position layer.
- **Time-evolving graphs** — cosmos.gl with `spacetime_fusion`
  position. R3F only if the time axis is genuinely 3D (e.g., a
  spiraling timeline as a 3D path).
- **3D embedding visualizations (3D scatter of UMAP)** — R3F. cosmos.gl
  is 2D-only.
- **2D scatter plots** — vgplot. Neither cosmos.gl nor R3F.

## Don't decide aesthetically

"This would look cooler in 3D" is not a reason to pick R3F. Pick the
renderer that best answers the question; vie-design then makes the
chosen renderer beautiful.

If the answer fits cosmos.gl but the user wants a 3D feel, the right
move is to use cosmos.gl with depth-of-field-like color treatment or
parallax effects, not to rebuild as R3F.

## When unsure

Ask: "Is the user asking about RELATIONSHIPS between things, or about
the SHAPE of a thing?" Relationships -> cosmos.gl. Shape -> R3F.
