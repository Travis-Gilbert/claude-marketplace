---
description: Route a code-search question to the most appropriate RustyRed inline graph algorithm (PPR, PageRank, components, or communities). Computes structurally over an adjacency rather than matching strings.
argument-hint: <question-or-code-context>
allowed-tools: Read, Write, Edit, Grep, Glob, LS, Bash, Skill
---

Run the theorems-harness:compute_code skill against the user's input.

1. Parse the user's argument as a natural-language code-search question. If empty, ask the user what code question they want answered before proceeding.
2. Invoke the `theorems-harness:compute_code` skill via the Skill tool, passing the user's argument as the input. The fully-qualified `theorems-harness:compute_code` form disambiguates from this command of the same base name; using the bare `compute_code` form causes the Skill tool to recurse back into this command and hang. The skill body (`skills/compute_code/SKILL.md`) is the authoritative spec for intent-to-algorithm routing.
3. The skill will pick ONE of the four `rustyred_thg.algorithm.*_inline` MCP tools (PPR, PageRank, components, or communities) based on the shape of the question, acquire an adjacency (either from prior context, a tree-sitter pass, or the user), and call the tool.
4. Stream the algorithm choice + one-line justification before showing results, so the user can see whether the routing matched their intent.
5. Return ranked results with provenance: algorithm chosen, seed (for PPR), edge_count, top-K node list.

If the agent determines the question is a pure exact-string lookup (use `Grep`), a request for Theseus's pre-ingested code knowledge (use `code_theorem`), or an adjacency exceeding the inline budget (use the tenant-backed counterpart), the skill explicitly defers rather than forcing a mismatched algorithm.

Orchestrate may also invoke this skill internally if it identifies a code-search subtask whose answer benefits from graph-structural ranking; either entrypoint reaches the same routing logic.
