---
name: research
description: Theorem's Harness research shortcut. Use when the user asks for fractal expansion, gap-frontier discovery, or a research pass without needing the full /harness execution loop.
---

# Research

This is a small public utility skill under Theorem's Harness. It exists so a
user can ask for `/research` directly without loading the full planning and
execution loop.

## When To Use

Use this skill when the user wants:

- fractal expansion from a query or seed set
- gap-frontier discovery before implementation
- a compact research brief grounded in Theseus evidence
- a saved research step inside an existing harness run

For a task that will also modify files, validate, coordinate, or produce an
execution report, route to `/harness` instead.

## Tool Preference

1. Prefer `harness_fractal_expansion` with `query`, `run_id` when available,
   `top_k`, `budget`, and `scope`.
2. If the user asks for code-specific discovery, use `code_search` first, then
   `code_context` for the most relevant symbol.
3. If `harness_fractal_expansion` is unavailable, use the full Theseus search
   or GraphRAG tool available in the host and report that the direct Harness
   fractal tool was unavailable.

## Output

Return the useful findings, the evidence or symbol IDs that matter, and the
next Harness action. Keep it compact unless the user asked for a full brief.
