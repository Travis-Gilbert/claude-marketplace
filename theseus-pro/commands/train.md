---
description: "Model training and learned intelligence -- GBT scoring, GNN embeddings, SBERT fine-tuning, LoRA LMs, evolutionary optimization, RL."
argument-hint: "describe the training task"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Agent
---

# /train — Model Training and Learned Intelligence Command

From features to models to evaluation to adaptation. Everything
that makes Theseus learn from data and use.

## Agents Loaded

- information-retrieval (feature extraction from BM25, TF-IDF retrieval signals)
- nlp-pipeline (SBERT embedding features, NER signal features)
- knowledge-representation (graph schema for feature construction, KGE training)
- training-pipeline (SBERT fine-tuning, triplet construction, evaluation metrics)
- web-acquisition (cold-start web validation, corpus building for training)
- learned-scoring (GBT training, feature vectors, graceful degradation)
- graph-neural-networks (R-GCN/CompGCN training, structural embeddings)
- temporal-graph-memory (TGN training, event stream processing)
- language-model-training (LoRA fine-tuning, grounded generation)
- multimodal-networks (VLM integration, cross-modal embedding training)
- reinforcement-learning (reward shaping, policy training, bandit updates)
- evolutionary-optimization (hyperparameter evolution, multi-objective search)
- domain-specialization (per-cluster adaptation, meta-learning, domain packs)

## Typical Workflows

### Ship the Level 2 learned scorer
1. learned-scoring: build ConnectionFeedback model, capture signals
2. web-acquisition: cold-start web validation for initial labels
3. learned-scoring: construct feature vectors from all 7 passes
4. learned-scoring: train GBT with cross-validation, evaluate
5. domain-specialization: decompose feature importance per cluster

### Train GNN structural embeddings
1. graph-neural-networks: export graph to PyG format
2. graph-neural-networks: train R-GCN on Modal for link prediction
3. graph-neural-networks: extract and store node embeddings
4. learned-scoring: add GNN embedding as new scorer feature

### Fine-tune a knowledge-grounded language model
1. language-model-training: build training set from graph content
2. language-model-training: LoRA fine-tune on Modal (Qwen 2.5 or Phi-3)
3. language-model-training: evaluate faithfulness and traceability
4. training-pipeline: active learning to identify weak spots

### Evolve engine configuration
1. evolutionary-optimization: define genome (all engine parameters)
2. evolutionary-optimization: run NSGA-II with IQ axes as objectives
3. domain-specialization: deploy evolved configs per cluster
4. reinforcement-learning: online refinement via Thompson sampling

### Train temporal graph memory
1. temporal-graph-memory: export event stream from Django
2. temporal-graph-memory: train TGN on Modal
3. temporal-graph-memory: extract temporal node embeddings
4. learned-scoring: add temporal features to scorer

### Build domain-adapted SBERT
1. web-acquisition: Firecrawl scrape for domain corpus
2. training-pipeline: claim decomposition on scraped content
3. training-pipeline: pairwise NLI for triplet construction
4. training-pipeline: fine-tune SBERT on domain triplets
5. training-pipeline: rebuild FAISS index, evaluate Precision@10

## Key Files

- `apps/notebook/learned_scorer.py` (to build)
- `apps/notebook/vector_store.py`
- `apps/notebook/engine.py`
- `apps/notebook/tasks.py`
- `apps/notebook/scheduling.py`
- `apps/notebook/embedding_service.py`
- `apps/research/advanced_nlp.py`
- `scripts/train_kge.py`
