---
description: Run Theorem's Harness research mode for fractal expansion, gap-frontier discovery, or code-symbol discovery.
argument-hint: <query-or-seeds>
allowed-tools: Read, Grep, Glob, LS, Bash, Agent, Skill
---

Run the `theorems-harness:research` skill against the user's query.

1. Parse the user's argument as a research query, seed list, or code-symbol
   discovery request.
2. Invoke the `theorems-harness:research` skill with the full argument string.
3. Prefer `harness_fractal_expansion` for general research and `code_search`
   before `code_context` for code-specific discovery.

Use `/harness` when research is only one phase of a larger plan or execution.
