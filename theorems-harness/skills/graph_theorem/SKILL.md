---
name: graph_theorem
description: Query and traverse the Theorem-side RustyRed graph via the rustyred-thg native MCP. Use when the user asks to find neighbors of a node, run PPR / PageRank / community detection, search by vector + BM25, or query the graph schema. Triggers on phrases like "find connections", "graph neighbors", "PPR from", "PageRank", "communities", "search the graph", "vector search", "fulltext search", "graph schema".
---

# graph_theorem

Orchestration skill for graph queries that route DIRECTLY to the RustyRed-THG native MCP. Pure-graph reads skip the Python middleman entirely: agent calls `mcp__rustyred-thg__*` and gets Rust-native latency.

## When to use

User asks about graph structure / similarity / traversal:
- "What's connected to object 42?"
- "Run PPR from seed PKs [100, 200, 300] and give me top-20."
- "Find communities in the tenant graph."
- "Vector search the knowledge graph for X with k=5."
- "What labels and edge types exist in this graph?"

Not for: Memgraph-canonical operations (use the Django write path or the appropriate Theorem-MCP verb), harness-state queries (use `harness_get` / `harness_replay`), or code-context investigation (use `code_theorem`).

## Tools owned (RustyRed-THG MCP, native Rust)

| Verb | Purpose |
|---|---|
| `mcp__rustyred-thg__rustyred_thg_graph_neighbors` | Adjacency lookup: in/out edges of a node, optionally filtered by edge_type |
| `mcp__rustyred-thg__rustyred_thg_graph_query` | Bounded query: `node_match` (exact scalar) or `neighbors` operations |
| `mcp__rustyred-thg__rustyred_thg_graph_explain` | Query plan without execution (read-only diagnostic) |
| `mcp__rustyred-thg__rustyred_thg_graph_schema` | Labels, edge types, stats, capability notes |
| `mcp__rustyred-thg__rustyred_thg_graph_index_status` | Health of indexes (HNSW, BM25, H3) |
| `mcp__rustyred-thg__rustyred_thg_algorithm_ppr` | Personalized PageRank (seed-driven walk) |
| `mcp__rustyred-thg__rustyred_thg_algorithm_pagerank` | Global PageRank |
| `mcp__rustyred-thg__rustyred_thg_algorithm_components` | Connected components |
| `mcp__rustyred-thg__rustyred_thg_algorithm_communities` | Label-propagation community detection |
| `mcp__rustyred-thg__rustyred_thg_fulltext_search` | BM25 search on a designated property |
| `mcp__rustyred-thg__rustyred_thg_spatial_radius` | H3 radius search |
| `mcp__rustyred-thg__rustyred_thg_spatial_bbox` | H3 bounding-box search |
| `mcp__rustyred-thg__rustyred_thg_vector_search` | HNSW vector similarity (top-k by cosine) |
| `mcp__rustyred-thg__rustyred_thg_vector_hybrid` | Hybrid scoring: vector + graph proximity |

## Tenant scoping

All queries are tenant-scoped. The `tenant` argument defaults to `public` on the Theorem-side RustyRed deployment. For multi-tenant work, pass the explicit tenant id.

## Standard patterns

**Find what X is connected to:**
```
mcp__rustyred-thg__rustyred_thg_graph_neighbors(node_id="42", direction="out")
```

**Find structurally-relevant objects from seeds:**
```
mcp__rustyred-thg__rustyred_thg_algorithm_ppr(seeds={"100": 1.0, "200": 1.0}, alpha=0.15, top_k=20)
```

**Hybrid retrieval (semantic + graph-proximity):**
```
mcp__rustyred-thg__rustyred_thg_vector_hybrid(
    property="embedding_global",
    query=<embedding vector>,
    graph_seeds=["100", "200"],
    k=10,
)
```

**Cluster the graph:**
```
mcp__rustyred-thg__rustyred_thg_algorithm_communities()
```

**Schema introspection (before designing a query):**
```
mcp__rustyred-thg__rustyred_thg_graph_schema()  # returns labels, edge types, stats
mcp__rustyred-thg__rustyred_thg_graph_index_status()  # check before relying on HNSW / BM25 / H3
```

## Output discipline

- Always cite node IDs and scores numerically from the tool output, not paraphrased.
- For PPR / PageRank, list (id, score) pairs sorted by score; flag the top decile vs the long tail.
- For community detection, name communities by ID + size; surface bridging nodes (high betweenness) if present.

## Anti-patterns

- Don't use these for canonical graph writes: RustyRed-THG is the hot read layer, not the source of truth. Writes go through Django's `graph_writes.py` Memgraph-primary path; the PT-003 write-through hook propagates to RustyRed.
- Don't query without checking `rustyred_thg_graph_schema` first when the data shape is unclear. Better to spend one schema call than to issue blind queries.
- Don't use the deprecated `theorem_thg_command` / `theorem_thg_cypher` wrappers. They log a deprecation warning and route through Django anyway. Skip directly to the rustyred-thg MCP.

## Auth

RustyRed-THG requires a Bearer token (`RUSTYRED_THG_API_TOKEN`). The MCP client config should inject the header at runtime; the production token lives in the Railway service's `RUSTYRED_THG_API_TOKENS` env var.

## Native dispatch reference

PPR specifically (`rustyred_thg_algorithm_ppr`) is hot: its 50-400x speed advantage over Python comes from the Rust ACL local-push implementation. If you see Theorem-MCP tools' `harness_fractal_expansion` logging the FALLBACK warning, the Python wheel is missing in that container; this skill's direct-to-rust path doesn't suffer that bug because there's no Python in the loop.
