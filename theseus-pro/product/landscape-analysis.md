# Landscape Analysis: What Exists, What Doesn't

> Survey of frameworks evaluated for the Theseus roadmap, with verdicts on wrap, port, or study, and identification of gaps that require custom engineering.

## Frameworks Evaluated

### Graph Neural Networks

| Framework | Verdict | Why |
|-----------|---------|-----|
| PyTorch Geometric (PyG) | **Wrap** | Best R-GCN, CompGCN, GAT, GraphSAGE support. Active development. The primary GNN framework for Theseus. |
| Deep Graph Library (DGL) | **Study** | Strong KG support, good DGL-KE for embeddings. PyG has broader community and better PyTorch integration. |
| SLAPS-GNN | **Study** | Graph structure learning (learning the graph topology itself). Novel but research-stage. Ideas feed Loop 5. |
| ULTRA | **Study** | Foundation model for KG reasoning. Transfer learning across graphs. Relevant for L5 domain adaptation. |

### Temporal Graph Models

| Framework | Verdict | Why |
|-----------|---------|-----|
| TGN (Travis fork) | **Port** | Core temporal memory architecture for L3. Fork exists. Needs adaptation for Index event streams. |
| TGN (official) | **Study** | Reference implementation. Travis fork diverges for Index-specific needs. |
| DE-SimplE | **Study** | Temporal KGE. Time-bucketed relation parameters. Simpler than TGN, useful for temporal edge scoring. |
| PyG Temporal | **Wrap** | Building blocks for temporal GNN layers. Composable with PyG. |

### Symbolic Reasoning

| Framework | Verdict | Why |
|-----------|---------|-----|
| PyReason | **Wrap** | Defeasible logic over graphs. Directly applicable to rule-based inference in L4 and dependency propagation in L7. |
| Scallop | **Study** | Differentiable logic programming. Bridges neural and symbolic. Research-stage but ideas feed L4+L7. |
| Belief Revision Engine | **Port** | AGM belief revision. Small codebase. Core concepts needed for L7 (which beliefs to abandon on contradiction). |
| RNNLogic | **Study** | Rule learning from KG structure. Feeds Loop 5 (Emergent Type Detection) and L4. |
| ANASIME | **Study** | Structure-mapping analogy. Cross-domain structural parallels. Long-term L8 input. |

### Reinforcement Learning for KGs

| Framework | Verdict | Why |
|-----------|---------|-----|
| MINERVA | **Study** | RL path reasoning over KGs. Multi-hop query answering. Relevant for L5+L7 path-based reasoning. |
| DI-engine | **Study** | Full RL framework. More than needed for L5 contextual bandits, but useful reference for L7. |
| Stable Baselines3 | **Wrap** | Production RL algorithms (PPO, SAC). For L5 policy learning if contextual bandits are insufficient. |
| KG-RL | **Study** | Self-supervised RL for KG reasoning. Niche but directly relevant research. |

### Evolutionary Optimization

| Framework | Verdict | Why |
|-----------|---------|-----|
| DEAP | **Wrap or Port** | NSGA-II, CMA-ES, genetic algorithms. Flexible enough for multi-objective engine tuning (L5). |
| Optuna | **Wrap** | Bayesian + evolutionary hyperparameter optimization with pruning. Simpler API than DEAP for standard HPO. |
| learn2learn | **Study** | Meta-learning. "Learn to learn new domains quickly." Feeds L5 domain adaptation and few-shot relation learning. |

### Multi-Agent Orchestration

| Framework | Verdict | Why |
|-----------|---------|-----|
| AutoGen (AG2) | **Wrap or Study** | Microsoft's multi-agent LLM framework. Closest to Advocate/Critic/Judge pattern. May be too general. |
| CrewAI | **Study** | Role-based agent orchestration. Simpler than AutoGen. May be sufficient for L6 debate pattern. |

### Uncertainty and Probabilistic Reasoning

| Framework | Verdict | Why |
|-----------|---------|-----|
| PyMC | **Wrap** | Probabilistic modeling. Stochastic system dynamics analysis. Bayesian parameter estimation. |
| Evidential Deep Learning | **Study** | Calibrated uncertainty from neural networks. Useful for confidence scoring in L2+L3. |
| G-DUQ | **Study** | Graph uncertainty quantification. Uncertainty per node/edge from GNN. |
| Box Embeddings | **Study** | Geometric hierarchy embeddings. Containment relationships (is-a, part-of) as geometric operations. |

### Knowledge Graph Completion

| Framework | Verdict | Why |
|-----------|---------|-----|
| PyKEEN | **Wrap** | Already in use for KGE. Comprehensive KG embedding library. |
| NativE | **Study** | Multimodal KG completion. Extends KGE with image/text features. |
| VaLiK / ContinueMKGC | **Study** | Continual KG completion. Learning new relations without forgetting old ones. |
| MetaR | **Study** | Few-shot relation learning. New edge types from handful of examples. Feeds L4. |

### Structured Answering and RAG

| Framework | Verdict | Why |
|-----------|---------|-----|
| StructRAG (KernelMemory) | **Study** | Structured RAG answers. Graph-aware retrieval + structured output. |
| DSPy | **Wrap** | Modular LM programs with optimization. Useful for L3 prompt engineering. |

## Key Gaps

What no existing framework covers that Theseus must build custom:

**Epistemic-aware scoring**: No framework combines NLI entailment, KGE triples,
BM25 lexical match, and SBERT semantics into a unified connection scorer with
graceful degradation. The Level 2 learned scorer is novel integration work.

**Self-organizing knowledge graph**: Frameworks handle individual operations
(community detection, NER, type inference) but none orchestrate five feedback
loops with dampening, kill switches, and progressive loop closure.

**IQ measurement across seven axes**: No existing evaluation framework measures
a knowledge system across Discovery, Organization, Tension, Lineage, Retrieval,
Ingestion, and Learning simultaneously with weighted composite scoring.

**Two-mode deployment for ML-augmented KG**: No framework handles the constraint
of "full ML pipeline locally, zero PyTorch in production, GPU batch jobs on
Modal." This deployment topology is Theseus-specific.

**Counterfactual simulation over epistemic graphs**: TMS literature exists but
no production-ready library implements dependency-tree retraction with cascading
consequence analysis over a Django-backed knowledge graph.

**Domain-adaptive engine configuration**: Per-cluster engine weights selected
by contextual bandits with IQ-based reward. Combines RL, feature importance
decomposition, and self-organization in a way no single framework addresses.
