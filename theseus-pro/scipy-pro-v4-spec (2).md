# SciPy-Pro v4: Epistemic Engineering Plugin for Claude Code

> A Claude Code plugin organized around the computer science disciplines
> required to build systems for structured understanding — grounded in
> framework source code and the research_api epistemic engine where these
> techniques converge.

**Version**: 4.0 (March 2026)

**Design shift from v3**: v3 was organized around scientific Python
disciplines (embedding engineer, graph scientist) with research_api as
the application context. v4 is organized around **epistemic engineering
workflows** — the CS skills needed to build systems that acquire evidence,
extract claims, detect tensions, form models, encode executable knowledge,
and revise understanding. The plugin teaches Claude Code how to think about
these problems, not just how to edit these files.

---

## The Problem This Plugin Solves

Building an epistemic engine requires simultaneous competence in at least
eight CS subdisciplines:

| Discipline | What it contributes |
|---|---|
| Information Retrieval | Finding relevant evidence (BM25, TF-IDF, FAISS, re-ranking) |
| Natural Language Processing | Extracting claims and entities from text (NER, NLI, SBERT) |
| Knowledge Representation | Structuring what's known (ontologies, KGE, graph schemas) |
| Graph Theory | Discovering structure (community detection, centrality, DAGs) |
| Probabilistic Reasoning | Managing uncertainty (Bayesian decay, model scoring, evidence weighting) |
| Program Synthesis | Encoding executable knowledge (Method DSL, rule compilation) |
| Causal Inference | Tracing intellectual lineage (temporal precedence, intervention logic) |
| Software Architecture | Making it all work (two-mode deployment, queues, caching, degradation) |

No single Claude Code session holds all of this in context. This plugin
encodes the patterns, the source references, and the architectural
constraints so Claude Code can work fluently across all eight without
re-learning each time.

---

## Four Commands, Many Agents

### Command Architecture

v4 uses **4 commands** that map to epistemic workflows, not file structures.
Each command loads a set of agents appropriate for that workflow.

```
/reason    Epistemic reasoning: from raw text to structured claims, tensions,
           and models. NLP, NLI, knowledge representation, claim analysis.

/graph     Graph intelligence: from objects to structure. Community detection,
           causal inference, self-organization, gap analysis, embeddings.

/encode    Executable knowledge: from evidence to methods. DSL design,
           compilation, provenance, promotion pipeline, method execution.

/gather    Acquisition and training: from the web to training data. Firecrawl
           scraping, corpus construction, embedding fine-tuning, evaluation.
```

### Agent Loading

Each command loads relevant agents. Agents are reusable across commands.

| Agent | `/reason` | `/graph` | `/encode` | `/gather` |
|---|---|---|---|---|
| information-retrieval | ● | | | ● |
| nlp-pipeline | ● | | | ● |
| claim-analysis | ● | | ● | |
| knowledge-representation | ● | ● | ● | |
| graph-theory | | ● | | |
| causal-inference | | ● | ● | |
| probabilistic-reasoning | ● | ● | | |
| self-organization | | ● | | |
| program-synthesis | | | ● | |
| software-architecture | | | ● | ● |
| training-pipeline | | | | ● |
| web-acquisition | | | | ● |

---

## CLAUDE.md (Plugin Root Config)

```markdown
# SciPy-Pro v4: Epistemic Engineering Plugin

You are working on systems that acquire evidence, extract claims, detect
tensions, form models, encode executable knowledge, and revise understanding.
The primary application is research_api, an epistemic engine built in Django.

## Prime Directive

Read the source before writing code. Read refs/ for library internals.
Read the research_api codebase for application patterns. Do not rely on
training data for either.

## Command Routing

/reason  → text → claims → tensions → models (NLP, NLI, KR)
/graph   → objects → structure → self-organization (graph theory, causal)
/encode  → evidence → methods → runs → learning (DSL, compilation)
/gather  → web → corpus → training data → evaluation (Firecrawl, SBERT)

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
  self_organize.py      5 feedback loops (classify, cluster→notebook,
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
  Capture → Extraction → Claims/observations → Connections/tensions
  → Questions → Models/methods → Narratives → Review/revision → loop

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
```

---

## AGENTS.md (Agent Registry)

```markdown
# SciPy-Pro v4 Agent Registry

## Agents by CS Discipline

### information-retrieval.md
  BM25, TF-IDF, FAISS ANN, re-ranking, query expansion.
  The science of finding relevant evidence in a corpus.

### nlp-pipeline.md
  spaCy, SBERT, tokenization, NER, adaptive NER, text pipelines.
  The science of extracting structure from natural language.

### claim-analysis.md
  NLI (CrossEncoder), claim decomposition, stance detection, claim pairing.
  The science of propositional reasoning over extracted claims.

### knowledge-representation.md
  Ontologies, KGE (PyKEEN RotatE), graph schemas, epistemic primitives,
  the promotion pipeline, epistemic status tracking.
  The science of structuring what is known and what is uncertain.

### graph-theory.md
  NetworkX, community detection (Louvain/Leiden), centrality, paths,
  spectral methods, structural holes, bipartite graphs.
  The science of discovering structure in relationship data.

### causal-inference.md
  Temporal precedence, influence DAGs, lineage tracing, provenance chains.
  The science of tracing how ideas influenced each other.

### probabilistic-reasoning.md
  Bayesian edge decay, Beta-Binomial engagement models, evidence weighting,
  model scoring, uncertainty quantification.
  The science of managing what you don't know.

### self-organization.md
  Feedback loops, emergent classification, entity promotion, cluster→notebook,
  edge evolution, emergent type detection.
  The science of systems that modify their own structure.

### program-synthesis.md
  Method DSL design, rule compilation, protocol extraction, checklist
  generation, evaluator runtime, method versioning.
  The science of turning knowledge into executable procedures.

### software-architecture.md
  Two-mode deployment, RQ task queues, Redis caching, Modal GPU dispatch,
  graceful degradation, memory budgets, Django patterns.
  The engineering of making epistemic systems run.

### training-pipeline.md
  SBERT fine-tuning, triplet construction, evaluation metrics, domain
  adaptation, corpus preparation, active learning.
  The science of improving models from accumulated knowledge.

### web-acquisition.md
  Firecrawl scraping, content extraction, corpus building, source typing,
  PDF parsing, code repo ingestion, dataset handling.
  The engineering of getting evidence into the system.

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
  4. knowledge-representation (entity → Object → Edge cascade)
```

---

## Agent Definitions

### information-retrieval.md

**Discipline**: Finding relevant evidence in a growing corpus.

**Core CS concepts**:
- **BM25**: Term frequency saturation (k1) prevents term-stuffing.
  Document length normalization (b) prevents long documents from
  dominating. IDF weights rare terms higher. This is the formula behind
  Elasticsearch and Lucene.
- **TF-IDF**: Simpler predecessor. Sublinear TF (1 + log(tf)) helps
  but lacks BM25's saturation. Useful as a fast corpus-wide matrix.
- **FAISS ANN**: Approximate nearest neighbor search in embedding space.
  IndexFlatIP for exact brute-force. IndexIVFFlat for clustered search.
  IndexIVFPQ for compressed storage. HNSW for graph-based approximate.
- **Re-ranking**: Two-stage retrieval. Fast first pass (BM25/FAISS)
  returns candidates. Slower second pass (cross-encoder) re-scores.
- **Query expansion**: Add related terms to improve recall. Can use
  entity resolution, synonym expansion, or pseudo-relevance feedback.
- **Reciprocal rank fusion**: Merge ranked lists from multiple signals.
  RRF(d) = Σ 1/(k + rank_i(d)). Simple, effective, parameter-light.

**research_api implementation**:
- `bm25.py`: BM25Index with module-level caching, k1=1.5, b=0.75
  (b tunable via Novelty Dial). `explain_match()` returns highest-IDF
  overlapping terms for edge explanations.
- `engine.py` Pass 3: Jaccard keyword overlap (retained for speed)
- `engine.py` Pass 4: TF-IDF via sklearn (production-safe)
- `vector_store.py`: FAISS indexes for SBERT and KGE embeddings.
  `faiss_find_similar_objects()` and `faiss_find_similar_text()`.
- `compose_engine.py`: Ordered multi-pass retrieval with candidate
  merging by maximum score. Each pass adds to a shared results_map.

**Scaling guidance**:
  <1K objects: brute-force everything
  1K–10K: BM25 + FAISS IndexFlatIP
  10K–100K: BM25 + FAISS IndexIVFFlat, consider pgvector
  100K+: dedicated vector DB, consider managed search

**Refs**: `refs/rank-bm25/`, `refs/faiss/`, `refs/scikit-learn/`,
`refs/research_api/apps/notebook/bm25.py`,
`refs/research_api/apps/notebook/vector_store.py`

---

### nlp-pipeline.md

**Discipline**: Extracting structure from natural language.

**Core CS concepts**:
- **Named Entity Recognition**: Sequence labeling (spaCy's NER uses
  a transition-based parser). Entity types: PERSON, ORG, GPE, LOC,
  EVENT, WORK_OF_ART, DATE. Each maps to an ObjectType.
- **Adaptive NER**: Graph-learned PhraseMatcher adds a second tier.
  Aho-Corasick internally: O(n) in text length regardless of pattern
  count. The knowledge graph teaches the NER what to look for.
- **Sentence embeddings**: SBERT (bi-encoder) produces fixed-size
  vectors. all-MiniLM-L6-v2 (384d, fast). E5 (instruction-tuned,
  "search_query:" / "search_document:" prefixes). Nomic (long context).
- **Cross-encoders**: Score a pair directly. More accurate than
  bi-encoder cosine for NLI and re-ranking. Cannot pre-compute.
- **Tokenization**: subword (BPE, WordPiece) vs word-level. spaCy
  uses rule-based + statistical. Transformers use subword.

**research_api implementation**:
- `embeddings.py`: spaCy en_core_web_md (300d GloVe vectors)
- `advanced_nlp.py`: all-MiniLM-L6-v2 (SBERT), CrossEncoder NLI
  (nli-distilroberta-base). HAS_PYTORCH flag. Lazy loading with locks.
- `adaptive_ner.py`: PhraseMatcher per ObjectType from Object titles.
  30-min cache TTL, signal-driven invalidation on Object create/delete.
- `engine.py` Pass 1: spaCy NER + adaptive NER → ResolvedEntity records
- `engine.py` Pass 5: SBERT → semantic Edge records (via FAISS when available)

**Two-mode pattern** (every NLP feature must follow this):
```python
try:
    from apps.research.advanced_nlp import sentence_similarity
    _FEATURE_AVAILABLE = True
except ImportError:
    _FEATURE_AVAILABLE = False
```

**Refs**: `refs/spacy/`, `refs/sentence-transformers/`,
`refs/research_api/apps/research/advanced_nlp.py`,
`refs/research_api/apps/notebook/adaptive_ner.py`

---

### claim-analysis.md

**Discipline**: Propositional reasoning — breaking text into claims
and determining whether claims support, contradict, or are neutral
to each other.

**Core CS concepts**:
- **Natural Language Inference (NLI)**: 3-class classification over
  (premise, hypothesis) pairs: entailment, contradiction, neutral.
  CrossEncoder models score directly. SNLI, MultiNLI are training sets.
- **Claim decomposition**: Breaking paragraphs into atomic, falsifiable
  propositions. Two approaches: LLM-based (more accurate, higher latency)
  and rule-based (sentence splitting + assertion heuristics).
- **Stance detection**: Aggregating claim-pair NLI scores to determine
  the overall stance of one source toward another. Support graph vs
  attack graph.
- **Epistemic status tracking**: Claims are not all equal. Status values:
  captured → parsed → candidate → reviewed → accepted → contested → stale.
  The system must never flatten uncertainty into false confidence.

**research_api implementation**:
- `claim_decomposition.py`: `decompose_claims(text)` uses LLM when
  CLAIM_DECOMPOSITION_LLM=true, else rule-based sentence filtering.
  Assertion hints via regex. Deduplication. Max 20 claims per text.
- `advanced_nlp.py`: `analyze_pair(text_a, text_b)` returns similarity,
  NLI probabilities, and tension_signal (high when similar AND contradictory).
- `engine.py` Pass 6: Claim-level NLI. Decomposes both Objects into claims,
  scores claim pairs, creates `supports`/`contradicts` edges with
  claim-pair quotes in the reason field.
- `compose_engine.py` NLI pass: Refines top-N candidates (doesn't discover
  new ones). Reports contradiction_prob and entailment_prob.

**The key insight**: Claim-level NLI catches contradictions between specific
statements even when the overall texts are on different topics. Paragraph-level
NLI misses "both texts are about urban planning but disagree on induced demand."

**Refs**: `refs/sentence-transformers/` (CrossEncoder),
`refs/research_api/apps/notebook/claim_decomposition.py`,
`refs/research_api/apps/research/advanced_nlp.py`

---

### knowledge-representation.md

**Discipline**: Structuring what is known and what is uncertain.
How to represent entities, relations, claims, models, and methods
in a computable form.

**Core CS concepts**:
- **Knowledge Graph Embeddings (KGE)**: Learn vector representations
  of entities and relations. RotatE models relations as rotations in
  complex space. DE-SimplE adds temporal awareness. Training data:
  (head, relation, tail) triples from Edge records.
- **Ontology design**: Types, subtypes, properties, constraints.
  ObjectType as a lightweight ontology. ComponentType for structured
  properties. The promotion pipeline as type evolution.
- **Epistemic primitives**: The minimal set of concepts needed to
  represent structured understanding:
  - **Claim**: a proposition that can be true, false, or uncertain
  - **Question**: an inquiry that organizes claims as evidence
  - **Tension**: an unresolved conflict between claims or models
  - **Model**: an explanation with assumptions, scope, and failure conditions
  - **Method**: executable knowledge with versioning and provenance
  - **Narrative**: a synthesis that turns understanding into communication

**research_api implementation**:
- `models.py`: Claim, Question, Tension, EpistemicModel, Method,
  MethodRun, Narrative models with FK links to Objects and provenance.
- `vector_store.py`: KGE embeddings loaded from `kge_embeddings/`,
  queried via FAISS. `kge_store.find_similar_entities(sha_hash)`.
- `scripts/train_kge.py`: Offline RotatE training via PyKEEN.
  Temporal profiles via time-bucketed embedding snapshots.
- Edge types encode epistemic relationships: supports, contradicts,
  entailment, causal, structural, similarity, shared_entity, mentions.
- The promotion pipeline: captured → parsed → extracted → reviewed →
  promoted → compiled → learned from. This is the mechanism that turns
  stored information into encoded knowledge.

**The missing piece the spec identifies**: Most of the system is strong
at *capture* and *connection*. The next stage requires *promotion* —
a queue-mediated process where extracted claims, entities, and method
candidates are reviewed before entering the canonical knowledge base.

**Refs**: `refs/pykeen/`, `refs/research_api/apps/notebook/models.py`,
`refs/research_api/apps/notebook/vector_store.py`

---

### graph-theory.md

**Discipline**: Discovering structure in relationship data.

**Core CS concepts**:
- **Community detection**: Louvain maximizes modularity greedily.
  Leiden fixes Louvain's tendency to produce poorly-connected communities.
  Resolution parameter controls granularity.
- **Centrality**: PageRank (global importance), betweenness (bridge nodes),
  eigenvector (connected to important nodes), degree (local connectivity).
- **Personalized PageRank (PPR)**: Importance relative to a seed node.
  Run PPR seeded from the Object being edited → ranks everything by
  reachability from current context. Better than static scoring.
- **Structural holes**: Burt's constraint measures how much a node bridges
  otherwise disconnected groups. Low constraint = high brokerage.
  Gap analysis between communities reveals where knowledge is missing.
- **Spectral methods**: Graph Laplacian eigenvalues reveal structure.
  Fiedler vector (2nd smallest eigenvalue) is the optimal graph bisection.
  Spectral wavelets give multi-scale views.
- **DAG construction**: Directed acyclic graphs for temporal ordering.
  Topological sort for prerequisite chains. Transitive reduction for
  minimal edge sets.

**research_api implementation**:
- `graph.py`: Bipartite NetworkX graph (source↔content). PageRank,
  shortest path, reading order. 5-minute cache with signal invalidation.
- `community.py`: Louvain community detection. `detect_communities()`
  returns modularity + community assignments. `persist_communities()`
  writes Cluster records.
- `gap_analysis.py`: Structural hole detection between communities.
- `causal_engine.py`: `build_influence_dag()` constructs a forward-in-time
  DAG from support/entailment edges with temporal precedence.
- `temporal_evolution.py`: Sliding-window graph dynamics. Snapshots of
  the graph at different time windows to track evolution.
- `self_organize.py`: Uses community detection output to drive
  notebook formation, entity promotion, and emergent type detection.

**Refs**: `refs/networkx/`, `refs/research_api/apps/notebook/community.py`,
`refs/research_api/apps/notebook/causal_engine.py`,
`refs/research_api/apps/notebook/gap_analysis.py`

---

### causal-inference.md

**Discipline**: Tracing how ideas influenced each other over time.

**Core CS concepts**:
- **Temporal precedence**: A can only influence B if A was captured before B.
  Necessary but not sufficient for causation.
- **Influence DAGs**: Directed acyclic graphs where edges represent
  intellectual influence. Built from support/entailment edges filtered
  by temporal ordering.
- **Provenance chains**: SHA-linked timeline of every event that affected
  an Object. "This essay exists because of a hunch from March 1, connected
  to 3 sources on March 3, extended on March 7, clustered on March 10."
- **Lineage tracing**: BFS over the influence DAG in either direction.
  Ancestors: what influenced this? Descendants: what did this influence?

**research_api implementation**:
- `causal_engine.py`: `build_influence_dag()` filters support/entailment
  edges by temporal precedence, prunes redundant paths, returns
  {nodes, edges, roots, leaves}. `trace_lineage()` does BFS.
- `provenance.py`: `trace_provenance()` combines timeline history +
  causal lineage + contradiction edges + cluster history into an
  auditable object story. `generate_provenance_narrative()` produces
  a compact English summary.
- `engine.py` Pass 7: Causal lineage pass creates forward-in-time
  influence edges from claim-level support transfer.

**Refs**: `refs/research_api/apps/notebook/causal_engine.py`,
`refs/research_api/apps/notebook/provenance.py`

---

### probabilistic-reasoning.md

**Discipline**: Managing uncertainty — what you know, what you don't,
and how confident you should be.

**Core CS concepts**:
- **Bayesian edge decay**: Model edge strength as Beta(α, β). User
  engagement (click, confirm) increases α. Absence increases β.
  Expected strength = α/(α+β). Exponential decay as a simpler proxy.
- **Evidence weighting**: Not all claims are equal. Recency, source
  reliability, corroboration count, and contradiction count all affect
  how much weight a claim should carry in a model.
- **Model scoring**: An EpistemicModel's confidence depends on the
  strength of its support graph vs its attack graph. Bayesian belief
  networks formalize this.
- **Uncertainty quantification**: The system should display confidence
  intervals, not point estimates. A claim supported by 1 source is
  less certain than one supported by 5, even if the 1 source is strong.

**research_api implementation**:
- `self_organize.py` `evolve_edges()`: Exponential decay with 60-day
  half-life. Below MIN_EDGE_STRENGTH (0.05), edges are pruned.
  Timeline Node records the pruning event.
- `resurface.py`: Signal scoring is currently static weights. Planned:
  PPR-based scoring, Bayesian signal weight learning from engagement.
- `engine.py` `interpolate_config()`: Novelty Dial scales all thresholds
  between conservative (0.0) and aggressive (1.0).

**Refs**: `refs/research_api/apps/notebook/self_organize.py`,
`refs/research_api/apps/notebook/resurface.py`

---

### self-organization.md

**Discipline**: Building systems that modify their own structure in
response to their own outputs.

**The five implemented loops** (in `self_organize.py`):

1. **Auto-classify**: `auto_classify_batch()` assigns ObjectTypes to
   newly ingested objects based on content analysis.

2. **Cluster → Notebook**: When Louvain finds a community of 5+ objects
   with modularity ≥ 0.15, and >30% of members are unassigned, create
   a Notebook. Only unassigned objects are moved (non-destructive).

3. **Entity promotion**: When adaptive NER finds the same entity in 5+
   different Objects and no Object exists for it, auto-create one. The
   new Object participates in future engine passes → feedback loop.

4. **Edge decay**: Exponential decay (60-day half-life) on auto-generated
   edges. Below 0.05 strength, edges are pruned with a Timeline event.
   Simulates "the graph forgets what you don't engage with."

5. **Emergent type detection**: When a cluster of 8+ objects is >70%
   Notes with shared properties (e.g., URLs from the same domain),
   suggest a new ObjectType.

**Orchestration**:
- `organize_batch()`: Runs on new object batches (classify + cluster +
  promote). Called from ingestion tasks.
- `periodic_reorganize()`: Runs graph-wide (all 5 loops). Scheduled
  nightly via `ENABLE_SELF_ORGANIZE_SCHEDULER`.
- `preview_*` functions: Non-mutating previews of what each loop would do.
  Powers the `/self-organize/preview/` endpoint.

**Refs**: `refs/research_api/apps/notebook/self_organize.py`,
`refs/research_api/apps/notebook/auto_classify.py`

---

### program-synthesis.md

**Discipline**: Turning knowledge into executable procedures.

**Core CS concepts**:
- **Domain-Specific Language (DSL)**: A restricted language for expressing
  methods. Not Turing-complete. Declarative where possible. The Method
  model stores definition as structured JSON.
- **Rule compilation**: Sources can sometimes be promoted into executable
  forms: a paper → benchmark protocol, a law → rule set, a design guide
  → checklist, a field method → scoring function.
- **Method versioning**: Methods evolve. Each version is a snapshot with
  provenance (which source, which claims, which review).
- **Evaluation**: MethodRun records input, output, and provenance.
  Outcomes can feed back into the learning layer.

**research_api implementation**:
- `models.py`: Method (definition, version, provenance, linked Objects),
  MethodRun (input, output, status, duration). Both carry SHA hashes.
- The Method DSL is early-stage. The spec recommends a narrow but real
  implementation in one domain pack (computer_science or built_environment).
- The promotion pipeline mediates: sources are reviewed, accepted,
  then optionally compiled into Methods.

**The vision**: "A compiler spec becomes a validator. A field method
becomes a scoring function. A law becomes a rule set." This is the
bridge from stored information to encoded knowledge.

**Refs**: `refs/research_api/apps/notebook/models.py`

---

### software-architecture.md

**Discipline**: Making epistemic systems run in production.

**Two-mode contract** (NEVER BREAK THIS):
```
PRODUCTION (Railway): spaCy + BM25 + TF-IDF + sklearn. No PyTorch.
  Memory per gunicorn worker: ~512MB. spaCy en_core_web_md: ~40MB.
  Two workers = tight. Don't casually add models.

LOCAL/DEV: All 7 engine passes. PyTorch + FAISS + SBERT + NLI + KGE.

MODAL (GPU): Batch re-encoding, KGE training, SAM-2 image analysis,
  corpus-wide NLI. Dispatched via httpx from RQ tasks.
```

**RQ task queues** (Redis-backed via django-rq):
  `engine` — Connection engine runs (timeout 600s)
  `ingestion` — Heavy file processing (timeout 120s)
  `default` — Index rebuilds, notifications, self-organize, cleanup

**Caching layers**:
  Module-level caches: BM25 index (1hr TTL), TF-IDF matrix (1hr),
  FAISS indexes (rebuilt on demand), adaptive NER matchers (30min),
  graph cache (5min with signal invalidation).
  Redis cache: shared across workers when available.

**Graceful degradation pattern**:
```python
try:
    from apps.research.advanced_nlp import <function>
    _FEATURE_AVAILABLE = True
except Exception:
    _FEATURE_AVAILABLE = False
```

**Refs**: `refs/research_api/config/`, `refs/research_api/requirements/`,
`refs/research_api/apps/notebook/tasks.py`

---

### training-pipeline.md

**Discipline**: Improving models from accumulated knowledge.

**Core CS concepts**:
- **Triplet construction**: (anchor, positive, negative) from Edge data.
  Edges with strength > 0.7 → positive pairs. Objects in different
  clusters with no edges → hard negatives.
- **Active learning**: Focus labeling effort on uncertain examples.
  Claims near the NLI decision boundary are most informative.
- **Domain adaptation**: Fine-tune a general SBERT model on the user's
  corpus. The Object + Edge corpus is the training set.
- **Evaluation**: Precision@k, Recall@k, MRR, NDCG for retrieval.
  Claim-level F1 for NLI. Edge prediction accuracy for KGE.

**research_api training data sources**:
- Edge triples: (from_object.sha_hash, edge_type, to_object.sha_hash)
- Claim pairs: decomposed claims + NLI labels from engine Pass 6
- User engagement: which edges were confirmed, dismissed, or ignored
- Community assignments: cluster membership as weak supervision

**The recommended learning order** (from the transition spec):
1. **Retrieval learning**: Improve BM25/SBERT ranking from engagement
2. **Knowledge learning**: Update world model from review and revision
3. **Model training**: Fine-tune ML models for extraction, classification

**Refs**: `refs/sentence-transformers/`,
`refs/research_api/scripts/train_kge.py`

---

### web-acquisition.md

**Discipline**: Getting evidence into the system from the web.

**Core CS concepts**:
- **Content extraction**: Convert web pages to clean text. Strip nav,
  ads, boilerplate. Firecrawl outputs clean markdown.
- **Source typing**: Different sources need different parsers. URL →
  content extraction. PDF → OCR + section parsing. Repo → file graph
  + symbols + docs. Audio → transcript. Dataset → schema + metrics.
- **Corpus construction**: Building training data from scraped content.
  Claim extraction from articles. Entity co-occurrence from documents.
  Contradiction pairs from editorial vs. research sources.
- **Rate limiting and failure handling**: Paywalls, 404s, rate limits.
  Flag `scrape_blocked=True`. Queue retries with backoff.

**research_api implementation**:
- `file_ingestion.py`: Handles PDF, DOCX, PPTX, XLSX, images (OCR +
  SAM-2 via Modal), code files (tree-sitter AST), plain text, markdown.
- `services.py`: Capture orchestration. URL enrichment (OG metadata).
  RQ task dispatch with inline fallback.
- Object.url + og_title/og_description/og_image/og_site_name fields
  store extraction results.

**Firecrawl pipeline for training data**:
1. Scrape URLs via Firecrawl → clean markdown
2. Decompose claims from scraped content
3. Run NLI on claim pairs across sources
4. Construct training triplets from high-confidence pairs
5. Fine-tune SBERT on domain-specific triplets
6. Evaluate retrieval quality improvement

**Refs**: `refs/firecrawl/`, `refs/research_api/apps/notebook/file_ingestion.py`,
`refs/research_api/apps/notebook/services.py`

---

## Directory Structure

```
SciPy-Pro/
├── CLAUDE.md                           # Plugin root config
├── AGENTS.md                           # Agent registry and routing
├── install.sh                          # Setup script
│
├── agents/                             # 12 agents by CS discipline
│   ├── information-retrieval.md
│   ├── nlp-pipeline.md
│   ├── claim-analysis.md
│   ├── knowledge-representation.md
│   ├── graph-theory.md
│   ├── causal-inference.md
│   ├── probabilistic-reasoning.md
│   ├── self-organization.md
│   ├── program-synthesis.md
│   ├── software-architecture.md
│   ├── training-pipeline.md
│   └── web-acquisition.md
│
├── refs/                               # Library source + application code
│   ├── research_api/                   # Symlink to the codebase
│   ├── sentence-transformers/          # SBERT source
│   ├── networkx/                       # Graph algorithm source
│   ├── spacy/                          # NER and pipeline internals
│   ├── scikit-learn/                   # TF-IDF, clustering
│   ├── faiss/                          # ANN index internals
│   ├── pykeen/                         # KGE training
│   ├── pytorch/                        # Deep model internals (shallow)
│   ├── rank-bm25/                      # BM25 reference implementation
│   ├── firecrawl/                      # Web scraping pipeline
│   └── tree-sitter/                    # Code file AST parsing
│
├── patterns/                           # Executable knowledge about patterns
│   ├── PATTERNS-two-mode-deployment.md # The most critical pattern
│   ├── PATTERNS-engine-pass.md         # How to add a pass to either engine
│   ├── PATTERNS-self-org-loop.md       # How to add a feedback loop
│   ├── PATTERNS-claim-pipeline.md      # Text → claims → NLI → edges
│   ├── PATTERNS-promotion.md           # captured → reviewed → promoted
│   ├── PATTERNS-method-dsl.md          # Knowledge → executable method
│   ├── PATTERNS-firecrawl-corpus.md    # Web → training data pipeline
│   └── PATTERNS-modal-gpu.md           # Serverless GPU dispatch
│
├── examples/                           # Runnable code examples
│   ├── reason/                         # /reason examples
│   │   ├── claim-decomposition.py
│   │   ├── nli-pair-scoring.py
│   │   └── tension-detection.py
│   ├── graph/                          # /graph examples
│   │   ├── community-detection.py
│   │   ├── influence-dag.py
│   │   └── structural-holes.py
│   ├── encode/                         # /encode examples
│   │   ├── method-from-source.py
│   │   ├── promotion-pipeline.py
│   │   └── rule-compilation.py
│   └── gather/                         # /gather examples
│       ├── firecrawl-to-corpus.py
│       ├── triplet-construction.py
│       └── sbert-fine-tune.py
│
└── product/
    ├── epistemic-status.md             # What's built vs planned
    ├── promotion-pipeline.md           # The missing piece
    ├── method-dsl-design.md            # Executable knowledge DSL
    ├── domain-pack-spec.md             # CS, built environment, etc.
    └── learning-roadmap.md             # retrieval → knowledge → training
```

---

## Workflow Patterns

### PATTERNS-engine-pass.md

How to add a pass to either engine:

**engine.py (post-capture, writes to DB)**:
```python
def _run_<name>_engine(obj, config):
    """<description>. <two-mode note>."""
    if not _FEATURE_AVAILABLE:
        return []
    threshold = config.get('<name>_threshold', 0.5)
    new_edges = []
    # ... find matches ...
    for match in matches:
        reason = _llm_explanation(obj, match, strength=score) or fallback_reason
        edge, created = Edge.objects.get_or_create(
            from_object=obj, to_object=match,
            edge_type='<type>',
            defaults={
                'reason': reason,
                'strength': round(score, 4),
                'is_auto': True,
                'engine': '<name>',
            },
        )
        if created:
            new_edges.append(edge)
    return new_edges
```

**compose_engine.py (live query, no DB writes)**:
```python
if '<name>' in pass_order:
    matched_ids: set[int] = set()
    if not <feature>_available:
        _append_pass_state(pass_states, '<name>',
            status='degraded', match_count=0,
            degraded_reason='<name>_unavailable')
    else:
        try:
            # ... find matches ...
            for match in matches:
                _merge_candidate(results_map,
                    pk=match.pk, score=score,
                    signal='<name>', explanation=reason)
                matched_ids.add(match.pk)
        except Exception as exc:
            logger.debug('Compose <name> pass skipped: %s', exc)
        _append_pass_state(pass_states, '<name>',
            status='complete', match_count=len(matched_ids))
```

### PATTERNS-self-org-loop.md

How to add a self-organization feedback loop:

```
1. Detection: Identify a pattern in the graph (community, frequency,
   property distribution, behavior)
2. Proposal: Generate a structural change (new notebook, new object,
   new type, edge modification)
3. Threshold: Apply a minimum quality gate (modularity, mention count,
   homogeneity, confidence)
4. Mutation: Apply the structural change (only if threshold met)
5. Cascade: The mutation changes what the engine sees on the next pass
6. Preview: Provide a non-mutating preview endpoint for the UI
```

### PATTERNS-firecrawl-corpus.md

How to build training data from web scraping:

```
1. Define the domain (URLs, site patterns, content types)
2. Scrape via Firecrawl → clean markdown per source
3. Store as Objects with capture_method='api', type='source'
4. Run claim decomposition → Claim records per Object
5. Run pairwise NLI on claims across sources → support/contradict labels
6. Filter high-confidence pairs (>0.8 entailment or >0.7 contradiction)
7. Construct triplets: (claim_a, supporting_claim_b, contradicting_claim_c)
8. Fine-tune SBERT on triplets → domain-adapted embedding model
9. Rebuild FAISS index with new embeddings
10. Evaluate retrieval quality (Precision@10, MRR, human judgment)
```

---

## What's Built vs Planned

| Capability | Status | Key File(s) |
|---|---|---|
| 7-pass connection engine | ✅ Built | `engine.py` |
| 6-pass compose engine | ✅ Built | `compose_engine.py` |
| Adaptive NER | ✅ Built | `adaptive_ner.py` |
| BM25 index | ✅ Built | `bm25.py` |
| FAISS vector store | ✅ Built | `vector_store.py` |
| Claim decomposition | ✅ Built | `claim_decomposition.py` |
| Causal influence DAG | ✅ Built | `causal_engine.py` |
| Provenance tracing | ✅ Built | `provenance.py` |
| Community detection | ✅ Built | `community.py` |
| Gap analysis | ✅ Built | `gap_analysis.py` |
| Temporal evolution | ✅ Built | `temporal_evolution.py` |
| Cluster synthesis | ✅ Built | `synthesis.py` |
| Self-organization (5 loops) | ✅ Built | `self_organize.py` |
| Auto-classification | ✅ Built | `auto_classify.py` |
| File ingestion (PDF, DOCX, etc) | ✅ Built | `file_ingestion.py` |
| Canvas engine (Vega-Lite) | ✅ Built | `canvas_engine.py` |
| Resurfacer (5 signals) | ✅ Built | `resurface.py` |
| KGE training script | ✅ Built | `scripts/train_kge.py` |
| Nightly self-org scheduling | ✅ Built | `scheduling.py` |
| Epistemic primitives (models) | ✅ Scaffolded | `models.py` |
| Promotion pipeline | 🔲 Designed | transition spec |
| Method DSL | 🔲 Designed | transition spec |
| Method execution runtime | 🔲 Designed | transition spec |
| Domain packs | 🔲 Designed | transition spec |
| Feedback/learning layer | 🔲 Designed | transition spec |
| Firecrawl training pipeline | 🔲 Unstarted | — |
| SBERT fine-tuning | 🔲 Unstarted | — |
| Inquiry-first UI surfaces | 🔲 Unstarted | — |

---

## Version History

| Version | Date | Organizing Principle | Commands |
|---------|------|---------------------|----------|
| 1.0 | Feb 2026 | File-based skills | 11 commands |
| 2.0 | Feb 2026 | File-based skills (validated) | 11 commands |
| 3.0 | Mar 2026 | Scientific disciplines (3-tier) | 10 commands |
| 4.0 | Mar 2026 | Epistemic engineering workflows | 4 commands, 12 agents |
