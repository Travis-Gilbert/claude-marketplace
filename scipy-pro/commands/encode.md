---
description: "Executable knowledge -- from evidence to methods. DSL design, compilation, provenance, promotion pipeline, method execution."
argument-hint: "describe the encoding task"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Agent
---

# /encode -- Evidence to Methods to Runs to Learning

You are entering the executable knowledge workflow. This command handles
DSL design, method compilation, provenance tracking, the promotion pipeline,
and method execution infrastructure.

## Step 1: Load Agents

Read these agent files and internalize their expertise:

1. `agents/claim-analysis.md` -- NLI scoring, claim decomposition, epistemic status
2. `agents/knowledge-representation.md` -- Method/MethodRun schemas, provenance
3. `agents/causal-inference.md` -- causal DAG patterns for method dependencies
4. `agents/program-synthesis.md` -- DSL design, code generation, compilation
5. `agents/software-architecture.md` -- RQ tasks, Modal dispatch, deployment patterns

## Step 2: Load Patterns

Read these pattern files for executable knowledge about the codebase:

1. `patterns/PATTERNS-promotion.md` -- promotion pipeline from evidence to canon
2. `patterns/PATTERNS-method-dsl.md` -- method DSL grammar, compilation, execution

## Step 3: Read Source (when available)

If `refs/` contains relevant library source, read it before writing code.
Do not rely on training data for library internals. Key areas:

- The research_api codebase for Method/MethodRun models, `provenance.py`,
  `tasks.py`, and the promotion pipeline
- `refs/` for any DSL tooling or compilation framework source

## Step 4: Apply Invariants

Before producing any code, verify against CLAUDE.md invariants:

- **Two-Mode Contract**: Production uses spaCy + BM25 + TF-IDF (no PyTorch).
  Method execution must work in production mode for simple methods.
  Complex methods dispatch to Modal for GPU execution.
- **LLMs propose, humans review**: Methods go through the promotion pipeline.
  Nothing auto-promotes to canon.
- **SHA-hash identity**: Provenance tracking uses `_generate_sha()`.
  Do not bypass it.
- **Every epistemic primitive carries its provenance**: Methods and MethodRuns
  must record their full lineage.
- **compose_engine is stateless**: If methods feed into compose_engine,
  respect the text-in, objects-out contract.

## Step 5: Execute the Task

Work through the user's request using the loaded agent expertise:

1. **Understand the knowledge to encode**: What evidence, claims, or patterns
   are being converted into executable form?
2. **Route to the right stage**: DSL design? Method compilation?
   Execution infrastructure? Provenance tracking? Promotion review?
3. **Follow the promotion pipeline**: If building promotion logic, follow
   PATTERNS-promotion.md for the evidence-to-canon lifecycle.
4. **Respect the method DSL**: If designing or extending the DSL, follow
   PATTERNS-method-dsl.md for grammar, compilation, and execution patterns.
5. **Wire up infrastructure**: Methods need RQ tasks for background execution
   and Modal dispatch for GPU-heavy runs. Follow software-architecture
   agent guidance.

## Typical Tasks

- Design or extend the method DSL grammar
- Build the method compilation pipeline (DSL to executable)
- Add provenance tracking to MethodRun outputs
- Implement the promotion pipeline (draft -> reviewed -> canonical)
- Create RQ task wrappers for method execution
- Dispatch batch method runs to Modal for GPU execution
