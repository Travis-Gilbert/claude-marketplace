---
description: Route code ingest, discovery, explanation, specification, drift, feature, or obligation work through Harness GraphQL first, with real flat MCP tools and inline graph algorithms as fallbacks.
argument-hint: <question-or-code-context>
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash, Skill
---

Run the theorems-harness:compute_code skill against the user's input.

1. Parse the user's argument as a natural-language code-search question. If empty, ask the user what code question they want answered before proceeding.
2. Invoke the `theorems-harness:compute_code` skill via the Skill tool, passing the user's argument as the input. The fully-qualified `theorems-harness:compute_code` form disambiguates from this command of the same base name; using the bare `compute_code` form causes the Skill tool to recurse back into this command and hang. The skill body (`skills/compute_code/SKILL.md`) is the authoritative spec for intent-to-algorithm routing.
3. The skill will prefer GraphQL `ingestCodebase`, `reindexCodebase`,
   `codeStatus`, `codeSearch`, `codeContext`, `codeExplain`, `codeSpec`,
   `codeDrift`, `codeFeatures`, and `codeObligations`.
4. When GraphQL is unavailable, use `compute_code` operations `kg_status`,
   `search`, `context`, or `explain`; `code_ingest` operations `ingest` or
   `reindex`; and the real compiler tools `code_compile_spec`,
   `code_spec_drift`, `code_extract_features`, and
   `code_implementation_obligations`.
5. Use inline graph algorithms only when the user supplied an adjacency map or explicitly asked for centrality/components/communities over a graph.
6. Stream the route choice + one-line justification before showing results, so the user can see whether the routing matched their intent.
7. Return results with provenance: route, field/operation or algorithm,
   query/seed, repository revision, top-K node list where relevant, and receipt,
   missing-evidence, or graph evidence when returned.

If the agent determines the question is a pure exact-string lookup (use `Grep`)
or an adjacency exceeds the inline budget (use the tenant-backed counterpart),
the skill explicitly defers rather than forcing a mismatched algorithm.

Orchestrate may also invoke this skill internally if it identifies a code-search subtask whose answer benefits from graph-structural ranking; either entrypoint reaches the same routing logic.
