---
description: "Acquisition and training -- from the web to training data. Firecrawl scraping, corpus construction, embedding fine-tuning, evaluation."
argument-hint: "describe the acquisition task"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Agent
---

# /gather -- Web to Corpus to Training Data to Evaluation

You are entering the acquisition and training workflow. This command handles
Firecrawl-based web scraping, corpus construction, embedding fine-tuning,
NLI training data generation, and evaluation pipelines.

## Step 1: Load Agents

Read these agent files and internalize their expertise:

1. `agents/information-retrieval.md` -- BM25, FAISS, SBERT retrieval patterns
2. `agents/nlp-pipeline.md` -- spaCy, sentence splitting, text cleaning
3. `agents/software-architecture.md` -- RQ tasks, Modal dispatch, deployment patterns
4. `agents/training-pipeline.md` -- triplet construction, hard negative mining, fine-tuning
5. `agents/web-acquisition.md` -- Firecrawl scrape pipeline, content cleaning, rate limiting

## Step 2: Load Patterns

Read these pattern files for executable knowledge about the codebase:

1. `patterns/PATTERNS-firecrawl-corpus.md` -- Firecrawl scraping and corpus construction
2. `patterns/PATTERNS-modal-gpu.md` -- Modal GPU dispatch for batch encoding and training

## Step 3: Read Source (when available)

If `refs/` contains relevant library source, read it before writing code.
Do not rely on training data for library internals. Key areas:

- `refs/` sentence-transformers source for fine-tuning APIs
- `refs/` Firecrawl source for scraping patterns
- The research_api codebase for `file_ingestion.py`, `vector_store.py`,
  `tasks.py`, and any existing scraping infrastructure

## Step 4: Apply Invariants

Before producing any code, verify against CLAUDE.md invariants:

- **Two-Mode Contract**: Production uses spaCy + BM25 + TF-IDF (no PyTorch).
  Scraping and corpus construction can run in production. Embedding
  fine-tuning and batch NLI run on Modal (GPU). Never import PyTorch
  in production code paths.
- **LLMs propose, humans review**: Scraped content enters as draft Objects.
  Training data requires human review before use.
- **SHA-hash identity**: Scraped content uses `_generate_sha()` for
  deduplication and provenance.
- **Every epistemic primitive carries its provenance**: Scraped Objects
  must record their source URL, scrape timestamp, and cleaning steps.

## Step 5: Execute the Task

Work through the user's request using the loaded agent expertise:

1. **Understand the acquisition goal**: What content are we scraping?
   What training data are we building? What model are we fine-tuning?
2. **Route to the right pipeline stage**: Scraping? Cleaning? Corpus
   construction? Triplet generation? Fine-tuning? Evaluation?
3. **Follow Firecrawl patterns**: If scraping, follow
   PATTERNS-firecrawl-corpus.md for rate limiting, content extraction,
   and corpus construction.
4. **Use Modal for GPU work**: If fine-tuning or batch encoding, follow
   PATTERNS-modal-gpu.md for Modal dispatch, checkpoint management,
   and evaluation.
5. **Wire up RQ tasks**: Scraping and corpus construction run as background
   jobs. Follow software-architecture agent guidance for task wiring.

## Typical Tasks

- Build a Firecrawl pipeline to scrape a domain into Objects
- Construct NLI training triplets from scraped claim pairs
- Fine-tune SBERT embeddings on domain-specific corpus via Modal
- Build hard negative mining for contrastive training
- Create evaluation benchmarks for retrieval quality
- Set up corpus deduplication using SHA-hash identity
