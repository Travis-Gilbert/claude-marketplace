# Theseus-Pro Agent Registry

## Tier 1: Epistemic Foundation (from SciPy-Pro v4)

### information-retrieval.md
  BM25, TF-IDF, FAISS ANN, re-ranking, query expansion, RRF.
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
  Feedback loops, emergent classification, entity promotion, cluster->notebook,
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

---

## Tier 2: Intelligence Layer (new for Theseus-Pro)

### learned-scoring.md
  Gradient boosted trees, feature engineering, implicit feedback,
  cold-start web validation, graceful degradation, cross-validation.
  The science of learning which signal combinations indicate real connections.
  *Theseus Level 2.*

### graph-neural-networks.md
  R-GCN, CompGCN, GraphSAGE, GAT, message passing, link prediction,
  node classification, structural embeddings.
  The science of making graphs learnable by neural networks.
  *Theseus Levels 3-8.*

### temporal-graph-memory.md
  Temporal Graph Networks, event-based node memory, DE-SimplE,
  sliding-window dynamics, learned temporal decay.
  The science of modeling how knowledge evolves over time.
  *Theseus Level 3.*

### language-model-training.md
  LoRA fine-tuning, grounded generation, task-specific training data,
  faithfulness evaluation, small LM selection (Qwen, Phi-3).
  The science of making language models speak from evidence.
  *Theseus Levels 3, 6.*

### multimodal-networks.md
  Florence-2, LLaVA, Qwen-VL, layout-aware document understanding,
  cross-modal embeddings, continual multimodal KG growth.
  The science of understanding documents as more than text.
  *Theseus Level 6.*

### multi-agent-reasoning.md
  Advocate/Critic/Judge pattern, grounded debate, ensemble confidence,
  debate-as-training, CourtEval rubrics.
  The science of stress-testing knowledge claims.
  *Theseus Level 6.*

---

## Tier 3: Generative Intelligence (new for Theseus-Pro)

### reinforcement-learning.md
  Contextual bandits, Thompson sampling, MINERVA path reasoning,
  reward shaping, policy gradient methods.
  The science of learning optimal actions from interaction rewards.
  *Theseus Levels 5, 7.*

### evolutionary-optimization.md
  Genetic algorithms, NSGA-II multi-objective, CMA-ES continuous,
  neuroevolution, IQ-based fitness functions.
  The science of population-based search for optimal configurations.
  *Theseus Level 5.*

### symbolic-reasoning.md
  Defeasible logic (PyReason), AGM belief revision, Truth Maintenance
  Systems (TMS/ATMS), RNNLogic rule learning, ANASIME analogy.
  The science of logic-based inference and principled belief change.
  *Theseus Levels 4, 7.*

### systems-theory.md
  Feedback loop classification, attractor dynamics, sensitivity analysis,
  gradual loop closure, phase transitions, information capacity, layered
  separation of concerns.
  The meta-discipline for reasoning about Theseus as a whole.
  *Cross-level.*

### counterfactual-simulation.md
  Dependency trees, retraction cascading, fragility analysis,
  ATMS multi-context, alternative graph state comparison.
  The science of "what if?" reasoning over knowledge structures.
  *Theseus Level 7.*

### domain-specialization.md
  Per-cluster adaptation, feature importance decomposition, meta-learning,
  few-shot relation learning (MetaR), schema induction (AutoSchemaKG),
  domain pack construction.
  The science of making the engine adapt to different knowledge domains.
  *Theseus Levels 5, 7.*

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

"Implement the EpiGNN extensions for the GNN":
  1. graph-neural-networks (HeterophilyAwareConv, ORC weights, two-state)
  2. graph-theory (ORC computation, Leiden community membership)
  3. software-architecture (Modal GPU dispatch, S3 export of both states)
  4. systems-theory (contradiction separation metric, bridge amplification)

"Train RotatE KGE on the epistemic graph":
  1. knowledge-representation (triple export, relation grammar, entity IDs)
  2. training-pipeline (PyKEEN RotatE, negative sampling, early stopping)
  3. learned-scoring (five KGE features, GNN co-training regularization)
  4. software-architecture (Modal dispatch, S3 model storage)

"Fine-tune the SBERT encoder for epistemic tasks":
  1. training-pipeline (six triplet sources, bootstrap, MultipleNegativesRankingLoss)
  2. nlp-pipeline (negation detection, claim extraction, question formulation)
  3. information-retrieval (view-type routing, multi-view embedding storage)
  4. graph-theory (community-based hard negative mining)

"Wire the three-stream GL-Fusion architecture":
  1. graph-neural-networks (Stream A: EpiGNN h_content + h_epistemic)
  2. training-pipeline (Stream B: epistemic SBERT alignment)
  3. knowledge-representation (Stream C: KGE structural tokens)
  4. language-model-training (Gemma A31B cross-attention integration)
  5. systems-theory (gate alpha evaluation, query-type variance)

"Set up compound learning for theseus-pro":
  1. software-architecture (knowledge/ directory, manifest, /learn command)
  2. self-organization (auto-capture triggers, claim lifecycle)
  3. probabilistic-reasoning (Bayesian confidence, temporal decay)
  4. domain-specialization (agent domain mappings, cross-plugin linking)
