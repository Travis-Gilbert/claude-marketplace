---
name: compute_code
description: Use this skill for native code ingest, status, search, context, explanation, specification, drift, feature, or implementation-obligation work. Prefer the typed Harness GraphQL code fields; use the consolidated CodeCrawler flat tools as compatibility fallbacks. Use RustyRed inline graph algorithms only for supplied adjacency or pure graph math. User-invocable as `/compute_code`.
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

`/compute_code` survives as the **explicit research and compiler** surface:
search/explain/explore across tenants and repos, inspect indexed inventory,
compile revision-bound specification artifacts, or run explicit graph math. It
no longer carries the ambient responsibility. Prefer the GraphQL code fields.
On the flat fallback, `compute_code` owns CodeCrawler reads, `code_ingest` owns
ingest/reindex writes, and the four `code_*` compiler tools own specification,
drift, feature, and obligation reads. The old `code_search` name is a
dispatch-compatible alias for existing callers and receipts, not an advertised
tool.

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
- "Compile the current code specification and show missing evidence"
- "What drifted from the preserved specification?"
- "Extract connection features and implementation obligations for this change"
- "Rank this supplied adjacency by importance"
- "Cluster these supplied files by coupling"
- The agent has built an adjacency map (from tree-sitter, imports, calls) and needs to compute over it

Not a fit:
- Pure exact-string lookup → use `Grep`
- "Where is FooClass defined?" with a known unique symbol → use `Grep` or LSP
- "Explain this exact open function" when the file is already in context → use `Read`
- Adjacency > 100,000 edges → use tenant-backed graph compute after ingestion

## Preferred path: Harness GraphQL

When `graphql_query`, `graphql_mutate`, and `graphql_introspect` are available,
use them before flat tools. Introspect when the schema is not already in
context, send reads through `graphql_query`, and send ingest/reindex through
`graphql_mutate`.

| Intent | GraphQL field |
|---|---|
| Ingest / reindex | mutation `ingestCodebase` / `reindexCodebase` |
| Status / search / context / explain | query `codeStatus` / `codeSearch` / `codeContext` / `codeExplain` |
| Specification / drift / features / obligations | query `codeSpec` / `codeDrift` / `codeFeatures` / `codeObligations` |

`codeStatus`, `codeSpec`, `codeDrift`, `codeFeatures`, and `codeObligations`
return a typed `CodeDomainResult`. Preserve and compare its `revision` claim:
tenant, repository, generation, head SHA, evidence ids, and missing evidence.
Never combine compiler artifacts across mismatched revisions.

## Flat MCP compatibility path

Use flat tools only when GraphQL is unavailable or is itself under diagnosis.
Call `compute_code` for CodeCrawler read operations and `code_ingest` for
ingest, reindex, session reingest, and use receipts. There is no standalone
flat context tool: use `compute_code` operation `context`.

Operation routing:

| Intent shape | Operation | Notes |
|---|---|---|
| Find symbols/files by topic or name | `search` | Default operation. Use `query`, optional `repo_id`, `file_path`, `path_prefix`, `kinds`, `limit`. |
| Confirm indexed revision | `kg_status` | Use `repo`; read tenant/repo/generation/SHA before trusting freshness. |
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

Compiler reads use their real flat tools rather than invented `compute_code`
operations:

| Intent | Flat tool |
|---|---|
| Compile current specification | `code_compile_spec` |
| Compare specification drift | `code_spec_drift` |
| Extract connection features | `code_extract_features` |
| Compile implementation obligations | `code_implementation_obligations` |

Minimal search call:

```json
{
  "operation": "search",
  "query": "GraphStore persistence",
  "repo_id": "repo:theorem",
  "limit": 10
}
```

The equivalent GraphQL fields are documented with signatures and examples in
`references/CODE_CAPABILITY.md`.

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

1. **Choose GraphQL first.** If the user asks for code ingest, status,
   discovery, context, explanation, specification, drift, features, or
   obligations, use the matching typed GraphQL code field.

2. **Choose the flat fallback only when needed.** Default CodeCrawler reads to
   `compute_code` operation `search`; use `kg_status`, `explain`, `context`,
   `recognize`, or `explore` for those intents. Use `code_ingest` with `ingest`
   or `reindex` for a fresh graph. Use the named compiler tools for spec, drift,
   features, and obligations.

3. **Fallback only for explicit adjacency.** If the task supplies an adjacency
   or asks for centrality/components/communities over a graph, route through the
   inline algorithm table.

4. **Validate inline budgets.** Count edges before calling an inline algorithm.
   If > 100,000, surface the tenant-backed path instead.

5. **Surface results with provenance.** State whether the result came from
   GraphQL, flat CodeCrawler, a code compiler tool, or an inline graph
   algorithm. Include the operation/field, query or seed, repository revision,
   top-K where relevant, and any receipt, missing evidence, or graph evidence.

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
- **Route chosen** (GraphQL code field, flat CodeCrawler/compiler tool, or
  inline algorithm) plus a
  one-line justification.
- **Ranked results** (use top_k by default, typically 10).
- **Field/operation** (`codeSearch`, `search`, `codeSpec`, etc.) or
  **algorithm** (if inline).
- **Seed** (if PPR) or **query/node_id** (if CodeCrawler).
- **Revision provenance** for status/spec/drift/features/obligations.
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

- Canonical GraphQL-to-flat mapping: `references/CODE_CAPABILITY.md`.
- The four inline MCP tools and their full contract:
  `rustyredcore_THG/crates/rustyred-thg-mcp/src/lib.rs:1381` onward.
- Plan and report:
  `docs/plans/rustyred-inline-compute-mcp/implementation-plan.md`,
  `docs/plans/rustyred-inline-compute-mcp/orchestrate-report.md`.
- Code review (notes on edge cases, isolated nodes, tenant-field ignoring):
  `docs/plans/rustyred-inline-compute-mcp/code-review.md`.
