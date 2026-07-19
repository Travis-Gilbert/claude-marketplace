---
name: graph_theorem
description: Query and traverse the Theorem-side graph through the theorems-harness native MCP. Use when the user asks to find neighbors of a node, run PPR / PageRank / community detection, search by vector + BM25, or query the graph schema. Triggers on phrases like "find connections", "graph neighbors", "PPR from", "PageRank", "communities", "search the graph", "vector search", "fulltext search", "graph schema".
---

# graph_theorem

Orchestration skill for graph queries that route directly to the native
`theorems-harness` MCP. Pure-graph reads skip Python and local Node routing:
the agent calls `mcp__theorems-harness__*` and gets Rust-native latency.

## When to use

User asks about graph structure / similarity / traversal:
- "What's connected to object 42?"
- "Run PPR from seed PKs [100, 200, 300] and give me top-20."
- "Find communities in the tenant graph."
- "Vector search the knowledge graph for X with k=5."
- "What labels and edge types exist in this graph?"

Not for: code-context investigation (use `compute_code`), code ingest/reindex
(use `code_ingest`), or harness run state (use the typed run query/replay
surface).

## Tools owned (theorems-harness MCP, native Rust)

| Verb | Purpose |
|---|---|
| `mcp__theorems-harness__rustyred_thg_graph_neighbors` | Adjacency lookup: in/out edges of a node, optionally filtered by edge_type |
| `mcp__theorems-harness__rustyred_thg_graph_query` | Bounded query: `node_match` (exact scalar) or `neighbors` operations |
| `mcp__theorems-harness__rustyred_thg_graph_explain` | Query plan without execution (read-only diagnostic) |
| `mcp__theorems-harness__rustyred_thg_graph_schema` | Labels, edge types, stats, capability notes |
| `mcp__theorems-harness__rustyred_thg_graph_index_status` | Health of indexes (HNSW, BM25, H3) |
| `mcp__theorems-harness__rustyred_thg_algorithm_ppr` | Personalized PageRank (seed-driven walk) |
| `mcp__theorems-harness__rustyred_thg_algorithm_pagerank` | Global PageRank |
| `mcp__theorems-harness__rustyred_thg_algorithm_components` | Connected components |
| `mcp__theorems-harness__rustyred_thg_algorithm_communities` | Label-propagation community detection |
| `mcp__theorems-harness__rustyred_thg_fulltext_search` | BM25 search on a designated property |
| `mcp__theorems-harness__rustyred_thg_spatial_radius` | H3 radius search |
| `mcp__theorems-harness__rustyred_thg_spatial_bbox` | H3 bounding-box search |
| `mcp__theorems-harness__rustyred_thg_vector_search` | HNSW vector similarity (top-k by cosine) |
| `mcp__theorems-harness__rustyred_thg_vector_hybrid` | Hybrid scoring: vector + graph proximity |

## Tenant scoping

All queries are tenant-scoped. The `tenant` argument defaults to `public` on the Theorem-side RustyRed deployment. For multi-tenant work, pass the explicit tenant id.

## Standard patterns

**Find what X is connected to:**
```
mcp__theorems-harness__rustyred_thg_graph_neighbors(node_id="42", direction="out")
```

**Find structurally-relevant objects from seeds:**
```
mcp__theorems-harness__rustyred_thg_algorithm_ppr(seeds={"100": 1.0, "200": 1.0}, alpha=0.15, top_k=20)
```

**Hybrid retrieval (semantic + graph-proximity):**
```
mcp__theorems-harness__rustyred_thg_vector_hybrid(
    property="embedding_global",
    query=<embedding vector>,
    graph_seeds=["100", "200"],
    k=10,
)
```

**Cluster the graph:**
```
mcp__theorems-harness__rustyred_thg_algorithm_communities()
```

**Schema introspection (before designing a query):**
```
mcp__theorems-harness__rustyred_thg_graph_schema()  # returns labels, edge types, stats
mcp__theorems-harness__rustyred_thg_graph_index_status()  # check before relying on HNSW / BM25 / H3
```

## Output discipline

- Always cite node IDs and scores numerically from the tool output, not paraphrased.
- For PPR / PageRank, list (id, score) pairs sorted by score; flag the top decile vs the long tail.
- For community detection, name communities by ID + size; surface bridging nodes (high betweenness) if present.

## Anti-patterns

- Don't use these for arbitrary graph writes. Use the named native write tool for the operation you need, and prefer read tools when the user is asking for graph state.
- Don't query without checking `rustyred_thg_graph_schema` first when the data shape is unclear. Better to spend one schema call than to issue blind queries.
- Don't use the deprecated `theorem_thg_command` / `theorem_thg_cypher` wrappers. Skip directly to the `theorems-harness` MCP.

## Auth

The native MCP requires a Bearer token for authenticated writes. The MCP client config injects `THEOREM_HARNESS_API_TOKEN` at runtime.

## Native dispatch reference

PPR specifically (`rustyred_thg_algorithm_ppr`) is hot: its 50-400x speed advantage over Python comes from the Rust ACL local-push implementation. If you see Theorem-MCP tools' `fractal_expansion` logging the FALLBACK warning, the Python wheel is missing in that container; this skill's direct-to-rust path doesn't suffer that bug because there's no Python in the loop.
