---
name: graph-version
description: Graph-git version control over the RustyRed substrate. Use when the user wants to snapshot the graph, commit the current graph state, diff graph state across commits, reconstruct a prior graph state, roll back the graph, branch the graph, read graph history, or merge graph branches. Triggers on "version the graph", "graph commit", "graph snapshot", "graph diff", "graph branch", "graph history", "graph log", "roll back the graph", "reconstruct the graph at", and "merge these graph branches".
---

# graph-version

Version control for the graph itself, not for files. The substrate keeps a
content-addressed commit history of graph state so a tenant can snapshot the
graph, compare two points in its history, reconstruct any prior state, and
merge divergent branches back together.

Two things make this different from a naive "save a copy" snapshot:

- **The Prolly-tree pack.** Commits are stored as a probabilistic B-tree
  (Prolly tree), so unchanged subtrees are shared structurally between
  commits. A commit is cheap and a diff is computed from the tree shape, not by
  walking every node.
- **The confidence-weighted three-way merge.** When two branches both touched
  the graph, merge resolves conflicts using the per-fact confidence carried on
  the substrate, not last-writer-wins. Higher-confidence assertions win;
  genuine conflicts are surfaced rather than silently clobbered.

If all you want is the current graph (no history), use the ordinary read tools
(`rustyred_thg_graph_query`, `rustyred_thg_graph_neighbors`). Reach for these
tools only when time, history, or branching is part of the question.

## When To Use

- "Snapshot the graph before this migration" / "commit the current state"
- "What changed in the graph between these two commits?"
- "Reconstruct the graph as it was at commit X"
- "Roll the graph back to before that ingest"
- "Show the graph history" / "list the commits"
- "Merge the graph branch the other head built into mine"
- "Give me a name for this commit so I can refer to it later"

Not a fit:
- Reading current nodes/edges with no time axis: use `rustyred_thg_graph_query`.
- Application-file version control: that is git, not this.

## Tools

| Tool | When | Notes |
|---|---|---|
| `rustyred_thg_graph_version_compile` | Commit the current graph state | Writes a new commit into the Prolly-tree pack and returns its commit id. This is the "snapshot now" verb. |
| `rustyred_thg_graph_version_checkout` | Reconstruct a prior state | Materializes the graph as it was at a given commit. This is how you roll back or inspect history; it rebuilds state, it does not mutate the live head in place. |
| `rustyred_thg_graph_version_diff` | Compare two commits | Returns added / removed / changed nodes and edges between `from` and `to`, computed from the tree shape. The "what changed" verb. |
| `rustyred_thg_graph_version_log` | Read history | Lists commits (id, parent, message, time) in order. The "graph history" verb. |
| `rustyred_thg_graph_version_merge` | Combine two branches | Confidence-weighted three-way merge of two commits against their common ancestor. Higher-confidence facts win; true conflicts are reported. |
| `rustyred_thg_graph_version_ref` | Name or resolve a commit | Bind a human-readable ref to a commit, or resolve a ref back to its commit id. Use it so later calls can say `main` instead of a raw hash. |

## Example Calls

Commit the current state:

```json
{
  "tool": "rustyred_thg_graph_version_compile",
  "message": "after civic-atlas ingest, before policy rewrite"
}
```

Diff two commits:

```json
{
  "tool": "rustyred_thg_graph_version_diff",
  "from": "commit:abc123",
  "to": "commit:def456"
}
```

Reconstruct a prior state (roll back / inspect):

```json
{
  "tool": "rustyred_thg_graph_version_checkout",
  "commit": "commit:abc123"
}
```

Merge a branch with confidence resolution:

```json
{
  "tool": "rustyred_thg_graph_version_merge",
  "ours": "ref:main",
  "theirs": "commit:def456"
}
```

Name a commit so later work can refer to it:

```json
{
  "tool": "rustyred_thg_graph_version_ref",
  "name": "pre-migration",
  "commit": "commit:abc123"
}
```

## Standard Flow

1. **Snapshot before a risky change.** Call `compile` before a migration,
   large ingest, or destructive rewrite, and name the result with `ref` so it
   is easy to return to.
2. **Diff to understand.** When asked what changed, resolve both endpoints
   (via `ref` or `log`), then call `diff`. Report adds/removes/changes, not the
   full materialized graph.
3. **Checkout to reconstruct.** To roll back or inspect a past state, call
   `checkout` on the target commit. Treat it as producing a state, not as an
   irreversible reset.
4. **Merge to reconcile branches.** When two lines of work diverged, call
   `merge`. Read the conflict report: confidence resolved the easy cases, but
   surfaced conflicts need a human or a follow-up assertion.

## Output

Report the commit id(s) involved and the verb run. For `diff`, summarize counts
(N added, M removed, K changed) and the notable changes, not the entire delta.
For `merge`, state the resulting commit id and list any unresolved conflicts
explicitly. For `checkout`, state which commit was reconstructed. Keep raw
Prolly-tree internals out of the report unless the result looks wrong.

## Anti-Patterns

- Using `checkout` when the user only wanted to read the current graph. That is
  a plain query, not a time-travel operation.
- Calling `compile` on every small mutation. Commit at meaningful boundaries
  (before a migration, after a verified batch), not per edit.
- Treating `merge` as last-writer-wins. It is confidence-weighted; do not
  hand-wave away the conflict report it returns.
- Diffing without resolving endpoints first, then reporting against the wrong
  commits.
- Reporting the full materialized graph when a `diff` summary was asked for.
