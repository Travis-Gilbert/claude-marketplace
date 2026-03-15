# Routing

## Workflow-to-Agent Map

| Workflow | Use when | Primary agent references |
|----------|----------|--------------------------|
| `/reason` | Turn artifacts or text into claims, tensions, and model evidence | claim-analysis, nlp-pipeline, knowledge-representation, probabilistic-reasoning, information-retrieval |
| `/graph` | Turn objects and edges into structure, lineage, and gaps | graph-theory, causal-inference, self-organization, probabilistic-reasoning, knowledge-representation |
| `/encode` | Turn reviewed evidence into executable methods and evaluators | program-synthesis, knowledge-representation, causal-inference, claim-analysis, software-architecture |
| `/gather` | Build corpora and improve retrieval/extraction models from web + product feedback | web-acquisition, training-pipeline, information-retrieval, nlp-pipeline, software-architecture |

## Transition-Phase Routing (Index Epistemic Engine)

| Phase | Goal | Read first |
|-------|------|------------|
| Phase 0 | Stabilize epistemic primitives | knowledge-representation agent, product/epistemic-status.md |
| Phase 1 | Build promotion pipeline | patterns/PATTERNS-promotion.md, product/promotion-pipeline.md |
| Phase 2 | Ship inquiry-first surfaces | product/epistemic-status.md, claim-analysis agent, graph-theory agent |
| Phase 3 | Ship executable knowledge | patterns/PATTERNS-method-dsl.md, product/method-dsl-design.md |
| Phase 4 | Add domain packs | product/domain-pack-spec.md, program-synthesis agent |
| Phase 5 | Add learning and evaluation loops | product/learning-roadmap.md, training-pipeline agent |

## Load Order

1. Read this file.
2. Read only the agents needed for the active workflow.
3. Read one pattern file that matches the implementation move.
4. Read product file(s) when the task changes roadmap behavior, status semantics, or promotion policy.
5. Read code and refs before editing.

## Source-First Reminders

- Read the target research_api module before applying any pattern.
- Verify framework behavior in source repos when API details matter.
- Prefer graceful degradation and explicit pass states over hidden failures.
