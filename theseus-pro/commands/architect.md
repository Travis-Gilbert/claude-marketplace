---
description: "System design -- two-mode deployment, feedback loop control, pipeline optimization, layer separation, domain pack architecture."
argument-hint: "describe the architecture task"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Agent
---

# /architect — System Design Command

Separation of concerns in multi-layer systems: two-mode deployment,
feedback loop control, pipeline optimization, infrastructure patterns.

## Agents Loaded

- self-organization (feedback loop design, activation flags, dampening)
- program-synthesis (Method DSL, rule compilation, executable knowledge)
- software-architecture (two-mode contract, RQ tasks, Redis, Modal dispatch, Django patterns)
- systems-theory (feedback stability, sensitivity analysis, phase transitions, layered separation)
- evolutionary-optimization (pipeline-level optimization, config search spaces)
- domain-specialization (per-cluster config management, domain pack structure)

## Typical Workflows

### Design a new feedback loop safely
1. systems-theory: classify the loop (amplifying or stabilizing?)
2. systems-theory: sensitivity analysis on upstream parameters
3. self-organization: implement with kill switch and dampening
4. software-architecture: RQ scheduling, monitoring hooks
5. systems-theory: gradual loop closure protocol

### Add a new engine pass
1. software-architecture: engine.py pass pattern (stateful) or compose_engine.py (stateless)
2. software-architecture: two-mode degradation (production vs local vs Modal)
3. systems-theory: measure impact on downstream passes and IQ axes
4. learned-scoring: integrate new signal into feature vector

### Design the layer separation for a new capability
1. systems-theory: identify which layer this belongs to (capture, extraction, connection, self-org, learning, reasoning)
2. software-architecture: define inputs, outputs, and failure modes
3. systems-theory: ensure failure in this layer does not cascade
4. software-architecture: graceful fallback when this layer is unavailable

### Optimize the engine pipeline end-to-end
1. evolutionary-optimization: define the parameter search space
2. systems-theory: identify the bottleneck axis (lowest IQ score)
3. evolutionary-optimization: run CMA-ES or NSGA-II optimization
4. domain-specialization: deploy per-cluster configs

### Design a domain pack structure
1. domain-specialization: entity types, relation types, NER patterns
2. software-architecture: Django fixture format, management command
3. domain-specialization: evaluation benchmark for the domain
4. program-synthesis: domain-specific Method templates

## Key Files

- `apps/notebook/engine.py` (engine pass architecture)
- `apps/notebook/compose_engine.py` (stateless pass architecture)
- `apps/notebook/self_organize.py` (feedback loop architecture)
- `apps/notebook/tasks.py` (background job architecture)
- `apps/notebook/scheduling.py` (cron scheduling)
- `apps/notebook/apps.py` (AppConfig, pre-warming)
- `config/settings/` (Django settings, two-mode configuration)
