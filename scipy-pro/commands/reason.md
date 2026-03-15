---
description: "Epistemic reasoning -- from raw text to structured claims, tensions, and models. NLP, NLI, knowledge representation, claim analysis."
argument-hint: "describe the reasoning task"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Agent
---

# /reason -- Text to Claims to Tensions to Models

You are entering the epistemic reasoning workflow. This command handles
everything from raw text ingestion through claim extraction, tension detection,
and model formation.

## Step 1: Load Agents

Read these agent files and internalize their expertise:

1. `agents/information-retrieval.md` -- BM25, FAISS, SBERT retrieval patterns
2. `agents/nlp-pipeline.md` -- spaCy, sentence splitting, assertion detection
3. `agents/claim-analysis.md` -- NLI scoring, claim decomposition, epistemic status
4. `agents/knowledge-representation.md` -- Claim/Tension/EpistemicModel schemas
5. `agents/probabilistic-reasoning.md` -- Bayesian updates, confidence calibration

## Step 2: Load Patterns

Read these pattern files for executable knowledge about the codebase:

1. `patterns/PATTERNS-claim-pipeline.md` -- claim extraction and scoring pipeline
2. `patterns/PATTERNS-engine-pass.md` -- 7-pass engine architecture and pass contracts

## Step 3: Read Source (when available)

If `refs/` contains relevant library source, read it before writing code.
Do not rely on training data for library internals. Key areas:

- `refs/` spaCy source for NLP pipeline behavior
- `refs/` sentence-transformers source for SBERT/NLI
- The research_api codebase for `claim_decomposition/`, `advanced_nlp.py`, `engine.py`

## Step 4: Apply Invariants

Before producing any code, verify against CLAUDE.md invariants:

- **Two-Mode Contract**: Production uses spaCy + BM25 + TF-IDF (no PyTorch).
  Local/dev uses full stack. Modal handles batch GPU work. Every NLP feature
  must degrade gracefully.
- **LLMs propose, humans review**: Nothing auto-promotes to canon.
- **Provenance**: Every epistemic primitive carries its provenance.
  Do not bypass `_generate_sha()`.
- **compose_engine is stateless**: text-in, objects-out, no DB writes.
- **engine.py is stateful**: object-in, edges + nodes out.

## Step 5: Execute the Task

Work through the user's request using the loaded agent expertise:

1. **Understand the input**: What text, claims, or objects are we working with?
2. **Route to the right pipeline stage**: Extraction? Tension detection? Model formation?
3. **Write code that respects the pass architecture**: If touching engine passes,
   follow the pass contract from PATTERNS-engine-pass.md.
4. **Validate claim pipeline flow**: If touching claims, follow
   PATTERNS-claim-pipeline.md for extraction, scoring, and status transitions.
5. **Test two-mode behavior**: Ensure production mode works without PyTorch imports.

## Typical Tasks

- Add claim decomposition to compose_engine
- Build NLI-based tension detection between claims
- Create epistemic model formation from clustered claims
- Improve BM25/SBERT hybrid retrieval for claim search
- Add assertion detection to the NLP pipeline
