---
name: graph-version
description: Use for the current flat graph-pack compile, diff, caller-carried refs/log/checkout, and three-way merge value operations without claiming a durable remote graph-git repository or live rollback.
---

# Graph version

Read `../../references/GRAPH_STORAGE_CAPABILITY.md` before using this flat-only
family.

## Exact operations

- `rustyred_thg_graph_version_compile` compiles current admitted-tenant graph
  state into a content-addressed graph pack.
- `rustyred_thg_graph_version_diff` requires a base snapshot and compares it to
  current graph state or an explicit target snapshot.
- `rustyred_thg_graph_version_ref` compiles current state and updates a branch
  inside the caller-supplied `repository` value.
- `rustyred_thg_graph_version_log` and
  `rustyred_thg_graph_version_checkout` require a caller-supplied repository and
  target.
- `rustyred_thg_graph_version_merge` requires base and theirs snapshots, accepts
  optional ours/options, and returns a merged value/conflicts.

Carry the returned repository/snapshot/commit value to the next call. These
tools do not persist a server-side branch repository, mutate the live tenant
head, or apply a rollback. Checkout reconstructs a response; merge does not
publish automatically.

Report content/commit ids, parent/ref inputs, added/removed/changed counts, and
unresolved conflicts exactly as returned. Do not promise structural sharing,
performance, confidence resolution, or durability beyond the receipt actually
provided by the call.
