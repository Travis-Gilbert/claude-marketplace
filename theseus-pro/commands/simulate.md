---
description: "Reasoning and simulation -- counterfactual analysis, multi-agent debate, belief revision, hypothesis generation, structural analogies."
argument-hint: "describe the simulation task"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Agent
---

# /simulate — Reasoning and Simulation Command

Hypotheses, debate, counterfactuals, and belief revision. The
"what if?" and "how confident?" layer of Theseus.

## Agents Loaded

- claim-analysis (NLI scoring, claim pairing, stance detection)
- knowledge-representation (Claim model, epistemic status, dependency records)
- causal-inference (influence DAGs, temporal precedence, lineage tracing)
- probabilistic-reasoning (evidence weighting, confidence intervals, Bayesian update)
- language-model-training (grounded generation for hypothesis proposals)
- multi-agent-reasoning (Advocate/Critic/Judge debate, ensemble confidence)
- symbolic-reasoning (TMS, defeasible logic, AGM belief revision, rule learning)
- systems-theory (cascade analysis, stability under retraction scenarios)
- counterfactual-simulation (dependency trees, retraction, fragility analysis)
- temporal-graph-memory (temporal context for "what if at time T?" questions)

## Typical Workflows

### Run counterfactual simulation ("what if I removed this source?")
1. counterfactual-simulation: build dependency tree from Claim records
2. counterfactual-simulation: simulate retraction, compute cascading effects
3. systems-theory: analyze cascade depth and fragility score
4. probabilistic-reasoning: update confidence intervals on affected Claims

### Stress-test a Claim via adversarial debate
1. multi-agent-reasoning: Advocate gathers supporting evidence from graph
2. multi-agent-reasoning: Critic gathers weakening evidence
3. multi-agent-reasoning: Judge evaluates, assigns confidence
4. claim-analysis: NLI verification of cited evidence
5. knowledge-representation: update Claim epistemic status based on verdict

### Generate and evaluate a hypothesis
1. language-model-training: generate hypothesis from cluster gaps
2. claim-analysis: decompose hypothesis into testable Claims
3. counterfactual-simulation: "if this hypothesis were true, what follows?"
4. multi-agent-reasoning: debate the hypothesis
5. symbolic-reasoning: check consistency with existing rules

### Perform belief revision after contradictory evidence
1. symbolic-reasoning: identify the contradiction (AGM framework)
2. symbolic-reasoning: compute minimal revision set
3. counterfactual-simulation: simulate each possible revision
4. probabilistic-reasoning: Bayesian update on affected Claim confidences
5. knowledge-representation: update epistemic statuses

### Find structural analogies across domains
1. symbolic-reasoning: ANASIME structure-mapping between clusters
2. language-model-training: generate analogy descriptions
3. multi-agent-reasoning: debate whether the analogy holds
4. causal-inference: check temporal plausibility of cross-domain connections

## Key Files

- `apps/notebook/tms.py` (to build: Truth Maintenance System)
- `apps/notebook/counterfactual.py` (to build: simulation engine)
- `apps/notebook/debate_engine.py` (to build: multi-agent debate)
- `apps/notebook/epistemic_services.py` (existing epistemic operations)
- `apps/notebook/claim_decomposition.py`
- `apps/notebook/causal_engine.py`
- `apps/notebook/provenance.py`
