---
description: "Graph intelligence -- from objects to structure. Community detection, causal inference, self-organization, GNN embeddings, temporal memory."
argument-hint: "describe the graph task"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Agent
---

# /graph — Graph Intelligence Command

From objects to structure: community detection, causal inference,
self-organization, gap analysis, GNN embeddings, temporal memory.

## Agents Loaded

- knowledge-representation (graph schema, ontology, epistemic primitives)
- graph-theory (community detection, centrality, structural holes, DAGs)
- causal-inference (temporal precedence, influence DAGs, lineage)
- probabilistic-reasoning (edge confidence, Bayesian decay)
- self-organization (5 feedback loops, emergent structure)
- graph-neural-networks (structural embeddings, link prediction)
- temporal-graph-memory (TGN, event-based node memory, dynamic evolution)
- systems-theory (feedback stability, sensitivity, loop control)

## Typical Workflows

### Analyze graph structure after engine run
1. graph-theory: community detection, centrality measures
2. self-organization: evaluate feedback loop status
3. systems-theory: sensitivity analysis on current configuration

### Add GNN structural embeddings
1. graph-neural-networks: export graph, train R-GCN, extract embeddings
2. graph-theory: validate structural coherence of embeddings
3. systems-theory: measure impact on downstream scoring

### Build causal influence DAG
1. causal-inference: temporal precedence filtering, DAG construction
2. graph-theory: transitive reduction, root/leaf analysis
3. temporal-graph-memory: enrich with temporal context

## Key Files

- `apps/notebook/community.py`
- `apps/notebook/gap_analysis.py`
- `apps/notebook/causal_engine.py`
- `apps/notebook/temporal_evolution.py`
- `apps/notebook/self_organize.py`
- `apps/notebook/vector_store.py`
