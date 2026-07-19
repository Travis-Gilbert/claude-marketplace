---
name: graph-storage
description: "Use for Harness graph reads, algorithms, designated indexes, admin bulk mutations, graph-version values, resources, or storage readiness, while distinguishing callable projections from Rust-only storage internals."
---

# Graph and storage

Generated surface map: [capability catalog](./CAPABILITIES.generated.md).

Read `../../references/GRAPH_STORAGE_CAPABILITY.md` before selecting a graph or
storage surface.

## Route

1. Prefer typed GraphQL node, neighbor, schema, algorithm, search, symbolic,
   and multi-vector fields. Use the documented flat-only query, explain,
   relational, index-status, and graph-version tools where needed.
2. Check the admitted tenant and requested bounds. Inline algorithms are
   stateless and bounded; tenant-backed variants read the tenant graph.
3. Before an administrative designation or bulk write, confirm admin mode,
   write mode, and the principal's admin graph-write scope. Inspect per-record
   failures and the `theorem.graph.mutation.v1` receipt.
4. Treat graph-version repository and snapshot objects as caller-carried
   values. Compile, ref, checkout, and merge do not persist a remote repository
   or mutate/roll back the live graph.
5. Use `/ready` to report the active storage mode and durability. Do not infer
   AOF, object-store, DocTree, AgentFS, or raw Redis access from graph success.

Do not invent raw `graph_put`, `graph_delete`, `graph_rollback`, object-store,
or Redis tools. A successful bulk response can still be partial; a generated
snapshot is not a deployed rollback.
