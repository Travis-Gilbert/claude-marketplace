# The Eight Levels of Theseus

> Roadmap from tool-based knowledge discovery to creative hypothesis generation.

## Overview

Eight levels trace the evolution of Index-API from a pipeline that runs fixed
algorithms (Level 1) to a system that generates novel hypotheses from structural
anomalies (Level 8). Each level closes a new feedback loop, making the system
measurably smarter on the IQ Tracker's seven axes.

Named for Claude Shannon's maze-navigating mouse (1950): the intelligence is not
in the mouse but in the maze. The relay circuits under the floor record which
direction leads forward.

## Level 1: Tool-Based Intelligence (SHIPPED)

**Status**: Current production state.

All 12 Tier 1 agents. Seven engine passes with fixed weights. BM25, TF-IDF,
SBERT, NLI, KGE, community detection, gap analysis. compose_engine (stateless)
and engine.py (stateful). Two-mode deployment (Railway/Local). Five self-org
loops defined but not all closed. IQ composite: ~31/100.

**Primary agents**: all Tier 1 (information-retrieval, nlp-pipeline,
claim-analysis, knowledge-representation, graph-theory, causal-inference,
probabilistic-reasoning, self-organization, program-synthesis,
software-architecture, training-pipeline, web-acquisition)

## Level 2: Learned Connection Scoring (NEXT)

**Status**: Specced. See `level2-spec.md`.

Replace fixed combination weights with a GBT learned scorer. 14-20 feature
vector from all seven passes. Training labels from user feedback + web
validation. Graceful degradation at 3 thresholds (<50, 50-200, 200+).

**Primary agents**: learned-scoring, training-pipeline, systems-theory

## Level 3: Hypothesis Generation

Fine-tuned small LM (Qwen 2.5 0.5B or Phi-3 Mini) conditioned on graph
structure. Generates hypotheses grounded in evidence, not hallucination.
LoRA fine-tuning on Modal GPU. Evaluation via faithfulness, coverage, novelty.

**Primary agents**: language-model-training, knowledge-representation,
web-acquisition

## Level 4: Emergent Ontology

Self-organizing Loop 5 (Emergent Type Detection) with learned rule inference.
System discovers new entity types and relation types from graph structure.
RNNLogic for rule learning, AutoSchemaKG for schema induction.

**Primary agents**: self-organization, domain-specialization,
graph-neural-networks, symbolic-reasoning

## Level 5: Self-Modifying Pipeline

Per-domain engine configuration selected by contextual bandits / Thompson
sampling. The engine notices which signal combinations matter in which clusters
and adapts automatically. NSGA-II for multi-objective parameter search using
IQ axes as fitness.

**Primary agents**: reinforcement-learning, evolutionary-optimization,
domain-specialization, systems-theory

## Level 6: Multi-Agent Epistemic Reasoning

Advocate/Critic/Judge debate system. Three fine-tuned LM instances with
adversarial roles. Grounded in graph evidence. Human review of verdicts
becomes training data for all three agents.

**Primary agents**: multi-agent-reasoning, language-model-training,
claim-analysis, reinforcement-learning

## Level 7: Counterfactual Simulation

Truth Maintenance Systems (Doyle 1979, de Kleer ATMS 1986). Dependency trees
for Claims. "What if Source A were removed?" Fragility analysis, cascading
retraction, multi-context worlds.

**Primary agents**: counterfactual-simulation, symbolic-reasoning,
causal-inference, systems-theory

## Level 8: Creative Hypothesis Generation

Structural anomaly detection + abductive reasoning. GNN identifies unusual
graph patterns. LM generates explanatory hypotheses. Multi-agent debate
stress-tests them. The system proposes ideas humans haven't considered.

**Primary agents**: graph-neural-networks, language-model-training,
multi-agent-reasoning, web-acquisition, domain-specialization

## Dependencies Between Levels

- L2 depends on L1 (needs all seven passes to construct feature vectors)
- L3 depends on L2 (learned scorer provides training signal quality)
- L4 depends on L3 (hypothesis generation feeds emergent type proposals)
- L5 depends on L2 + L4 (per-cluster scoring + discovered ontology)
- L6 depends on L3 (fine-tuned LMs for each debate role)
- L7 depends on L4 (dependency trees require stable ontology)
- L8 depends on L3 + L5 + L6 (LM + adaptive engine + debate validation)

## Timeline Estimates

<!-- Fill in when sprint planning begins for each level -->

| Level | Estimated Start | Estimated Duration | Status |
|-------|-----------------|-------------------|--------|
| L1 | -- | -- | SHIPPED |
| L2 | TBD | TBD | SPECCED |
| L3 | TBD | TBD | OUTLINED |
| L4 | TBD | TBD | OUTLINED |
| L5 | TBD | TBD | OUTLINED |
| L6 | TBD | TBD | OUTLINED |
| L7 | TBD | TBD | OUTLINED |
| L8 | TBD | TBD | OUTLINED |
