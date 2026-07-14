---
name: compute_code
description: Use this skill when the user wants native code discovery, code graph search, or graph-structural code ranking. Prefer the native CodeCrawler-backed `compute_code` MCP tool for reads and `code_ingest` for ingest/reindex/session overlays. Fall back to the RustyRed inline graph algorithm MCP tools only when the caller already has an adjacency map or needs pure graph math. User-invocable as `/compute_code`.
---

# compute_code

Routing skill for native Theorem code discovery.

## Ambient loop (default; runs without you)

Code discovery is now ambient: the harness hooks keep the code KG fresh and
inject a ranked code neighborhood into every prompt, so most discovery needs no
explicit call. The loop has three server-side parts:

- **Base sync (SessionStart).** Server-side `kg_status` is the only freshness
  authority. Unknown repos enqueue `ingest`; indexed repos whose `head_sha`
  differs enqueue `reindex`; a matching indexed SHA reads `context_pack`
  without `repo_url`, so the read path cannot trigger synchronous ensure work.
  `.harness/code-kg-manifest.json` is only a submission/job receipt and always
  carries `certifies_indexed: false`.
- **Session delta (edits).** File edits are queued to
  `.harness/session-delta-queue` and flushed at the next prompt into
  `session_reingest`, which overlays your uncommitted edits (additions +
  tombstones) on the committed base.
- **Context pack (every prompt).** A `## Code neighborhood` block is injected:
  PPR-ranked hits over the merged base+delta from the dirty/announcement/prompt
  seeds, each with `file:line` and a one-line why, plus an impact block ("editing
  X reaches Y, Z"). Trust this block as PPR-ranked; prefer drilling in by
  `node_id` (operation `context`/`explore`) over a fresh lexical search.

The loop needs a tenant: set `THEOREM_TENANT_ID` (canonical). With no tenant the
loop logs "code KG disabled: no tenant" and stays silent; it never falls back to
a fixture tenant.

## The command is the research surface

`/compute_code` (and the `compute_code` MCP tool) survives as the **explicit
research** surface: search/explain/explore across tenants and repos, inspect
indexed inventory, or run explicit graph math. It no longer carries the ambient
responsibility. Fresh sessions should see one read tool, `compute_code`, and one
write tool, `code_ingest`; the old `code_search` name is a dispatch-compatible
alias for existing callers and receipts, not an advertised tool.

Use the older inline graph algorithms only as a fallback when you already have
an adjacency map in hand or when the task is explicitly about centrality,
connected components, or community detection over a supplied graph.

## When to use

Fire when the user asks a question whose answer is "code ranked by structural
relevance," not "code matching this exact string."

Good fits:
- "Find code related to `PairformerEncoder` in this repo"
- "Explain where `native_code_search` lives and what calls it"
- "Search the code graph for GraphStore persistence"
- "Explore symbols around this file or node"
- "Refresh this repo in the native code graph" (route through `code_ingest`)
- "Rank this supplied adjacency by importance"
- "Cluster these supplied files by coupling"
- The agent has built an adjacency map (from tree-sitter, imports, calls) and needs to compute over it

Not a fit:
- Pure exact-string lookup → use `Grep`
- "Where is FooClass defined?" with a known unique symbol → use `Grep` or LSP
- "Explain this exact open function" when the file is already in context → use `Read`
- Adjacency > 100,000 edges → use tenant-backed graph compute after ingestion

## Preferred MCP path: native CodeCrawler

Call the MCP tool named `compute_code` for read operations. Call `code_ingest`
for ingest, reindex, session reingest, and use receipts.

Operation routing:

| Intent shape | Operation | Notes |
|---|---|---|
| Find symbols/files by topic or name | `search` | Default operation. Use `query`, optional `repo_id`, `file_path`, `path_prefix`, `kinds`, `limit`. |
| Explain a symbol or result | `explain` | Use after search, or directly with `query`/`node_id`. |
| Expand surrounding source context | `context` | Use `node_id`, `file_path`, and optional `max_chars`. |
| Extract symbols from inline text or a file | `recognize` | Use `text` or `file_path`. |
| Explore call/dependency edges | `explore` | Use `node_id`, `query`, and optional `max_depth`. |
| List indexed repos | `list_repos` | Read-only inventory of the tenant's indexed repos with per-repo file/symbol counts, latest generation, and last indexed time. No `job_id`. Use it to answer "is this repo already indexed." |

Write operations use `code_ingest`:

| Intent shape | Operation | Notes |
|---|---|---|
| Ingest a repo URL | `ingest` | Remote ingest is URL-only: the server shallow-clones the URL. A local `repo_path` against the remote server is auto-rerouted to its `git origin` URL when possible; true local-path ingest needs the local binding (`THEOREM_HARNESS_DATA_DIR`). Ingest implies `confirmed: true`. |
| Reindex a repo path | `reindex` | Use only when refreshing a known index. |
| Overlay local session edits | `session_reingest` | Flushes the session delta queue into the merged code graph. |
| Record tool-use outcome | `record_use_receipt` | Learning receipt for code tool use. |

Minimal search call:

```json
{
  "operation": "search",
  "query": "GraphStore persistence",
  "repo_id": "repo:theorem",
  "limit": 10
}
```

## Ingest reality (read before ingesting)

The ingest path has hard constraints that are easy to get wrong:

- **Tenant is required.** Code ops are tenant-scoped. Set `THEOREM_TENANT_ID`
  (canonical; legacy `THEOREMS_HARNESS_TENANT` still resolves) or pass
  `tenant_slug`. An un-tenanted code call is rejected with `TENANT_REQUIRED`
  rather than silently searching the `theorem` fixture tenant. The working
  tenant is `Travis-Gilbert`.
- **Remote ingest is URL-only.** The MCP server runs remotely (Railway) and
  cannot see your local filesystem. Pass a repo URL; the server shallow-clones
  and ingests it. A local `repo_path` against the remote server is auto-rerouted
  to its `git origin` URL; a local path with no `origin` remote is an explicit
  error, not a queued-then-dead job.
- **Local paths need the local binding.** To ingest a path the server can
  actually read, run the code graph in-process via `THEOREM_HARNESS_DATA_DIR`.
- **Ingest is the confirmation.** A user-invoked `ingest`/`reindex`
  sets `confirmed: true` automatically; there is no separate confirm step.
- **Search filters are `repo_id` and `path_prefix` only.** `repo_id` is an exact
  match; `path_prefix` is a relative path prefix. Passing `repo_path`/`repo_url`
  to a *search* is rejected (`INVALID_REQUEST`): they are not search filters, and
  a "scoped" search with them would silently go global.
- **See what is indexed with `list_repos`.** `operation: "list_repos"` returns
  the repos in the tenant with per-repo file/symbol counts and the latest
  generation. Use it before ingesting to avoid re-indexing.
- **Ingest result.** Production ingest/reindex returns a queued `job_id`; poll
  `ingest_status` until it is terminal. A submission receipt is not evidence
  that the graph is indexed—confirm with a later tenant-scoped `kg_status`.

## Fallback path: inline graph algorithms

Use this path only when native `compute_code` / `code_ingest` is unavailable or
when the caller already supplied an adjacency map and explicitly needs graph
math.

| Intent shape | Tool | One-line reason |
|---|---|---|
| "What's relevant to / near / around X?" | `rustyred_thg_algorithm_ppr_inline` | PPR with X as seed returns the locally-relevant subgraph, ranked by structural distance from the seed. |
| "Which files / modules matter most?" / "Global importance" | `rustyred_thg_algorithm_pagerank_inline` | Global PageRank ranks every node by structural authority across the whole graph. |
| "What's connected to what?" / "Are these in the same component?" | `rustyred_thg_algorithm_components_inline` | Connected components partition the graph into disconnected subgraphs. Returns one list per component. |
| "What logical groups / clusters exist?" / "Cluster by relationship density" | `rustyred_thg_algorithm_communities_inline` | Label-propagation communities find densely-connected groups inside a connected graph. Returns a community id per node + a modularity score. |

When the intent is ambiguous between PPR and PageRank: prefer PPR if a seed is
identifiable; prefer PageRank if the question is global ("what matters in this
codebase") with no specific anchor.

## Shared input contract

All four tools accept the same `adjacency` shape:

```json
{
  "adjacency": {
    "<node_id>": [["<neighbor_id>", <weight>], ...],
    ...
  }
}
```

Plus algorithm-specific kwargs:

- **ppr_inline**: requires `seeds: {"<node_id>": <mass>}`; optional `alpha` (0.15), `epsilon` (1e-4), `max_pushes` (200_000), `top_k`.
- **components_inline**: optional `directed` (false).
- **pagerank_inline**: optional `damping` (0.85), `max_iter` (100), `tolerance` (1e-6), `top_k`.
- **communities_inline**: no extra kwargs.

Inline path budget: 100,000 edges by default. Above that limit, the tool
returns JSON-RPC error code `-32004` (`payload_too_large`) with a message
pointing to the tenant-backed counterpart.

## Standard flow

1. **Choose native first.** If the user asks for code discovery, code graph
   search, symbol context, explanation, or code inventory, call the MCP
   `compute_code` tool.

2. **Choose the operation.** Default to `search`. Use `explain`, `context`,
   `recognize`, or `explore` when the user's wording asks for those directly.
   Use `code_ingest` with `ingest` or `reindex` when the task needs a fresh code
   graph. The runtime keeps bounded fetch and file budgets, but indexing a
   public or local codebase is not a separate permission ceremony.

3. **Fallback only for explicit adjacency.** If the task supplies an adjacency
   or asks for centrality/components/communities over a graph, route through the
   inline algorithm table.

4. **Validate inline budgets.** Count edges before calling an inline algorithm.
   If > 100,000, surface the tenant-backed path instead.

5. **Surface results with provenance.** State whether the result came from
   native CodeCrawler or from an inline graph algorithm. Include the operation,
   query/seed, top-K, and any receipt or graph evidence the tool returned.

## Orchestrate integration

Orchestrate can route to `compute_code` when its task analysis identifies a
code-search subtask whose answer benefits from graph-structural ranking.
Typical handoff shape:

- Orchestrate identifies the subtask (e.g., "find load-bearing files in
  rustyredcore_THG before refactoring the public API").
- Orchestrate invokes `compute_code` via the Skill tool with the subtask
  description as the argument.
- `compute_code` returns ranked results.
- Orchestrate folds the results into its next phase (planning, execution,
  or report).

When invoked directly via `/compute_code <question>`, the skill operates
without Orchestrate's surrounding workflow; the result is returned to the
user (or to whichever skill called it) immediately.

## Anti-fragile pattern: verify negatives

A specific failure mode this skill is designed to prevent (the lesson
captured in
`feedback_grep_hygiene_imports_and_crates.md`): drawing a confident
negative conclusion from a narrow grep. When the user asks
"is X in this codebase?" or "where does Y live?" and the obvious
locations come up empty, fire `compute_code` with PPR seeded at the
nearest related symbol to find structurally-adjacent locations the
narrow grep missed. The PPR ranking surfaces the file where X actually
lives even when the search term wasn't exact.

This is the use case the skill exists for. Use it on negatives, not just
positives.

## Output shape

Return:
- **Route chosen** (`compute_code`/CodeCrawler or inline algorithm) plus a
  one-line justification.
- **Ranked results** (use top_k by default, typically 10).
- **Operation** (`search`, `explain`, `context`, etc.) or **algorithm** (if inline).
- **Seed** (if PPR) or **query/node_id** (if CodeCrawler).
- **Pointer to underlying tool** if the caller wants to drill in.

Do NOT return:
- The full adjacency map (sometimes large; only return on explicit request).
- Algorithm internals (alpha, epsilon, damping: only return if the user
  asked for them or the result looks suspicious).

## What this skill explicitly does NOT do

- It does not build the code graph itself. The skill consumes an adjacency.
  Code-graph extraction is handled by native CodeCrawler ingestion/reindexing.
- It does not replace exact local text search. Use the host's native search for
  literal lookups; use `compute_code` for native code-graph discovery and the
  structural fallback over an explicit adjacency.

## References

- The four inline MCP tools and their full contract:
  `rustyredcore_THG/crates/rustyred-thg-mcp/src/lib.rs:1381` onward.
- Plan and report:
  `docs/plans/rustyred-inline-compute-mcp/implementation-plan.md`,
  `docs/plans/rustyred-inline-compute-mcp/orchestrate-report.md`.
- Code review (notes on edge cases, isolated nodes, tenant-field ignoring):
  `docs/plans/rustyred-inline-compute-mcp/code-review.md`.
