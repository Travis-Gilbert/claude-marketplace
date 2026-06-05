---
name: compute_code
description: Use this skill when the user wants code search ranked by graph structure rather than by exact-string matching. Routes to the most appropriate of the four RustyRed inline graph algorithm MCP tools (`rustyred_thg_algorithm_ppr_inline`, `rustyred_thg_algorithm_pagerank_inline`, `rustyred_thg_algorithm_components_inline`, `rustyred_thg_algorithm_communities_inline`) based on the shape of the question. Triggers on phrases like "what's relevant to X", "what depends on Y", "rank by importance", "which files matter most", "what's connected to", "cluster these files", "find related code", "structural code search", and generally any code-discovery question where the answer should be ranked by adjacency/centrality/community rather than by keyword. Also triggers when the agent has just been given an adjacency map or code-graph context and needs to compute over it. Auto-triggerable from Orchestrate when a code-search subtask emerges; also user-invocable as `/compute_code`.
---

# compute_code

Routing skill for code search via RustyRed inline graph algorithms.

The skill does not own a single algorithm. It owns the **intent-to-algorithm
mapping** and the **shared input contract**. Given an intent and an adjacency,
it picks the right tool, calls it, and returns ranked results with provenance.

## When to use

Fire when the user asks a question whose answer is "code ranked by structural
relevance," not "code matching this exact string."

Good fits:
- "What's related to `PairformerEncoder` in this repo?" → PPR seeded at that symbol
- "Which files in this codebase are the load-bearing ones?" → global PageRank
- "Are these modules actually independent or do they share dependencies?" → connected components
- "Cluster these files by how tightly coupled they are" → label-propagation communities
- The agent has built an adjacency map (from tree-sitter, imports, calls) and needs to compute over it

Not a fit:
- Pure exact-string lookup → use `Grep`
- "Where is FooClass defined?" with a known unique symbol → use `Grep` or LSP
- "Explain what this function does" → use Read, or `code_theorem` if Theseus has ingested the area
- "What did this change touch?" → use `code_impact` from the Theorem MCP via `code_theorem`
- Adjacency > 100,000 edges → use the tenant-backed counterpart (`rustyred_thg_algorithm_<name>` without `_inline`); ingest the graph into a tenant first via the `rustyred_thg_bulk_nodes` / `rustyred_thg_bulk_edges` write tools

## Algorithm routing (the intent map)

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

1. **Identify intent shape.** Map the user's question to one of the four
   intent rows in the routing table. If the question doesn't fit any row,
   compute_code is the wrong skill: defer to Grep, `code_theorem`, or
   ask the user to clarify.

2. **Identify the seed (PPR only).** For PPR, the seed is the symbol /
   file / module the user is asking about. If they said "what's near
   `PairUpdate`," seed is `PairUpdate`. If they said "what's related to
   `apps/notebook/encode/synthesis.py`," seed is that file path. Seed
   format must match adjacency node IDs.

3. **Acquire the adjacency.** Three acceptable sources, in priority order:
   - The caller already provided one (e.g., from a prior code-search step
     in Orchestrate).
   - Build one with a quick tree-sitter pass over the working directory:
     nodes are files/symbols, edges are imports + calls + references,
     weights default to 1.0 (or use frequency if the source supports it).
   - If neither is feasible (large repo, no extraction infrastructure),
     fall back to suggesting the tenant-backed path with Theseus code
     ingestion.

4. **Validate the budget.** Count edges before calling. If > 100,000,
   refuse to call inline and surface the tenant-backed alternative.

5. **Call the MCP tool.** Use the standard MCP toolchain. With the
   theorems-harness plugin loaded, the tool name surfaces as something
   like `mcp__rustyred-thg__rustyred_thg_algorithm_<name>_inline`. Pass
   `top_k` (e.g., 10) on PPR/PageRank to bound the response.

6. **Surface results with provenance.** Always tell the user which
   algorithm fired, why it was the right choice, and what the result
   ranking means in their question's terms ("top 5 files most related
   to `PairUpdate` by PPR from a seed at `modal_app/epignn_model.py:90`").

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
- **Algorithm chosen** + one-line justification ("PPR because the user asked
  for files relevant to a specific seed symbol").
- **Ranked results** (use top_k by default, typically 10).
- **Adjacency size** (echo back `edge_count` from the tool response).
- **Seed** (if PPR).
- **Pointer to underlying tool** if the caller wants to drill in.

Do NOT return:
- The full adjacency map (sometimes large; only return on explicit request).
- Algorithm internals (alpha, epsilon, damping: only return if the user
  asked for them or the result looks suspicious).

## What this skill explicitly does NOT do

- It does not build the code graph itself. The skill consumes an adjacency.
  Code-graph extraction is a separate concern handled by tree-sitter,
  `code_theorem`, or a per-session adjacency builder.
- It does not deduplicate against `code_theorem`. They are complementary:
  `code_theorem` reads Theseus's pre-ingested code knowledge; `compute_code`
  computes structurally over an arbitrary adjacency you have in hand.
- It does not write to any RustyRed tenant. The inline path is stateless
  by design.

## References

- The four inline MCP tools and their full contract:
  `rustyredcore_THG/crates/rustyred-thg-mcp/src/lib.rs:1381` onward.
- Plan and report:
  `docs/plans/rustyred-inline-compute-mcp/implementation-plan.md`,
  `docs/plans/rustyred-inline-compute-mcp/orchestrate-report.md`.
- Code review (notes on edge cases, isolated nodes, tenant-field ignoring):
  `docs/plans/rustyred-inline-compute-mcp/code-review.md`.
