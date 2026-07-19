---
name: research
description: The Harness research capability. Use when the user wants fractal expansion, gap-frontier discovery, code-symbol discovery, or a compact research brief grounded in Theseus evidence. Reachable as /research or as part of the /harness adaptive loop when the task needs evidence before commitment.
---

# Research

Research is the narrow Harness path for evidence gathering. It does not also
modify files, validate, coordinate, or produce an execution report. For a
task that needs those, route to `/harness` and let the adaptive loop pick
research as one of several capabilities.

## When To Research

Use this capability when the user wants one of:

- fractal expansion from a query or seed set
- gap-frontier discovery before implementation
- a compact research brief grounded in Theseus evidence
- code-symbol discovery before code-context investigation
- a saved research step inside an existing harness run

For a task that will also modify files, validate, or report, use `/harness`.

## Tool Preference

1. Prefer `fractal_expansion` with the query and any seeds. It queues the
   expansion and returns a pollable `run_id` by default; pass `wait=true` for a
   synchronous diagnostic receipt.
2. For code-specific discovery, prefer GraphQL `codeSearch`, then
   `codeContext` or `codeExplain` on the most relevant symbol. If GraphQL is
   unavailable, call `compute_code` with operation `search`, followed by the
   same tool with operation `context` or `explain`.
3. If `fractal_expansion` is unavailable, fall back to the full Theseus search
   or GraphRAG tool available in the host and surface that the direct Harness
   path was unavailable.
4. For raw seed-PK PPR, use `rustyred_thg_algorithm_ppr` (or the `_inline`
   variant over a supplied adjacency) directly.

## Output

Return the useful findings, the evidence or symbol IDs that matter, and the
suggested next Harness action (plan, execute, peer review, encode). Keep it
compact unless the user explicitly asked for a full brief.

## Anti-Patterns

- Producing a 40-source brief when the user asked one question.
- Substituting research for execution when the user said "fix it."
- Reporting evidence without naming the next action.
