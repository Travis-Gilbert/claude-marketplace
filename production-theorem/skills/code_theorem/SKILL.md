---
name: code_theorem
description: Investigate code with Theseus epistemic structure. Use when the user asks to understand a codebase area, predict the impact of a change, write a postmortem, detect drift between spec and implementation, or trace process flows. Triggers on phrases like "explain this code", "what does X touch", "impact of changing", "code postmortem", "review context", "what processes use this", "code-context investigation".
---

# code_theorem

Orchestration skill for the Theorem-side `code_*` cluster on the Theorem MCP. Chains the 17 code-context tools into a coherent investigation flow so the agent does not pick them ad hoc.

## When to use

User asks about a codebase area in a way that needs more than `Read`/`Grep`:
- "Why does this code exist? What touches it? What breaks if I change it?"
- "Write a postmortem for the deploy that broke `apps/notebook/ask_pipeline.py`."
- "Show me the spec for this module and where it drifts from the implementation."
- "What processes flow through this file?"

Not for: single-line lookups (use `Grep`), simple file reads (use `Read`), or pure refactors (just edit).

## Tools owned (Theorem MCP, Form-B short names)

| Verb | Purpose |
|---|---|
| `code_status` | High-level summary of what the agent knows about a code area |
| `code_context` | Pull the right slice of code into context (smaller than `code_minimal_context`) |
| `code_minimal_context` | Smallest possible context window for the area |
| `code_explain` | Plain-English explanation of what code does + why |
| `code_impact` | Predicted blast radius of changing X (downstream callers, tests, specs) |
| `code_correlate` | Find what's connected to a code area via federation signals |
| `code_processes` | Trace process flows (BFS from entry points) that touch this area |
| `code_detect_changes` | Diff what's changed since last review baseline |
| `code_review_context` | Build the review context for a PR / change |
| `code_suggested_questions` | What should I ask about this code? |
| `code_spec` | The declared spec for this area (if any) |
| `code_drift` | Where spec and implementation diverge |
| `code_artifact` | Produce a documentable artifact from a code investigation |
| `code_ingest` | Tree-sitter ingest a fresh code area into Theseus |
| `code_postmortem_run` | Build a postmortem from a failure trace |
| `code_postmortem_get` | Retrieve an existing postmortem |
| `code_agent` | Orchestrate a code-agent swarm for larger refactors |

## Standard investigation flow

For "tell me about code area X":

1. `code_status` — what does Theseus already know? Cached spec, prior postmortems, recent ingestion?
2. `code_context` — pull the relevant slice (file + neighbors + relevant claims/tensions).
3. If user asks "what does it do": `code_explain`.
4. If user asks "what changes if I touch it": `code_impact` + `code_correlate`.
5. If user asks "what flows through it": `code_processes`.
6. If user asks "what's broken / wrong": `code_drift` (spec vs impl) + `code_detect_changes`.
7. If a failure happened: `code_postmortem_run` + `code_postmortem_get` for historical context.
8. If user wants a deliverable: `code_artifact` to produce a written summary.

## Output discipline

- Quote file paths + line numbers from the actual code returned by these tools, not generic descriptions.
- When `code_impact` returns downstream callers, name them with paths. "Affects `apps/notebook/ask_pipeline.py:341`" beats "affects the ask pipeline."
- Postmortems should include: what failed, when, why, what fixed it, what's still latent.
- Drift reports should label each divergence: spec wants X, code does Y, evidence is at `<file:line>`.

## Anti-patterns

- Don't call all 17 tools by default. Pick the 2-4 that match the user's question.
- Don't substitute these for `Grep` on simple keyword lookups — they're heavier and slower.
- Don't conflate `code_context` (specific slice) with `code_minimal_context` (smallest possible); pick by what the next step needs.
- Don't use `code_agent` (swarm orchestrator) for single-file investigations; it's for refactors that span 5+ files.

## Pure-graph reads

For raw graph queries on code-related entities (`(:CodeFile)`, `(:CodeMember)`, etc.), call `mcp__rustyred-thg__graph.query` / `graph.neighbors` directly. This skill's tools are for code-context investigation that combines graph + spec + ML signals, not raw graph traversal.
