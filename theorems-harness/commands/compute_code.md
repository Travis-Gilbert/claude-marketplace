---
description: Route a code-search question through native Theorem CodeCrawler first, with RustyRed inline graph algorithms as an adjacency fallback.
argument-hint: <question-or-code-context>
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash, Skill
---

Run the theorems-harness:compute_code skill against the user's input.

1. Parse the user's argument as a natural-language code-search question. If empty, ask the user what code question they want answered before proceeding.
2. Invoke the `theorems-harness:compute_code` skill via the Skill tool, passing the user's argument as the input. The fully-qualified `theorems-harness:compute_code` form disambiguates from this command of the same base name; using the bare `compute_code` form causes the Skill tool to recurse back into this command and hang. The skill body (`skills/compute_code/SKILL.md`) is the authoritative spec for intent-to-algorithm routing.
3. The skill will prefer the native MCP `compute_code` tool for reads and `code_ingest` for ingest/reindex/session overlays.
4. Use inline graph algorithms only when the user supplied an adjacency map or explicitly asked for centrality/components/communities over a graph.
5. Stream the route choice + one-line justification before showing results, so the user can see whether the routing matched their intent.
6. Return ranked results with provenance: route, operation or algorithm, query/seed, top-K node list, and receipt or graph evidence when returned.

If the agent determines the question is a pure exact-string lookup (use `Grep`), a request for Theseus's pre-ingested code knowledge (use `code_theorem`), or an adjacency exceeding the inline budget (use the tenant-backed counterpart), the skill explicitly defers rather than forcing a mismatched algorithm.

Orchestrate may also invoke this skill internally if it identifies a code-search subtask whose answer benefits from graph-structural ranking; either entrypoint reaches the same routing logic.
