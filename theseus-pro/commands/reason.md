---
description: "Epistemic reasoning -- from raw text to structured claims, tensions, and models. NER, NLI scoring, claim decomposition, confidence calibration."
argument-hint: "describe the reasoning task"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Agent
---

# /reason — Epistemic Reasoning Command

From raw text to structured claims, tensions, and models.

## What This Command Does

Takes unstructured text and transforms it into typed epistemic
primitives: Claims, Questions, Tensions, EpistemicModels. This
is the "understanding" phase of the pipeline.

## Agents Loaded

- information-retrieval (finding relevant evidence for claim evaluation)
- nlp-pipeline (NER, tokenization, sentence splitting, embeddings)
- claim-analysis (NLI scoring, claim decomposition, stance detection)
- knowledge-representation (Claim model, epistemic status, ontology)
- probabilistic-reasoning (evidence weighting, confidence intervals)

## Typical Workflows

### Extract claims from a new Source
1. nlp-pipeline: sentence splitting, NER, entity extraction
2. claim-analysis: claim decomposition (LLM or rule-based)
3. knowledge-representation: create Claim records with epistemic status
4. probabilistic-reasoning: assign initial confidence scores

### Detect tensions between Claims
1. claim-analysis: pairwise NLI scoring across Claims
2. probabilistic-reasoning: threshold calibration for contradiction
3. knowledge-representation: create Tension records linking contradicting Claims

### Build an EpistemicModel from evidence
1. information-retrieval: gather all Claims and evidence for a Question
2. claim-analysis: evaluate support/contradiction across evidence
3. knowledge-representation: construct EpistemicModel with assumptions and scope
4. probabilistic-reasoning: uncertainty quantification for the model

## Key Files

- `apps/notebook/claim_decomposition.py`
- `apps/notebook/engine.py` (Passes 1, 5, 6)
- `apps/notebook/compose_engine.py` (NLI pass)
- `apps/research/advanced_nlp.py`
- `apps/notebook/epistemic_services.py`
