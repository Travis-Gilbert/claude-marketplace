# Layer taxonomy

The full taxonomy of layers cosmos-pro renders, organized by category
and mapped to the shape of question each combination answers.

This file mirrors the cheatsheet in `cosmos-pro/skills/cosmos-recipes/SKILL.md`.
When this taxonomy changes, both files must change together.

## Position layers

Position layers determine node x/y. Each is precomputed upstream and
stored in `Object.layer_positions[layerName]`.

| Layer | Source | What it shows |
|---|---|---|
| `default_force` | cosmos.gl simulation | Pure topology layout |
| `sbert_umap_v3` | SBERT embedding -> UMAP | Semantic similarity in 2D |
| `kge_umap_v1` | KGE (RotatE/DistMult) -> UMAP | Knowledge-graph embedding similarity |
| `geogcn_v1` | GeoGCN | Geography-aware structural projection |
| `spacetime_fusion` | TGN + SBERT fusion | Time + semantic combined |
| `user_<name>` | User-saved drag-to-reshape | Curated layouts |

Choose Position based on which similarity the user is meant to perceive
spatially. Distance in the rendered view should mean something.

## Weight layers

Weight layers determine node size (and optionally color emphasis). Each
is precomputed upstream and stored in `Object.layer_weights[layerName]`.

| Layer | Source | What it shows |
|---|---|---|
| `personalized_pagerank` | PPR seeded by focus set | Relevance to current question |
| `betweenness_centrality` | Graph centrality | Bridge nodes between communities |
| `leiden_cluster_size` | Leiden community size | Larger clusters = larger nodes |
| `degree` | Raw graph degree | Connection count |
| `custom_<name>` | User-defined | E.g., "marked important" |

Choose Weight to communicate "what matters here." Size is the strongest
visual differentiator after position.

## Edge layers

Edge layers determine which links are drawn. Multi-select; multiple
edge types compose via union with type tagging.

| Layer | Source | What it shows |
|---|---|---|
| `structural` | Direct graph edges | Literal connections |
| `sbert_similarity` | SBERT top-K | Semantic neighbors |
| `kge_similarity` | KGE top-K | Embedding neighbors |
| `nli_agreement` | NLI classifier | Claims that support each other |
| `contradiction` | NLI classifier | Claims that disagree (highlight) |
| `causal` | Causal engine | Explicit causal influence |
| `temporal_precedence` | Temporal events | Followed-by relations |

Choose Edges to answer "which kind of relationship is the user
asking about?" Multi-select makes hybrid views possible (structural
+ NLI agreement = "these claims connect AND agree").

## Question -> composition cheatsheet

| Question | Position | Weight | Edges |
|---|---|---|---|
| Relevance | Default force | Personalized PageRank | Structural |
| Similarity clusters | SBERT | Leiden cluster | SBERT similarity |
| Change over time | Spacetime fusion | PageRank | NLI agreement |
| Outliers | Default force | Betweenness | Contradiction (highlighted) |
| Causality | KGE | Degree | Causal |
| Temporal flow | Spacetime fusion | Degree | Temporal precedence |
| Community structure | SBERT | Leiden cluster size | Structural + NLI agreement |
| Bridges between fields | Default force | Betweenness | Structural |

Add to the cheatsheet when a real task surfaces a new combination
that doesn't fit any row above.

## When the layer doesn't exist

Two cases:

1. **Layer not computed for any object** — the runtime project hasn't
   shipped the layer yet. The picker hides the option or shows it
   disabled with a "coming soon" tooltip. Do NOT silently substitute
   a different layer.
2. **Layer computed for SOME objects but not all** — the renderer
   uses the pending-state visual for the missing ones (see
   `graceful-fallback.md`). The view is still useful; it just
   communicates "we don't have this for these nodes yet."

The runtime project's job is to grow `layer_positions` and
`layer_weights` coverage over time. cosmos-pro's job is to render
gracefully at every coverage level.
