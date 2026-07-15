---
name: graph_theorem
description: Query and traverse the current Theorem graph through typed GraphQL or exact flat MCP graph surfaces. Use for neighbors, schema, algorithms, vector/full-text/spatial retrieval, relational queries, or index diagnostics.
---

# Graph Theorem

Read `../../references/GRAPH_STORAGE_CAPABILITY.md` before selecting a surface.

## Route

1. Introspect and prefer GraphQL `graphNode`, `contentNode`, `neighbors`,
   `graphSchema`, `graphAlgorithm`, `vectorSearch`, `vectorHybrid`,
   `fulltextSearch`, `spatialRadius`, or `spatialBbox` where present.
2. Use flat `rustyred_thg_graph_query` only for bounded neighbors/exact scalar
   `node_match`; use `rustyred_thg_graph_explain` for its plan and
   `rustyred_thg_graph_index_status` for index health.
3. Use `rustyred_thg_relational_query` for native `QueryIr` or a supported
   selection AST. Preserve its planner/ranker/fusion trace.
4. Use tenant-backed algorithms for persisted graph state. Use inline variants
   only for supplied adjacency below the configured edge limit; they do not
   touch a tenant.

Authenticated admission chooses the tenant. Do not rely on a `public` or
`default` tenant fallback. Cite returned node ids, edge types, scores, bounds,
graph versions, and trace/receipt evidence. A search hit or algorithm score is
ranking evidence, not a verified factual claim.

Administrative designation and bulk mutation belong to `graph-storage`; they
require explicit admin admission and can partially succeed. Raw graph writes,
Redis commands, and storage internals are not exposed by these reads.
