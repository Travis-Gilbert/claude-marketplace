# Graph and Storage Capability

The current agent surface exposes bounded graph reads, algorithms, selected
administrative mutations, caller-carried graph-version values, and operational
storage readiness. It does not expose the entire `GraphStore`, RedCore, object
store, AOF, DocTree, or AgentFS API.

## Preferred graph reads

When GraphQL is available, prefer:

- `graphNode`, `contentNode`, `neighbors`, and `graphSchema` for records and
  adjacency;
- `graphAlgorithm` for PageRank, Personalized PageRank, components, and
  communities, including the inline variants;
- `vectorSearch`, `vectorHybrid`, `fulltextSearch`, `spatialRadius`, and
  `spatialBbox` for designated-index retrieval;
- `deriveFacts`, `sourceReliability`, and `expectedValue` for the parity-gated
  symbolic reads;
- `multiVectorSearch` for bounded hot-candidate/cold-exact reranking.

Flat compatibility uses `rustyred_thg_graph_neighbors`,
`rustyred_thg_graph_schema`, the `rustyred_thg_algorithm_*` family, the exact
`rustyred_thg_*_search` names, and the symbolic names. In
`graphql_default_surface` mode, GraphQL-covered flat tools may be absent from
`tools/list` even though the capability remains available.

Flat-only graph diagnostics currently include `rustyred_thg_graph_query`
(`neighbors` or exact scalar `node_match`), `rustyred_thg_graph_explain`,
`rustyred_thg_graph_index_status`, `rustyred_thg_relational_query`, and the
graph-version family. Do not invent GraphQL fields for them.

Tenant-backed algorithms read the admitted tenant graph. Inline algorithms are
stateless, do not touch a tenant, and refuse an oversized adjacency with the
typed `payload_too_large` error; route a larger graph to the tenant-backed
variant. A `top_k`, `limit`, or `budget` request is a bound, not proof that the
server applied one universal operation budget.

## Administrative graph writes

GraphQL `designateVector`, `designateSpatial`, `designateFulltext`, `bulkNodes`,
and `bulkEdges` require the administrative graph-mutation gate. Their flat
compatibility names are `rustyred_thg_vector_designate`,
`rustyred_thg_spatial_designate`, `rustyred_thg_fulltext_designate`,
`rustyred_thg_bulk_nodes`, and `rustyred_thg_bulk_edges`.

The server must enable admin MCP mode, must not be read-only, and the admitted
principal must carry `admin:write` or the native graph admin-write scope. A
refusal is a successful JSON-RPC response with `isError: true`; inspect the
tool-level result.

Designation and bulk responses carry affected/failed counts, graph version,
and a content-addressed `theorem.graph.mutation.v1` receipt with before/after
graph-version anchors. Bulk ingestion can partially succeed. Check `ok`,
`inserted`, `failed`, `errors`, and the receipt; transport success alone is not
atomic-batch proof. Direct writes to maintained epistemic projection records
are refused.

Other higher-level GraphQL mutations, such as epistemic relationship promotion
and multi-vector upsert, have their own contracts. The admin bulk gate does not
make every GraphQL mutation a raw graph-write API.

## Graph versions are caller-carried values

The flat version family is real:

- `rustyred_thg_graph_version_compile` compiles the current tenant graph into a
  content-addressed graph pack;
- `rustyred_thg_graph_version_diff` compares a required base snapshot with the
  current graph or an explicit target;
- `rustyred_thg_graph_version_ref` compiles current state and updates a branch
  ref inside the caller-supplied repository value;
- `rustyred_thg_graph_version_log` and
  `rustyred_thg_graph_version_checkout` read a caller-supplied repository;
- `rustyred_thg_graph_version_merge` performs a three-way merge over supplied
  snapshots.

These calls return repository/snapshot values; they do not persist a remote
branch repository or reset the live tenant graph. Checkout reconstructs a
snapshot response, not an in-place rollback. Merge can resolve or report
conflicts but does not publish the result automatically. Do not describe this
family as a durable remote graph-git service until a mounted repository and
apply/rollback protocol exist.

## Resources, indexes, and storage

MCP resources expose configured-tenant `schema`, `labels`, `edge-types`,
`indexes`, `stats`, and `verify-latest`, plus node, edge, and neighbor resource
templates. They are read projections, not alternate mutation tools.

`rustyred_thg_index_spine` and typed GraphQL index-spine fields inspect
manifests, query receipts, advisor proposals, context views, maps, training
runs/exports, and export validation. Inspection does not build, promote, or
repair an index.

`GET /ready` is the storage-mode truth: embedded mode checks RedCore directory,
durability, strict-ACID, volume, and configured prewarm tenants; memory mode
reports no durability; Redis mode proves its compatibility store is reachable.
It is observational and does not materialize a tenant during the probe.

Cold object storage, Prolly/DocTree internals, AOF recovery, adaptive eviction,
raw Redis keys, AgentFS/FUSE, and low-level transactions are Rust/HTTP/internal
surfaces unless a live catalog explicitly advertises a narrower operation. Do
not route an agent to invented `object_store`, `graph_put`, `graph_delete`,
`graph_rollback`, or raw Redis tools.

## Honest gaps

HCM-027 still requires consistent pagination and operation budgets, complete
descriptor coverage for search/algorithm/version primitives, and the full
all-target oracle. The existing mutation safety/receipt slice does not close
those dependencies.
