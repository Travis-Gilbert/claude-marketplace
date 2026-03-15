# SciPy-Pro v4: Epistemic Engineering Plugin

You are working on systems that acquire evidence, extract claims, detect
tensions, form models, encode executable knowledge, and revise understanding.
The primary application is research_api, an epistemic engine built in Django.

## Prime Directive

Read the source before writing code. Read refs/ for library internals.
Read the research_api codebase for application patterns. Do not rely on
training data for either.

## Command Routing

/reason  -> text -> claims -> tensions -> models (NLP, NLI, KR)
/graph   -> objects -> structure -> self-organization (graph theory, causal)
/encode  -> evidence -> methods -> runs -> learning (DSL, compilation)
/gather  -> web -> corpus -> training data -> evaluation (Firecrawl, SBERT)

## Agent Loading

Each command loads relevant agents. Agents are reusable across commands.

| Agent | `/reason` | `/graph` | `/encode` | `/gather` |
|---|---|---|---|---|
| information-retrieval | * | | | * |
| nlp-pipeline | * | | | * |
| claim-analysis | * | | * | |
| knowledge-representation | * | * | * | |
| graph-theory | | * | | |
| causal-inference | | * | * | |
| probabilistic-reasoning | * | * | | |
| self-organization | | * | | |
| program-synthesis | | | * | |
| software-architecture | | | * | * |
| training-pipeline | | | | * |
| web-acquisition | | | | * |

## The Epistemic Stack

research_api is evolving from a graph-centered notebook into an epistemic
studio. The current architecture:

### Primitives (apps/notebook/models.py)
  Object          Unit of captured knowledge (10 types)
  Edge            Explained connection (14 types, from_object/to_object)
  Claim           Sentence-sized proposition extracted from an Object
  Question        Durable unit of inquiry organizing evidence
  Tension         Stored contradiction, ambiguity, or unresolved conflict
  EpistemicModel  Explanation with assumptions, scope, failure conditions
  Method          Versioned executable knowledge
  MethodRun       One execution of a Method
  Narrative       Synthesis artifact (memo, brief, story, report)

### Engines
  engine.py             7-pass post-capture graph enrichment
  compose_engine.py     6-pass live write-time discovery
  claim_decomposition   LLM + rule-based claim extraction
  causal_engine.py      Temporal influence DAG construction
  community.py          Louvain community detection
  gap_analysis.py       Structural hole detection
  temporal_evolution.py Sliding-window graph dynamics
  synthesis.py          LLM cluster summarization
  self_organize.py      5 feedback loops (classify, cluster->notebook,
                        entity promotion, edge decay, emergent types)
  canvas_engine.py      Altair/Vega-Lite spec generation

### Infrastructure
  vector_store.py       FAISS indexes (SBERT + KGE)
  advanced_nlp.py       SBERT + CrossEncoder NLI (two-mode safe)
  bm25.py               BM25 lexical index
  adaptive_ner.py       Graph-learned PhraseMatcher
  tasks.py              RQ background jobs (engine, ingestion, default)
  provenance.py         Auditable object history + influence lineage
  file_ingestion.py     PDF, DOCX, images, code (tree-sitter AST)

### Product Loop
  Capture -> Extraction -> Claims/observations -> Connections/tensions
  -> Questions -> Models/methods -> Narratives -> Review/revision -> loop

### Two-Mode Contract (NEVER BREAK THIS)
  PRODUCTION (Railway): spaCy + BM25 + TF-IDF. No PyTorch.
  LOCAL/DEV: All 7 passes. PyTorch + FAISS + SBERT + NLI + KGE.
  MODAL (GPU): Batch re-encoding, KGE training, SAM-2, corpus NLI.

### Architectural Invariants
  1. Edge.reason is a plain-English sentence a human can read.
  2. Edge uses from_object / to_object (not source/target).
  3. Timeline Nodes are immutable (except retrospective_notes).
  4. SHA-hash identity tracks provenance. Don't bypass _generate_sha().
  5. Per-Notebook engine_config controls pass behavior.
  6. Objects soft-delete only (is_deleted=True).
  7. LLMs propose. Humans review. Nothing auto-promotes to canon.
  8. compose_engine is stateless (text-in, objects-out, no DB writes).
  9. engine.py is stateful (object-in, edges + nodes out).
  10. Every epistemic primitive carries its provenance.

## Multi-Agent Routing Examples

"Add claim decomposition to the compose engine":
  1. claim-analysis (understand NLI scoring patterns)
  2. nlp-pipeline (spaCy sentence splitting, assertion detection)
  3. knowledge-representation (Claim model, epistemic status)
  4. software-architecture (compose_engine pass pattern, degradation)

"Build a Firecrawl pipeline that produces NLI training data":
  1. web-acquisition (Firecrawl scrape pipeline, content cleaning)
  2. claim-analysis (claim extraction from scraped content)
  3. training-pipeline (triplet construction, hard negative mining)
  4. software-architecture (RQ task, Modal dispatch for batch NLI)

"Make the self-organization loops smarter about entity promotion":
  1. self-organization (current promotion threshold, feedback loop)
  2. nlp-pipeline (adaptive NER, PhraseMatcher pattern quality)
  3. probabilistic-reasoning (Bayesian promotion threshold)
  4. knowledge-representation (entity -> Object -> Edge cascade)

## Reference Materials

- `patterns/` — Executable knowledge about codebase patterns (8 files)
- `product/` — What's built vs planned, roadmap, design specs (5 files)
- `examples/` — Runnable code examples per workflow (12 files)
- `scripts/bootstrap_refs.sh` — Clone library source repos for refs/
