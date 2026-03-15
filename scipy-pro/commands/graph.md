---
description: "Graph intelligence -- from objects to structure. Community detection, causal inference, self-organization, gap analysis, embeddings."
argument-hint: "describe the graph task"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Agent
---

# /graph -- Objects to Structure to Self-Organization

You are entering the graph intelligence workflow. This command handles
community detection, causal DAG construction, self-organization feedback
loops, gap analysis, and knowledge graph embeddings.

## Step 1: Load Agents

Read these agent files and internalize their expertise:

1. `agents/knowledge-representation.md` -- Object/Edge schemas, graph primitives
2. `agents/graph-theory.md` -- NetworkX patterns, community detection, centrality
3. `agents/causal-inference.md` -- temporal influence DAGs, causal_engine patterns
4. `agents/probabilistic-reasoning.md` -- Bayesian updates, confidence calibration
5. `agents/self-organization.md` -- 5 feedback loops, entity promotion, edge decay

## Step 2: Load Patterns

Read these pattern files for executable knowledge about the codebase:

1. `patterns/PATTERNS-self-org-loop.md` -- self-organization feedback loop architecture
2. `patterns/PATTERNS-engine-pass.md` -- 7-pass engine architecture and pass contracts

## Step 3: Read Source (when available)

If `refs/` contains relevant library source, read it before writing code.
Do not rely on training data for library internals. Key areas:

- `refs/` NetworkX source for graph algorithms
- `refs/` PyKEEN source for knowledge graph embeddings
- The research_api codebase for `community.py`, `gap_analysis.py`,
  `causal_engine.py`, `self_organize.py`, `temporal_evolution.py`

## Step 4: Apply Invariants

Before producing any code, verify against CLAUDE.md invariants:

- **Two-Mode Contract**: Production uses spaCy + BM25 + TF-IDF (no PyTorch).
  Local/dev uses full stack including FAISS + KGE. Modal handles batch
  re-encoding and KGE training.
- **Edge.reason is plain English**: A human must be able to read it.
- **Edge uses from_object / to_object**: Never source/target.
- **Per-Notebook engine_config**: Controls which passes run.
- **Objects soft-delete only**: Set `is_deleted=True`, never hard delete.
- **engine.py is stateful**: object-in, edges + nodes out.

## Step 5: Execute the Task

Work through the user's request using the loaded agent expertise:

1. **Understand the graph context**: What objects, edges, or communities
   are we working with?
2. **Route to the right subsystem**: Community detection? Causal DAG?
   Self-organization loop? Gap analysis? Embeddings?
3. **Respect the self-org loop architecture**: If touching feedback loops,
   follow PATTERNS-self-org-loop.md for classify, cluster, promote, decay,
   and emergent type patterns.
4. **Follow pass contracts**: If touching engine passes, follow
   PATTERNS-engine-pass.md.
5. **Test two-mode behavior**: Graph algorithms that depend on PyTorch
   (KGE, FAISS) must degrade in production mode.

## Typical Tasks

- Improve Louvain community detection with resolution tuning
- Build causal influence DAGs from temporal object sequences
- Add new self-organization feedback loop (e.g., edge confidence decay)
- Detect structural holes for gap analysis
- Train or update knowledge graph embeddings via Modal
- Add sliding-window graph dynamics to temporal_evolution
