---
name: compute_code
description: Use this skill when the user wants native code discovery, code graph search, or graph-structural code ranking. Prefer the native CodeCrawler-backed `compute_code` MCP tool, which aliases the Theorem `code_search` MCP surface. Fall back to the RustyRed inline graph algorithm MCP tools only when the caller already has an adjacency map or needs pure graph math. User-invocable as `/compute_code`.
---

# compute_code

Routing skill for native Theorem code discovery.

The skill keeps `/compute_code` as the human-facing command while routing to the
new native MCP-backed code graph. Prefer the `compute_code` MCP tool when it is
available. It is an alias for the Theorem CodeCrawler-backed `code_search` MCP
surface, so it can search, explain, recognize, explore, ingest, and reindex code
through the same native code graph.

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
- "Refresh this repo in the native code graph"
- "Rank this supplied adjacency by importance"
- "Cluster these supplied files by coupling"
- The agent has built an adjacency map (from tree-sitter, imports, calls) and needs to compute over it

Not a fit:
- Pure exact-string lookup → use `Grep`
- "Where is FooClass defined?" with a known unique symbol → use `Grep` or LSP
- "Explain this exact open function" when the file is already in context → use `Read`
- Adjacency > 100,000 edges → use tenant-backed graph compute after ingestion

## Preferred MCP path: native CodeCrawler

Call the MCP tool named `compute_code` when it is available. If that alias is not
visible in the current host, call `code_search` with the same arguments.

Operation routing:

| Intent shape | Operation | Notes |
|---|---|---|
| Find symbols/files by topic or name | `search` | Default operation. Use `query`, optional `repo_id`, `file_path`, `path_prefix`, `kinds`, `limit`. |
| Explain a symbol or result | `explain` | Use after search, or directly with `query`/`node_id`. |
| Expand surrounding source context | `context` | Use `node_id`, `file_path`, and optional `max_chars`. |
| Extract symbols from inline text or a file | `recognize` | Use `text` or `file_path`. |
| Explore call/dependency edges | `explore` | Use `node_id`, `query`, and optional `max_depth`. |
| Ingest a repo path or URL | `ingest` | Indexes a local path or shallow-cloned URL into the tenant code graph. For large public repos, pass `timeout_ms`, `max_files`, `max_file_bytes`, `include_extensions`, and `exclude_dirs`. `path_prefix` is search filtering only; it does not reduce clone or ingest scope. |
| Reindex a repo path | `reindex` | Write operation; use only when refreshing a known index. |
| Record tool-use outcome | `record_use_receipt` | Write operation for learning receipts. |

Minimal search call:

```json
{
  "operation": "search",
  "query": "GraphStore persistence",
  "repo_id": "repo:theorem",
  "limit": 10
}
```

## Fallback path: inline graph algorithms

Use this path only when native `compute_code` / `code_search` is unavailable or
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
   search, symbol context, explanation, or repo indexing, call the MCP
   `compute_code` tool. If only `code_search` is visible, call `code_search`.

2. **Choose the operation.** Default to `search`. Use `explain`, `context`,
   `recognize`, or `explore` when the user's wording asks for those directly.
   Use `ingest` or `reindex` when the task needs a fresh code graph. The
   runtime keeps bounded fetch and file budgets, but indexing a public or local
   codebase is not a separate permission ceremony.

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
- It does not deduplicate against `code_theorem`. They are complementary:
  `code_theorem` reads Theseus's pre-ingested code knowledge; `compute_code`
  now routes to Theorem's native code graph first and computes structurally over
  arbitrary adjacency only when using the fallback path.

## References

- The four inline MCP tools and their full contract:
  `rustyredcore_THG/crates/rustyred-thg-mcp/src/lib.rs:1381` onward.
- Plan and report:
  `docs/plans/rustyred-inline-compute-mcp/implementation-plan.md`,
  `docs/plans/rustyred-inline-compute-mcp/orchestrate-report.md`.
- Code review (notes on edge cases, isolated nodes, tenant-field ignoring):
  `docs/plans/rustyred-inline-compute-mcp/code-review.md`.
