# Theseus-Pro: Intelligence Engineering Plugin for Claude Code

> A Claude Code plugin for building systems that learn from their own
> operation. Organized around the eight levels of the Theseus roadmap,
> grounded in framework source code and the Index-API codebase where
> these techniques converge.
>
> Successor to SciPy-Pro v4. Subsumes all twelve v4 agents and adds
> twelve more covering the ML, neural, symbolic, and systems disciplines
> required for Levels 2 through 8.

**Version**: 1.0 (March 2026)

**Design shift from SciPy-Pro v4**: v4 was organized around epistemic
engineering workflows (reason, graph, encode, gather) using the CS
skills needed to build knowledge discovery systems. Theseus-Pro is
organized around **intelligence engineering**: the full stack of
disciplines required to build systems that not only discover knowledge
but learn from use, generate hypotheses, reason adversarially, and
simulate counterfactuals. The plugin teaches Claude Code how to think
about these problems across twenty-four disciplines, not just how to
edit files in twelve.

---

## The Problem This Plugin Solves

Turning Index-API into Theseus requires simultaneous competence in
at least twenty CS subdisciplines spanning three tiers:

### Tier 1: Epistemic Foundation (inherited from SciPy-Pro v4)

| Discipline | What it contributes |
|---|---|
| Information Retrieval | Finding relevant evidence (BM25, TF-IDF, FAISS, re-ranking) |
| Natural Language Processing | Extracting claims and entities (NER, NLI, SBERT) |
| Knowledge Representation | Structuring what is known (ontologies, KGE, graph schemas) |
| Graph Theory | Discovering structure (community detection, centrality, DAGs) |
| Probabilistic Reasoning | Managing uncertainty (Bayesian decay, evidence weighting) |
| Program Synthesis | Encoding executable knowledge (Method DSL, rule compilation) |
| Causal Inference | Tracing intellectual lineage (temporal precedence, influence) |
| Software Architecture | Making it all work (two-mode deployment, queues, caching) |
| Self-Organization | Systems that modify their own structure (5 feedback loops) |
| Training Pipeline | Improving models from accumulated knowledge (fine-tuning, eval) |
| Claim Analysis | Propositional reasoning over extracted claims (NLI, stance) |
| Web Acquisition | Getting evidence into the system (Firecrawl, scraping) |

### Tier 2: Intelligence Layer (new for Theseus-Pro)

| Discipline | What it contributes | Theseus Level |
|---|---|---|
| Learned Scoring | Signal fusion via trained models (GBT, feature engineering) | L2 |
| Graph Neural Networks | Structural node embeddings via neighbor aggregation | L3-L8 |
| Temporal Graph Memory | Event-based node memory, dynamic graph evolution | L3 |
| Language Model Training | LoRA fine-tuning, grounded generation, knowledge-conditioned LMs | L3 |
| Multimodal Networks | Vision-language models, layout-aware document understanding | L6 |
| Multi-Agent Reasoning | Adversarial epistemic debate (Advocate/Critic/Judge) | L6 |

### Tier 3: Generative Intelligence Layer (new for Theseus-Pro)

| Discipline | What it contributes | Theseus Level |
|---|---|---|
| Reinforcement Learning | Policy learning from graph interaction rewards | L5, L7 |
| Evolutionary Optimization | Population-based hyperparameter and architecture search | L5 |
| Symbolic Reasoning | Defeasible logic, belief revision, truth maintenance | L4, L7 |
| Systems Theory | Feedback loop analysis, attractor dynamics, chaos, control | Cross |
| Counterfactual Simulation | Dependency-tree walking, alternative graph states | L7 |
| Domain Specialization | Per-cluster model adaptation, transfer learning, meta-learning | L5, L7 |

No single Claude Code session holds all of this in context. This plugin
encodes the patterns, source references, and architectural constraints
so Claude Code can work fluently across all twenty-four without
re-learning each time.

---

## Six Commands, Twenty-Four Agents

### Command Architecture

Theseus-Pro uses **6 commands** that map to intelligence engineering
workflows. Each command loads a set of agents appropriate for that
workflow. The first four inherit from SciPy-Pro v4. The last two are new.

```
/reason    Epistemic reasoning: from raw text to structured claims,
           tensions, and models. NLP, NLI, knowledge representation,
           claim analysis.

/graph     Graph intelligence: from objects to structure. Community
           detection, causal inference, self-organization, gap analysis,
           GNNs, temporal memory, embeddings.

/train     Model training and learned intelligence: feature engineering,
           learned scoring, fine-tuning, RL reward shaping, evolutionary
           search, domain adaptation, evaluation.

/architect System design: separation of concerns in multi-layer systems,
           two-mode deployment, feedback loop control, pipeline
           optimization, infrastructure patterns.

/simulate  Reasoning and simulation: symbolic logic, belief revision,
           counterfactual dependency walking, multi-agent debate,
           hypothesis generation, truth maintenance.

/measure   Intelligence measurement: IQ tracker, axis scoring,
           benchmarking, before/after comparisons, trend analysis.
```

### Agent Loading Matrix

Each command loads relevant agents. Agents are reusable across commands.
Agents marked (v4) are inherited from SciPy-Pro v4. Agents marked (new)
are added by Theseus-Pro.

| Agent | /reason | /graph | /train | /architect | /simulate | /measure |
|---|---|---|---|---|---|---|
| information-retrieval (v4) | * | | * | | | * |
| nlp-pipeline (v4) | * | | * | | | |
| claim-analysis (v4) | * | | | | * | |
| knowledge-representation (v4) | * | * | * | | * | |
| graph-theory (v4) | | * | | | | * |
| causal-inference (v4) | | * | | | * | |
| probabilistic-reasoning (v4) | * | * | | | * | |
| self-organization (v4) | | * | | * | | * |
| program-synthesis (v4) | | | | * | | |
| software-architecture (v4) | | | | * | | |
| training-pipeline (v4) | | | * | | | |
| web-acquisition (v4) | | | * | | | |
| learned-scoring (new) | | | * | | | * |
| graph-neural-networks (new) | | * | * | | | |
| temporal-graph-memory (new) | | * | * | | * | |
| language-model-training (new) | | | * | | * | |
| multimodal-networks (new) | | | * | | | |
| multi-agent-reasoning (new) | | | | | * | |
| reinforcement-learning (new) | | | * | | | * |
| evolutionary-optimization (new) | | | * | * | | |
| symbolic-reasoning (new) | | | | | * | |
| systems-theory (new) | | * | | * | * | * |
| counterfactual-simulation (new) | | | | | * | |
| domain-specialization (new) | | | * | * | | * |

---

## CLAUDE.md (Plugin Root Config)

```markdown
# Theseus-Pro: Intelligence Engineering Plugin

You are working on systems that learn from their own operation. The
primary application is Index-API (becoming Theseus), a Django-based
epistemic engine that discovers, organizes, and generates knowledge
through a self-improving pipeline.

## Prime Directive

Read the source before writing code. Read refs/ for library internals.
Read the Index-API codebase for application patterns. Do not rely on
training data for either.

## Command Routing

/reason    -> text -> claims -> tensions -> models (NLP, NLI, KR)
/graph     -> objects -> structure -> self-organization -> GNN (graph, temporal, causal)
/train     -> features -> models -> evaluation -> adaptation (ML, RL, evolution)
/architect -> layers -> separation -> feedback loops -> optimization (systems, infra)
/simulate  -> hypotheses -> debate -> counterfactuals -> revision (symbolic, agents)
/measure   -> axes -> scores -> trends -> opportunities (IQ tracker)

## The Theseus Stack

Index-API is evolving from a knowledge discovery engine (Level 1)
into an intelligence that learns from its own use (Levels 2-8).

### Current Architecture (Level 1: Tool-Based Intelligence)

#### Primitives (apps/notebook/models.py)
  Object          Unit of captured knowledge (10 types)
  Edge            Explained connection (14 types, from_object/to_object)
  Claim           Sentence-sized proposition extracted from an Object
  Question        Durable unit of inquiry organizing evidence
  Tension         Stored contradiction, ambiguity, or unresolved conflict
  EpistemicModel  Explanation with assumptions, scope, failure conditions
  Method          Versioned executable knowledge
  MethodRun       One execution of a Method
  Narrative        Synthesis artifact (memo, brief, story, report)

#### Engines
  engine.py             7-pass post-capture graph enrichment
  compose_engine.py     6-pass live write-time discovery
  claim_decomposition   LLM + rule-based claim extraction
  causal_engine.py      Temporal influence DAG construction
  community.py          Louvain community detection
  gap_analysis.py       Structural hole detection
  temporal_evolution.py Sliding-window graph dynamics
  synthesis.py          LLM cluster summarization
  self_organize.py      5 feedback loops
  canvas_engine.py      Altair/Vega-Lite spec generation
  inquiry_engine.py     Structured inquiry pipeline
  method_runtime.py     Method execution engine

#### Infrastructure
  vector_store.py       FAISS indexes (SBERT + KGE)
  advanced_nlp.py       SBERT + CrossEncoder NLI (two-mode safe)
  bm25.py               BM25 lexical index
  adaptive_ner.py       Graph-learned PhraseMatcher
  tasks.py              RQ background jobs
  provenance.py         Auditable object history + influence lineage
  file_ingestion.py     PDF, DOCX, images, code (tree-sitter AST)
  scraper.py            Firecrawl web acquisition
  embedding_service.py  Embedding generation service

### The Eight Levels

  Level 1: Tool-Based Intelligence       (SHIPPED - current state)
  Level 2: Learned Connection Scoring    (NEXT - specced in INDEX-LEVEL2-SPEC.md)
  Level 3: Hypothesis Generation         (fine-tuned LM, grounded in graph)
  Level 4: Emergent Ontology             (specced in SELF-ORGANIZING-SPEC.md)
  Level 5: Self-Modifying Pipeline       (per-domain engine configuration)
  Level 6: Multi-Agent Epistemic Reasoning (Advocate/Critic/Judge)
  Level 7: Counterfactual Simulation     (Truth Maintenance Systems)
  Level 8: Creative Hypothesis Generation (structural anomaly + abduction)

### Product Loop
  Capture -> Extraction -> Claims/observations -> Connections/tensions
  -> Questions -> Models/methods -> Narratives -> Review/revision -> loop

### Two-Mode Contract (NEVER BREAK THIS)
  PRODUCTION (Railway): spaCy + BM25 + TF-IDF. No PyTorch.
  LOCAL/DEV: All 7 passes. PyTorch + FAISS + SBERT + NLI + KGE.
  MODAL (GPU): Batch re-encoding, KGE training, GNN training, LM fine-tuning.

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
  11. Learned models fall back gracefully to fixed weights when untrained.
  12. Feedback loops close one at a time, never all at once.
  13. Neural components produce signals alongside (not instead of) symbolic ones.
  14. The IQ Tracker measures every change.

### IQ Tracker (Seven Axes, 0-100 each)
  Discovery (0.20)     Can it find real connections?
  Organization (0.15)  Can it structure knowledge without being told?
  Tension (0.15)       Can it find contradictions?
  Lineage (0.10)       Can it trace how knowledge evolved?
  Retrieval (0.15)     Can it find the right thing when asked?
  Ingestion (0.10)     Can it handle diverse inputs?
  Learning (0.15)      Does it get smarter over time?
  Current composite: ~31/100
```

---

## New Agent Definitions (Tier 2: Intelligence Layer)

### learned-scoring.md

**Discipline**: Learning which signal combinations indicate real
connections versus noise. The bridge between fixed-weight pipelines
and adaptive intelligence.

**Core CS concepts**:
- **Supervised learning from implicit feedback**: User clicks,
  dismissals, and web validation become training labels. This is
  the same principle behind recommendation systems (Netflix,
  Spotify) but applied to knowledge graph connections.
- **Feature engineering**: Each object pair becomes a 14-20 feature
  vector from the seven engine passes. Feature construction is the
  most impactful part of any ML system. The features ARE the model's
  view of the world.
- **Gradient boosted trees** (GBT): Ensemble of shallow decision
  trees, each correcting the errors of the previous. XGBoost and
  LightGBM are the standard implementations. GBTs excel with small
  datasets (hundreds of labeled pairs), mixed feature types, and
  produce interpretable feature importances.
- **Cold start via web validation**: Before user feedback exists,
  auto-validate top candidate connections via web search to generate
  initial training labels. This solves the chicken-and-egg problem
  that kills most learned ranking systems.
- **Graceful degradation**: <50 labels uses fixed weights, 50-200
  blends 50/50, 200+ uses the trained model entirely. The system
  never breaks, it just gets smarter.
- **Cross-validation**: k-fold evaluation prevents overfitting on
  small datasets. Always report accuracy, precision, recall, and
  feature importance after each training run.

**Index-API implementation**:
- `learned_scorer.py` (to build): Training pipeline + inference
- `models.py ConnectionFeedback`: Feedback table with feature
  vector snapshots and typed labels
- `engine.py`: Modified to call learned scorer when available,
  fall back to fixed weights otherwise
- Management command: `train_scorer` for on-demand training
- RQ task: weekly retraining via `scheduling.py`

**Key architectural pattern**: The scorer does NOT replace individual
passes. It replaces the *combination formula*. All seven passes still
run. The scorer learns which combinations matter.

**Refs**: `refs/scikit-learn/`, `refs/xgboost/`, `refs/lightgbm/`,
`refs/torchrec/` (for advanced ranking patterns)

---

### graph-neural-networks.md

**Discipline**: Learning vector representations of graph nodes by
aggregating information from their neighborhoods. The science of
making graphs learnable by neural networks.

**Core CS concepts**:
- **Message passing**: Each node collects "messages" from its
  neighbors (their features), aggregates them (sum, mean, or
  attention-weighted), and updates its own representation. After
  K rounds, each node encodes its K-hop neighborhood.
- **R-GCN** (Relational Graph Convolutional Network): The
  foundational model for knowledge graphs. Uses relation-specific
  weight matrices so different edge types contribute differently.
  A "contradicts" edge should carry different information than a
  "supports" edge.
- **CompGCN**: Jointly embeds entities AND relations via
  composition operators. More parameter-efficient than R-GCN for
  graphs with many relation types (Index has 14 edge types).
- **GAT** (Graph Attention Network): Attention-weighted neighbor
  aggregation. Some neighbors matter more than others. Attention
  learns which ones.
- **GraphSAGE**: Inductive learning. Can generate embeddings for
  new nodes without retraining, which matters when Objects are
  continuously captured.
- **Link prediction**: Given node embeddings, predict whether an
  edge should exist between two nodes. This is what the GNN
  provides that KGE alone does not: predictions based on multi-hop
  structural patterns, not just individual triples.
- **Node classification**: Predict the type/status of a node from
  its graph position. Useful for auto-classification (Loop 1 of
  self-organization).

**Index-API implementation**:
- New file: `gnn_engine.py` (Modal GPU job)
- Input: full graph exported as edge list + node features (SBERT
  embeddings, object type, edge count, centrality scores)
- Output: per-node structural embeddings stored in
  `vector_store.py` alongside SBERT embeddings
- Engine pass 8 (new): GNN structural similarity as a signal
- Training: periodic retraining as graph grows (Modal batch job)

**Key insight for Index**: Today the engine compares objects in
pairs (SBERT compares A to B). A GNN gives each object a single
embedding that encodes its structural role: "I am a Note about
epistemology, connected to 3 Sources about philosophy of science,
in a cluster with 2 Tensions and a Method." Two objects could be
recognized as related because they occupy similar structural
positions, even with zero text overlap.

**Refs**: `refs/pyg/` (PyTorch Geometric), `refs/dgl/`,
`refs/slaps-gnn/`, `refs/ultra/`

---

### temporal-graph-memory.md

**Discipline**: Modeling how graphs evolve over time. Event-based
node memory that captures the dynamics of knowledge accumulation.

**Core CS concepts**:
- **Temporal Graph Networks (TGN)**: Each node maintains a memory
  vector updated by a recurrent module whenever an event (edge
  creation, object edit, user interaction) occurs. The memory
  encodes the node's history, not just its current state.
- **Temporal embeddings**: Time-aware representations where "this
  Source connected to this Concept last week" and "this Source
  connected to this Concept six months ago" produce different
  scores. Recency matters.
- **DE-SimplE**: Temporal KG embeddings that extend static KGE
  models with time-bucketed parameters. Relations have different
  meanings at different times.
- **Sliding window graph dynamics**: Already partially implemented
  in `temporal_evolution.py`. TGN formalizes this with learned
  memory rather than hand-crafted windows.
- **Event streams**: Every action in Index (object capture, edge
  creation, user click, engine run) is a timestamped event.
  TGN processes these events to update node memories.

**Index-API implementation**:
- Fork: `Travis-Gilbert/Temporal-Graph-Networks_tgn` (already exists)
- New file: `temporal_memory.py` (Modal GPU job)
- Integration: temporal memory vectors as an additional feature
  in the learned scorer (Level 2) and as input to GNN layers
- `temporal_evolution.py`: existing code bridges to new temporal
  memory system

**Why this matters**: Static graph embeddings treat the graph as a
snapshot. But knowledge evolves. A connection that was strong
six months ago may be stale now. Temporal memory captures this
decay and growth natively, replacing the hand-tuned exponential
decay in `self_organize.py` with a learned temporal model.

**Refs**: `refs/tgn/` (Travis fork), `refs/tgn-official/`,
`refs/de-simple/`, `refs/pyg-temporal/`

---

### language-model-training.md

**Discipline**: Fine-tuning small language models on domain-specific
knowledge, grounded in the graph. The science of making LMs speak
from evidence rather than statistical hallucination.

**Core CS concepts**:
- **LoRA** (Low-Rank Adaptation): Fine-tune a fraction of model
  parameters by adding small rank-decomposition matrices to
  existing weights. Trains in hours on a single GPU. 10-100x
  more parameter-efficient than full fine-tuning.
- **Grounded generation**: Every generated sentence must trace to
  specific graph nodes and edges. The model retrieves evidence
  from the graph, conditions generation on it, and cites its
  sources. This is RAG done right: not just "find context and
  paste it" but "condition the model's weights on the knowledge
  structure."
- **Task-specific fine-tuning**: Train on structured tasks derived
  from the graph: "Given these claims and evidence, generate a
  hypothesis." "Given this tension, propose resolving evidence."
  "Given this cluster summary, identify the gap."
- **Base model selection**: Qwen 2.5 0.5B or Phi-3 Mini for local
  experiments. Small enough to fine-tune on a single A100 via
  Modal. Large enough to generate coherent, structured text.
- **Evaluation**: BLEU/ROUGE are insufficient. Evaluate via
  faithfulness (does the output contradict the graph?), coverage
  (does it use the available evidence?), and novelty (does it
  propose something not already explicit in the graph?).

**Index-API implementation**:
- New file: `lm_service.py` (Modal GPU job)
- Training data: structured prompts generated from the graph
  (claim+evidence -> hypothesis, tension -> resolution proposal)
- Inference: graph-conditioned generation endpoint
- Integration with compose_engine: generated hypotheses appear
  alongside discovered connections

**Refs**: `refs/torchtune/`, `refs/transformers/`, `refs/dspy/`

---

### multimodal-networks.md

**Discipline**: Processing images, PDFs, audio, and text through
unified architectures. Understanding document layout, not just words.

**Core CS concepts**:
- **Vision-Language Models (VLM)**: Florence-2, LLaVA, Qwen-VL.
  Process images and text in a single forward pass. Can "read" a
  chart, understand table structure, and connect visual information
  to text.
- **Layout-aware document understanding**: Instead of extracting
  text from a PDF and running NLP, look at the PDF as an image
  and understand structure: tables, figures, captions, sidebars.
  This preserves spatial relationships that OCR destroys.
- **Cross-modal embeddings**: Shared embedding spaces where an
  image of a chart and a textual description of the same data
  produce similar vectors.
- **Continual multimodal KG growth**: Adding new modalities without
  forgetting representations learned from earlier ones.

**Index-API implementation**:
- Extends `file_ingestion.py` with VLM-based extraction
- New modal job: image/PDF understanding via Florence-2
- Object metadata enriched with visual features
- Engine pass: cross-modal similarity for image+text connections

**Refs**: `refs/native/` (NativE), `refs/valik/`, `refs/continuemkgc/`

---

### multi-agent-reasoning.md

**Discipline**: Adversarial epistemic debate between specialized
agents. The science of stress-testing knowledge claims.

**Core CS concepts**:
- **Advocate/Critic/Judge pattern**: Three instances of a language
  model, each with a different role. The Advocate finds supporting
  evidence. The Critic finds weakening evidence. The Judge evaluates
  both and assigns confidence. Disagreements surface the most
  epistemically interesting objects.
- **Grounded debate**: Every argument must cite specific graph nodes
  and edges. No free-form speculation. The graph is the evidence
  base.
- **Ensemble confidence**: The Judge's verdict is more reliable than
  any single model's assessment because it incorporates adversarial
  perspectives.
- **Debate-as-training**: Human review of Judge verdicts becomes
  training data for all three agents, creating a feedback loop.
- **CourtEval pattern**: Grader/Critic/Defender with structured
  evaluation rubrics. The closest academic analog to Theseus's
  epistemic debate.

**Index-API implementation**:
- New file: `debate_engine.py`
- Depends on: language-model-training (fine-tuned LM for each role)
- Trigger: automatically when a new high-connectivity object enters
  the graph, or on demand for any Claim
- Output: confidence scores, supporting/weakening evidence lists,
  disagreement flags surfaced in Resurface

**Refs**: `refs/autogen/` (Microsoft AutoGen/AG2), `refs/crewai/`

---

## New Agent Definitions (Tier 3: Generative Intelligence)

### reinforcement-learning.md

**Discipline**: Learning policies from interaction rewards. An agent
takes actions, receives feedback, and learns which actions produce
the best outcomes in which states.

**Core CS concepts**:
- **State/Action/Reward formulation for graphs**: The state is the
  current graph structure + user context. Actions are engine
  decisions (which connections to surface, which passes to weight
  higher, which objects to resurface). Rewards come from user
  engagement (clicks, dismissals, time spent).
- **Contextual bandits**: A simpler formulation than full RL.
  At each step, choose which connections to surface. Observe
  whether the user engages. Update the policy. No need to model
  long-term sequential consequences for Level 5.
- **Multi-armed bandits with Thompson sampling**: For the
  self-modifying pipeline (Level 5). Each engine configuration
  is an "arm." Sample from Beta posteriors to balance exploration
  (trying new configurations) and exploitation (using the best
  known one).
- **MINERVA-style path reasoning**: RL agent that navigates the
  knowledge graph by choosing which edge to follow at each step.
  Learns multi-hop reasoning paths that deterministic algorithms
  miss.
- **Reward shaping**: The critical design problem. Raw user
  engagement is noisy. Need to decompose rewards: immediate
  (user clicked), short-term (user wrote a note), long-term
  (user's understanding improved, measured by IQ axes).

**Index-API implementation**:
- Level 5: `adaptive_engine.py` (contextual bandit for per-cluster
  engine weight selection)
- Level 7+: `path_reasoner.py` (MINERVA-style multi-hop RL agent)
- Training: user engagement events as rewards, updated via RQ task
- Exploration: Thompson sampling or epsilon-greedy for new configs

**Refs**: `refs/minerva/`, `refs/di-engine/`, `refs/kg-rl/`,
`refs/stable-baselines3/`

---

### evolutionary-optimization.md

**Discipline**: Population-based search for optimal configurations.
Generate candidates, evaluate fitness, select, mutate, repeat.

**Core CS concepts**:
- **Genetic algorithms for hyperparameter search**: The engine has
  dozens of thresholds (SBERT threshold, BM25 k1, NLI confidence
  cutoff, decay half-life). Evolving these as a population is
  more robust than grid search or random search because it
  captures parameter interactions.
- **NSGA-II for multi-objective optimization**: The IQ Tracker
  has seven axes. Improving Discovery might hurt Retrieval speed.
  NSGA-II finds the Pareto frontier: configurations where you
  cannot improve one axis without degrading another.
- **Neuroevolution**: Evolving small neural network architectures
  (the learned scorer's topology) rather than hand-designing them.
  NEAT (NeuroEvolution of Augmenting Topologies) grows networks
  from minimal structure.
- **CMA-ES** (Covariance Matrix Adaptation): Continuous
  optimization for real-valued parameters. Better than genetic
  algorithms for smooth, high-dimensional parameter spaces. Good
  fit for tuning engine weights.
- **Fitness function from IQ Tracker**: The IQ composite score
  (or individual axis scores) serves as the fitness function.
  This directly connects evolution to measured intelligence.

**Index-API implementation**:
- New file: `optimizer.py`
- Uses IQ Tracker as fitness function
- Periodic optimization: evolve engine config, measure IQ, select
  best configurations, deploy to per-Notebook engine_config
- Library: DEAP (Distributed Evolutionary Algorithms in Python)
  or Optuna with evolutionary sampler

**Refs**: `refs/deap/`, `refs/optuna/`, `refs/learn2learn/`

---

### symbolic-reasoning.md

**Discipline**: Logic-based inference over graph structures. Rules,
defaults, exceptions, and belief revision.

**Core CS concepts**:
- **Defeasible logic** (PyReason): Rules that can be overridden by
  exceptions. "Sources from peer-reviewed journals are generally
  trustworthy" can be defeated by "this specific journal has a
  retraction record." Strict rules vs. default rules vs. exceptions.
- **AGM belief revision**: The formal framework for rational
  belief change. When new evidence contradicts existing beliefs,
  which beliefs should be abandoned? Principles: consistency
  (no contradictions), minimal change (revise as little as
  possible), and recovery (if a belief is abandoned, it can be
  re-adopted if evidence appears).
- **Truth Maintenance Systems (TMS)**: Doyle (1979) and de Kleer's
  ATMS (1986). Each Claim has a dependency tree recording which
  sources and edges support it. Retracting a source automatically
  identifies which Claims become unsupported. This is the core
  mechanism for Level 7 counterfactual simulation.
- **RNNLogic**: Learning explicit logical rules from KG structure.
  "If A cites B and B contradicts C, then A likely disagrees with
  C" as a learnable rule, not a hand-coded heuristic.
- **Structure-mapping analogy (ANASIME)**: Finding structural
  parallels between different domains. "The relationship between
  urban planners and zoning law is structurally analogous to the
  relationship between software architects and API contracts."

**Index-API implementation**:
- Level 4: extend `self_organize.py` Loop 5 with rule-learned
  type inference via RNNLogic patterns
- Level 7: `tms.py` (Truth Maintenance System over Claim
  dependency trees)
- Integration: rules learned by RNNLogic feed into the engine
  as new heuristics for connection scoring

**Refs**: `refs/pyreason/`, `refs/belief-revision-engine/`,
`refs/rnnlogic/`, `refs/scallop/`, `refs/anasime/`

---

### systems-theory.md

**Discipline**: Understanding feedback loops, attractors, stability,
and emergent behavior in complex systems. The meta-discipline for
reasoning about Theseus as a whole.

**Core CS concepts**:
- **Feedback loop classification**: Positive feedback (amplifying)
  vs negative feedback (stabilizing). Each of the five self-
  organization loops is a feedback loop. Entity promotion is
  positive feedback (popular entities get promoted, promoted
  entities get used more). Edge decay is negative feedback
  (unused connections weaken, preventing runaway growth).
- **Attractor dynamics**: A chaotic system orbits within a bounded
  region (a "strange attractor"). The graph does not need to
  converge to one state; it needs to stay within a region of
  useful states. Edge decay + reinforcement create an attractor
  basin.
- **Sensitivity analysis**: Before closing each feedback loop,
  measure how sensitive downstream output is to upstream changes.
  If changing BM25 k1 by 10% changes 40% of clusters, that pass
  needs dampening.
- **Gradual loop closure**: Turn on feedback loops one at a time.
  Let each stabilize before adding the next. This is how real
  control systems are tuned.
- **Phase transitions**: Systems with feedback can undergo sudden
  qualitative changes when parameters cross thresholds. A small
  increase in edge density can suddenly cause community structure
  to emerge (or collapse).
- **Information-theoretic capacity**: Shannon's channel capacity
  applied to the engine pipeline. Each pass has a signal-to-noise
  ratio. The overall pipeline capacity is bounded by the weakest
  link. Improving a strong pass has less impact than improving a
  weak one.
- **Separation of concerns in layered systems**: Each layer
  (capture, extraction, connection, self-organization, learning)
  should have clear inputs, outputs, and failure modes. A failure
  in the GNN layer should not cascade to BM25 retrieval.

**Index-API implementation**:
- Not a single file but a design discipline applied everywhere
- Key tool: sensitivity analysis scripts that measure how
  parameter changes propagate through the pipeline
- Key pattern: every feedback loop has a dampening coefficient
  that prevents runaway amplification
- Key metric: the IQ Tracker's per-axis sensitivity to each
  engine parameter

**Refs**: `refs/pymc/` (for stochastic modeling of system dynamics),
`refs/networkx/` (for graph dynamics analysis)

---

### counterfactual-simulation.md

**Discipline**: "What if?" reasoning over the knowledge graph.
Simulating alternative states by modifying the dependency structure.

**Core CS concepts**:
- **Dependency trees for Claims**: Each Claim records which Sources
  and Edges support it. "Claim C is supported by Sources A and B
  via Edges E1 and E2." This is the justification network.
- **Counterfactual retraction**: "What if Source A were removed?"
  Walk the dependency tree. Identify all Claims that lose support.
  For each, check if alternative support paths exist. Those with
  no remaining support are "load-bearing" on Source A.
- **Fragility analysis**: How many Claims collapse if a single
  Source is retracted? High fragility = understanding depends on
  thin evidence. Low fragility = robust, well-supported.
- **ATMS-style multi-context**: Maintain multiple consistent
  "worlds" simultaneously. World 1: the current graph. World 2:
  the graph without Source A. World 3: the graph if Contested
  Claim X were accepted. Compare worlds to see consequences.
- **Cascading consequences**: When a Claim is retracted, its
  dependents may also lose support, which may cause further
  retractions. The cascade reveals the depth of impact.

**Index-API implementation**:
- New file: `tms.py` (Truth Maintenance System)
- New file: `counterfactual.py` (simulation engine)
- Depends on: Claim model with proper dependency tracking
- API endpoint: POST /api/v1/notebook/simulate/ with
  {"retract": [source_id], "accept": [claim_id]}
- Output: diff between current graph state and simulated state

**Refs**: `refs/pyreason/` (for rule-based dependency propagation),
study Doyle (1979) TMS paper and de Kleer (1986) ATMS paper

---

### domain-specialization.md

**Discipline**: Adapting the engine to perform differently in
different knowledge domains. Per-cluster model adaptation, transfer
learning, and meta-learning.

**Core CS concepts**:
- **Per-cluster engine configuration**: Level 5 in the Theseus
  roadmap. The engine notices that for "legal" objects, NLI scores
  are 3x more predictive than SBERT scores. For "philosophy"
  objects, the reverse. Different graph regions get different
  engine weights automatically.
- **Feature importance decomposition**: From the Level 2 learned
  scorer, extract per-cluster feature importances. These reveal
  which signals matter in which domains.
- **Meta-learning (learn2learn)**: Learn a meta-model that can
  quickly adapt to a new domain with few examples. When a new
  cluster emerges, the meta-model initializes domain-specific
  weights from structural similarity to known clusters.
- **Few-shot relation learning (MetaR)**: Learn new relation types
  from just a handful of examples. When a new edge type emerges
  from the self-organizing layer, MetaR can learn its semantics
  from a few confirmed instances.
- **AutoSchemaKG**: Schema induction from large corpora. Instead
  of hand-designing the ontology, let the system discover entity
  types and relation types from the data. This is the theoretical
  basis for Loop 5 (Emergent Type Detection).
- **Domain packs**: Pre-built ontology extensions and fine-tuned
  models for specific domains (CS, law, built environment). Each
  pack includes: entity types, relation types, NER patterns,
  evaluation benchmarks, and reference sources.

**Index-API implementation**:
- `domain_config.py`: per-Notebook/per-cluster engine_config
  management
- Integration with learned scorer: cluster-conditioned feature
  importances
- Domain packs as Django fixtures or management commands
- `auto_classify.py` already does basic type inference; extend
  with meta-learned classifiers

**Refs**: `refs/metar/`, `refs/gen/`, `refs/autoschemakg/`,
`refs/learn2learn/`

---

## Reference Bank

### Install Script

`scripts/bootstrap_refs.sh` clones all reference repositories.

```bash
#!/usr/bin/env bash
set -euo pipefail

REFS_DIR="$(cd "$(dirname "$0")/.." && pwd)/refs"
mkdir -p "$REFS_DIR"

clone_if_absent() {
    local url="$1" dir="$2"
    if [ ! -d "$REFS_DIR/$dir" ]; then
        echo "[clone] $dir"
        git clone --depth 1 "$url" "$REFS_DIR/$dir"
    else
        echo "[skip]  $dir (already cloned)"
    fi
}

echo "=== Tier 1: Epistemic Foundation (from SciPy-Pro v4) ==="
clone_if_absent https://github.com/UKPLab/sentence-transformers.git   sentence-transformers
clone_if_absent https://github.com/networkx/networkx.git              networkx
clone_if_absent https://github.com/explosion/spaCy.git                spacy
clone_if_absent https://github.com/scikit-learn/scikit-learn.git      scikit-learn
clone_if_absent https://github.com/facebookresearch/faiss.git         faiss
clone_if_absent https://github.com/pykeen/pykeen.git                  pykeen
clone_if_absent https://github.com/pytorch/pytorch.git                pytorch
clone_if_absent https://github.com/dorianbrown/rank_bm25.git         rank-bm25
clone_if_absent https://github.com/mendableai/firecrawl.git           firecrawl
clone_if_absent https://github.com/tree-sitter/tree-sitter.git        tree-sitter

echo ""
echo "=== Tier 2: Intelligence Layer (new for Theseus-Pro) ==="

# Graph Neural Networks
clone_if_absent https://github.com/pyg-team/pytorch_geometric.git     pyg
clone_if_absent https://github.com/dmlc/dgl.git                       dgl
clone_if_absent https://github.com/BorealisAI/SLAPS-GNN.git           slaps-gnn
clone_if_absent https://github.com/DeepGraphLearning/ULTRA.git        ultra

# Temporal Graph Memory
clone_if_absent https://github.com/Travis-Gilbert/Temporal-Graph-Networks_tgn.git  tgn
clone_if_absent https://github.com/twitter-research/tgn.git            tgn-official
clone_if_absent https://github.com/BorealisAI/de-simple.git            de-simple
clone_if_absent https://github.com/benedekrozemberczki/pytorch_geometric_temporal.git  pyg-temporal

# Learned Scoring
clone_if_absent https://github.com/dmlc/xgboost.git                   xgboost
clone_if_absent https://github.com/microsoft/LightGBM.git             lightgbm
clone_if_absent https://github.com/pytorch/torchrec.git                torchrec

# Language Model Training
clone_if_absent https://github.com/pytorch/torchtune.git               torchtune
clone_if_absent https://github.com/huggingface/transformers.git        transformers
clone_if_absent https://github.com/stanfordnlp/dspy.git                dspy

# Multi-Agent Reasoning
clone_if_absent https://github.com/microsoft/autogen.git               autogen

# Multimodal
clone_if_absent https://github.com/zjukg/NATIVE.git                    native
clone_if_absent https://github.com/HKUST-KnowComp/AutoSchemaKG.git    autoschemakg

echo ""
echo "=== Tier 3: Generative Intelligence Layer ==="

# Symbolic Reasoning
clone_if_absent https://github.com/lab-v2/pyreason.git                 pyreason
clone_if_absent https://github.com/tdiam/belief-revision-engine.git    belief-revision-engine
clone_if_absent https://github.com/DeepGraphLearning/RNNLogic.git      rnnlogic
clone_if_absent https://github.com/scallop-lang/scallop.git            scallop
clone_if_absent https://github.com/Tijl/ANASIME.git                    anasime

# Reinforcement Learning
clone_if_absent https://github.com/shehzaadzd/MINERVA.git              minerva
clone_if_absent https://github.com/DLR-RM/stable-baselines3.git        stable-baselines3
clone_if_absent https://github.com/opendilab/DI-engine.git              di-engine
clone_if_absent https://github.com/owenonline/Knowledge-Graph-Reasoning-with-Self-supervised-Reinforcement-Learning.git  kg-rl

# Evolutionary Optimization
clone_if_absent https://github.com/DEAP/deap.git                       deap
clone_if_absent https://github.com/optuna/optuna.git                    optuna
clone_if_absent https://github.com/learnables/learn2learn.git           learn2learn

# Few-Shot and Generalization
clone_if_absent https://github.com/AnselCmy/MetaR.git                  metar
clone_if_absent https://github.com/JinheonBaek/GEN.git                 gen
clone_if_absent https://github.com/snap-stanford/neural-subgraph-learning-GNN.git  subgraph-gnn

# Uncertainty
clone_if_absent https://github.com/pymc-devs/pymc.git                  pymc
clone_if_absent https://github.com/clabrugere/evidential-deeplearning.git  evidential-dl
clone_if_absent https://github.com/pujacomputes/gduq.git               gduq
clone_if_absent https://github.com/iesl/box-embeddings.git             box-embeddings

# Provenance and Workflow
clone_if_absent https://github.com/aiidateam/aiida-core.git            aiida-core

# RAG and Structured Answering
clone_if_absent https://github.com/kbeaugrand/KernelMemory.StructRAG.git  structrag

echo ""
echo "=== Symlinking Index-API codebase ==="
if [ -d "$REFS_DIR/../../../Index-API" ]; then
    ln -sfn "$REFS_DIR/../../../Index-API" "$REFS_DIR/index-api"
    echo "[link] index-api -> local checkout"
elif [ -d "$HOME/Index-API" ]; then
    ln -sfn "$HOME/Index-API" "$REFS_DIR/index-api"
    echo "[link] index-api -> ~/Index-API"
else
    echo "[warn] Index-API not found locally. Clone it or update the symlink."
fi

echo ""
echo "=== Done. $(find "$REFS_DIR" -maxdepth 1 -type d | wc -l) ref directories ready. ==="
```

---

## Workflow Patterns

### PATTERNS-learned-scorer.md

How to build and integrate the Level 2 learned scorer:

```
1. Ship ConnectionFeedback model (L2-1)
   - Add model to apps/notebook/models.py
   - Add migration
   - Add admin registration
   - No engine changes yet

2. Capture feedback events (L2-1)
   - Signal handlers for edge clicks, dismissals, manual edges
   - Web validation background task for top candidates
   - Feature vector snapshot at feedback time

3. Build feature vectors (L2-2)
   - For each object pair, extract 14-20 features from all passes
   - Normalize and handle missing features (two-mode: some passes
     may be unavailable in production)
   - Store as JSON in ConnectionFeedback.feature_vector

4. Train scorer (L2-3)
   - GradientBoostingClassifier from scikit-learn
   - 5-fold cross-validation
   - Log feature importances to engine metrics
   - Save model to disk via joblib
   - RQ task for weekly retraining

5. Integrate into engine (L2-4)
   - engine.py: after all passes, construct feature vector,
     call scorer if trained model exists, fall back to fixed weights
   - Graceful degradation: <50 labels = fixed, 50-200 = blend, 200+ = model
   - compose_engine.py: same pattern, stateless inference only
```

### PATTERNS-gnn-training.md

How to train and deploy a GNN for structural embeddings:

```
1. Export graph to edge list + node features
   - Management command: export_graph_for_gnn
   - Node features: SBERT embedding (384d), object_type (one-hot),
     edge_count, centrality, cluster_id
   - Edge features: edge_type (one-hot), strength, is_auto

2. Train R-GCN or CompGCN on Modal
   - Task: link prediction (predict missing edges)
   - Split: 80/10/10 train/val/test by edge
   - Epochs: 200, early stopping on val MRR
   - Output: per-node structural embeddings

3. Import embeddings back to Index-API
   - Store in vector_store.py alongside SBERT vectors
   - New FAISS index: gnn_embeddings
   - New engine pass: structural similarity from GNN embeddings

4. Evaluate
   - Compare edge predictions to human-created edges
   - Measure IQ Discovery axis before/after
   - Feature importance: does the GNN signal improve the learned scorer?
```

### PATTERNS-feedback-loop-control.md

How to safely close a feedback loop in a self-organizing system:

```
1. Measure baseline
   - Run IQ Tracker before any changes
   - Record per-axis scores

2. Implement the loop with a kill switch
   - Every loop has an is_active flag in engine_config
   - Default: inactive until explicitly enabled

3. Sensitivity analysis
   - Vary each upstream parameter by +/- 10%
   - Measure downstream change in the loop's output
   - If >30% change propagates, add dampening

4. Enable with monitoring
   - Turn on the loop for one Notebook first
   - Run IQ Tracker daily for one week
   - Watch for: score oscillation, runaway growth, sudden drops

5. Stabilize
   - Adjust dampening coefficients until scores are stable
   - "Stable" = IQ variance < 5% over 7 days

6. Scale
   - Enable for all Notebooks
   - Continue monitoring for 2 weeks
   - Only then consider enabling the next loop
```

### PATTERNS-counterfactual.md

How to implement counterfactual simulation:

```
1. Build the dependency graph
   - For each Claim, record supporting Sources and Edges
   - Dependency = (Claim, depends_on, Source|Claim, via, Edge)
   - This is a DAG (no circular dependencies)

2. Implement retraction
   - Input: set of nodes to retract (Sources or Claims)
   - Walk dependency DAG breadth-first
   - For each dependent Claim:
     - Check all support paths
     - If ALL paths pass through retracted nodes: mark as unsupported
     - If SOME paths survive: mark as weakened (reduce confidence)

3. Compute the diff
   - Current graph state vs simulated state
   - Output: list of (Claim, old_status, new_status, retraction_depth)
   - Aggregate: fragility score = |unsupported| / |total claims|

4. Expose via API
   - POST /api/v1/notebook/simulate/
   - Body: {"retract": [id, ...], "accept": [id, ...]}
   - Response: {"fragility": 0.23, "affected_claims": [...], "cascade_depth": 4}
```

---

## Directory Structure

```
theseus-pro/
|
+-- CLAUDE.md                            # Plugin root config (above)
+-- AGENTS.md                            # Agent registry (24 agents)
+-- README.md                            # Human-readable overview
|
+-- agents/                              # 24 agents by CS discipline
|   |
|   +-- # Tier 1: Epistemic Foundation (from SciPy-Pro v4)
|   +-- information-retrieval.md
|   +-- nlp-pipeline.md
|   +-- claim-analysis.md
|   +-- knowledge-representation.md
|   +-- graph-theory.md
|   +-- causal-inference.md
|   +-- probabilistic-reasoning.md
|   +-- self-organization.md
|   +-- program-synthesis.md
|   +-- software-architecture.md
|   +-- training-pipeline.md
|   +-- web-acquisition.md
|   |
|   +-- # Tier 2: Intelligence Layer (new)
|   +-- learned-scoring.md
|   +-- graph-neural-networks.md
|   +-- temporal-graph-memory.md
|   +-- language-model-training.md
|   +-- multimodal-networks.md
|   +-- multi-agent-reasoning.md
|   |
|   +-- # Tier 3: Generative Intelligence (new)
|   +-- reinforcement-learning.md
|   +-- evolutionary-optimization.md
|   +-- symbolic-reasoning.md
|   +-- systems-theory.md
|   +-- counterfactual-simulation.md
|   +-- domain-specialization.md
|
+-- commands/                            # 6 command definitions
|   +-- reason.md
|   +-- graph.md
|   +-- train.md
|   +-- architect.md
|   +-- simulate.md
|   +-- measure.md
|
+-- patterns/                            # Executable knowledge about patterns
|   +-- PATTERNS-engine-pass.md          # How to add a pass to either engine
|   +-- PATTERNS-self-org-loop.md        # How to add a feedback loop
|   +-- PATTERNS-two-mode-deployment.md  # The most critical pattern
|   +-- PATTERNS-claim-pipeline.md       # Text -> claims -> NLI -> edges
|   +-- PATTERNS-promotion.md            # captured -> reviewed -> promoted
|   +-- PATTERNS-method-dsl.md           # Knowledge -> executable method
|   +-- PATTERNS-firecrawl-corpus.md     # Web -> training data pipeline
|   +-- PATTERNS-modal-gpu.md            # Serverless GPU dispatch
|   +-- PATTERNS-learned-scorer.md       # Level 2 build sequence (new)
|   +-- PATTERNS-gnn-training.md         # GNN training and deployment (new)
|   +-- PATTERNS-feedback-loop-control.md # Safe loop closure (new)
|   +-- PATTERNS-counterfactual.md       # TMS simulation (new)
|   +-- PATTERNS-lm-fine-tuning.md       # LoRA training on graph data (new)
|   +-- PATTERNS-multi-agent-debate.md   # Advocate/Critic/Judge (new)
|   +-- PATTERNS-domain-pack.md          # Building a domain pack (new)
|   +-- PATTERNS-iq-measurement.md       # Running and interpreting IQ (new)
|
+-- refs/                                # Library source + application code
|   +-- index-api/                       # Symlink to the codebase
|   |
|   +-- # Tier 1 (from SciPy-Pro v4)
|   +-- sentence-transformers/
|   +-- networkx/
|   +-- spacy/
|   +-- scikit-learn/
|   +-- faiss/
|   +-- pykeen/
|   +-- pytorch/
|   +-- rank-bm25/
|   +-- firecrawl/
|   +-- tree-sitter/
|   |
|   +-- # Tier 2 (new)
|   +-- pyg/                             # PyTorch Geometric
|   +-- dgl/                             # Deep Graph Library
|   +-- slaps-gnn/                       # Graph structure learning
|   +-- ultra/                           # Foundation KG reasoning
|   +-- tgn/                             # Temporal Graph Networks (Travis fork)
|   +-- tgn-official/                    # TGN reference
|   +-- de-simple/                       # Temporal KG embeddings
|   +-- pyg-temporal/                    # Temporal GNN building blocks
|   +-- xgboost/                         # Gradient boosted trees
|   +-- lightgbm/                        # Fast gradient boosting
|   +-- torchrec/                        # Large-scale ranking
|   +-- torchtune/                       # LM fine-tuning
|   +-- transformers/                    # HuggingFace model hub
|   +-- dspy/                            # Modular LM programs
|   +-- autogen/                         # Multi-agent orchestration
|   +-- native/                          # Multimodal KG completion
|   +-- autoschemakg/                    # Schema induction
|   |
|   +-- # Tier 3 (new)
|   +-- pyreason/                        # Defeasible logic
|   +-- belief-revision-engine/          # AGM belief revision
|   +-- rnnlogic/                        # Rule learning from KGs
|   +-- scallop/                         # Differentiable logic
|   +-- anasime/                         # Structure-mapping analogy
|   +-- minerva/                         # RL graph path reasoning
|   +-- stable-baselines3/              # RL algorithms
|   +-- di-engine/                       # RL framework
|   +-- kg-rl/                           # Self-supervised RL for KGs
|   +-- deap/                            # Evolutionary algorithms
|   +-- optuna/                          # Hyperparameter optimization
|   +-- learn2learn/                     # Meta-learning
|   +-- metar/                           # Few-shot relation learning
|   +-- gen/                             # Few-shot entity generalization
|   +-- subgraph-gnn/                    # Neural subgraph matching
|   +-- pymc/                            # Probabilistic modeling
|   +-- evidential-dl/                   # Calibrated uncertainty
|   +-- gduq/                            # Graph uncertainty estimation
|   +-- box-embeddings/                  # Geometric hierarchy
|   +-- aiida-core/                      # Provenance workflows
|   +-- structrag/                       # Structured RAG answers
|
+-- examples/                            # Runnable code examples
|   +-- train/                           # /train examples
|   |   +-- learned-scorer-training.py
|   |   +-- gnn-link-prediction.py
|   |   +-- lora-fine-tune.py
|   |   +-- evolutionary-engine-tuning.py
|   +-- simulate/                        # /simulate examples
|   |   +-- counterfactual-retraction.py
|   |   +-- multi-agent-debate.py
|   |   +-- belief-revision.py
|   +-- measure/                         # /measure examples
|   |   +-- iq-report.py
|   |   +-- sensitivity-analysis.py
|   +-- reason/                          # /reason examples (from v4)
|   +-- graph/                           # /graph examples (from v4)
|
+-- product/
|   +-- theseus-plan.md                  # The 8-level roadmap
|   +-- level2-spec.md                   # Learned scoring spec
|   +-- iq-tracker-spec.md               # Intelligence measurement
|   +-- self-organizing-spec.md          # 5 feedback loops
|   +-- transition-spec.md               # Engine transition plan
|   +-- reference-bank.md               # External repo index
|   +-- domain-pack-spec.md              # Domain specialization
|   +-- landscape-analysis.md            # What exists, what doesn't
|
+-- scripts/
    +-- bootstrap_refs.sh                # Clone all reference repos
    +-- verify_refs.sh                   # Check which refs are present
```

---

## Multi-Agent Routing Examples

"Ship the Level 2 learned scorer":
  1. learned-scoring (architecture, feature vector, graceful fallback)
  2. software-architecture (model persistence, RQ scheduling)
  3. information-retrieval (feature extraction from BM25, TF-IDF)
  4. systems-theory (feedback loop: engagement -> labels -> model -> better scoring)

"Add a GNN structural similarity pass to the engine":
  1. graph-neural-networks (R-GCN training, embedding extraction)
  2. graph-theory (graph export, node feature construction)
  3. software-architecture (Modal GPU dispatch, two-mode fallback)
  4. learned-scoring (GNN embedding as a new feature in the scorer)

"Build counterfactual simulation for Claims":
  1. counterfactual-simulation (dependency trees, retraction cascading)
  2. symbolic-reasoning (TMS architecture, de Kleer ATMS)
  3. knowledge-representation (Claim model, provenance chains)
  4. causal-inference (temporal precedence, influence DAG)

"Implement the Advocate/Critic/Judge debate system":
  1. multi-agent-reasoning (role definition, grounded evidence rules)
  2. language-model-training (LoRA fine-tuning per role)
  3. claim-analysis (NLI scoring for evidence evaluation)
  4. reinforcement-learning (reward from human review of verdicts)

"Evolve engine hyperparameters using the IQ Tracker":
  1. evolutionary-optimization (NSGA-II multi-objective search)
  2. systems-theory (parameter sensitivity, feedback stability)
  3. domain-specialization (per-cluster configurations)
  4. learned-scoring (feature importance as fitness signal)

"Make the engine self-modify per domain (Level 5)":
  1. domain-specialization (per-cluster feature importance)
  2. reinforcement-learning (Thompson sampling for config selection)
  3. learned-scoring (cluster-conditioned scorer)
  4. evolutionary-optimization (CMA-ES for continuous parameters)
  5. systems-theory (loop stability analysis before deployment)

"Train a temporal graph memory model":
  1. temporal-graph-memory (TGN architecture, event stream)
  2. graph-neural-networks (node feature aggregation)
  3. software-architecture (Modal GPU, periodic retraining)
  4. self-organization (replace hand-tuned decay with learned memory)

---

## Level-to-Agent Mapping

Which agents are needed for each Theseus level:

| Level | Name | Primary Agents | Supporting Agents |
|---|---|---|---|
| L1 | Tool-Based Intelligence | (all Tier 1 agents) | software-architecture |
| L2 | Learned Connection Scoring | learned-scoring | training-pipeline, systems-theory |
| L3 | Hypothesis Generation | language-model-training | knowledge-representation, web-acquisition |
| L4 | Emergent Ontology | self-organization, domain-specialization | graph-neural-networks, symbolic-reasoning |
| L5 | Self-Modifying Pipeline | reinforcement-learning, evolutionary-optimization | domain-specialization, systems-theory |
| L6 | Multi-Agent Reasoning | multi-agent-reasoning, language-model-training | claim-analysis, reinforcement-learning |
| L7 | Counterfactual Simulation | counterfactual-simulation, symbolic-reasoning | causal-inference, systems-theory |
| L8 | Creative Hypothesis | graph-neural-networks, language-model-training | multi-agent-reasoning, web-acquisition, domain-specialization |

---

## Additional Reference Repos (suggested beyond README bank)

These are not in the original reference bank but are directly
relevant to the Theseus roadmap:

| Repo | Why | Phase | Action |
|---|---|---|---|
| `DLR-RM/stable-baselines3` | Production RL algorithms (PPO, SAC, A2C) for Level 5 policy learning | 5, 7 | Wrap |
| `optuna/optuna` | Bayesian + evolutionary hyperparameter optimization with pruning | 5 | Wrap |
| `DEAP/deap` | Flexible evolutionary algorithms (NSGA-II, CMA-ES) for multi-objective engine tuning | 5 | Wrap or Port |
| `dmlc/xgboost` | Reference gradient boosted trees for Level 2 scorer | 1 | Study |
| `microsoft/LightGBM` | Fast gradient boosting with categorical feature support | 1 | Study |
| `dmlc/dgl` | Deep Graph Library, alternative to PyG with good KG support | 2 | Study |
| `pyg-team/pytorch_geometric` | Primary GNN framework, R-GCN, GraphSAGE, GAT implementations | 2-8 | Wrap |
| `huggingface/transformers` | Model hub, tokenizers, LoRA adapters for language model training | 3, 6 | Wrap |
| `microsoft/autogen` | Multi-agent LLM orchestration for Advocate/Critic/Judge | 6 | Wrap or Study |
| `marcotcr/lime` | Local interpretable model explanations for scorer transparency | 1, 5 | Study |
| `shap/shap` | SHAP values for feature importance in the learned scorer | 1, 5 | Wrap |
| `modal-labs/modal-client` | Serverless GPU compute (already in use, include for reference) | Cross | Study |

---

## Version History

| Version | Date | Organizing Principle | Commands | Agents |
|---|---|---|---|---|
| SciPy-Pro 1.0 | Feb 2026 | File-based skills | 11 | 0 |
| SciPy-Pro 2.0 | Feb 2026 | File-based skills (validated) | 11 | 0 |
| SciPy-Pro 3.0 | Mar 2026 | Scientific disciplines (3-tier) | 10 | 0 |
| SciPy-Pro 4.0 | Mar 2026 | Epistemic engineering workflows | 4 | 12 |
| **Theseus-Pro 1.0** | **Mar 2026** | **Intelligence engineering (8 levels)** | **6** | **24** |
