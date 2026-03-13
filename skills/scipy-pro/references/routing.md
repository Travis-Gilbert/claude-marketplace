# Routing

## Workflow-to-Agent Map
| Workflow | Use when | Primary agent references |
| --- | --- | --- |
| `/reason` | Turn artifacts or text into claims, tensions, and model evidence | `agents/claim-analysis.md`, `agents/nlp-pipeline.md`, `agents/knowledge-representation.md`, `agents/probabilistic-reasoning.md` |
| `/graph` | Turn objects and edges into structure, lineage, and gaps | `agents/graph-theory.md`, `agents/causal-inference.md`, `agents/self-organization.md`, `agents/probabilistic-reasoning.md` |
| `/encode` | Turn reviewed evidence into executable methods and evaluators | `agents/program-synthesis.md`, `agents/knowledge-representation.md`, `agents/causal-inference.md`, `agents/software-architecture.md` |
| `/gather` | Build corpora and improve retrieval/extraction models from web + product feedback | `agents/web-acquisition.md`, `agents/training-pipeline.md`, `agents/information-retrieval.md`, `agents/software-architecture.md` |

## Transition-Phase Routing (Index Epistemic Engine)
| Phase | Goal | Read first |
| --- | --- | --- |
| Phase 0 | Stabilize epistemic primitives | `agents/knowledge-representation.md`, `product/epistemic-status.md` |
| Phase 1 | Build promotion pipeline | `patterns/PATTERNS-promotion.md`, `product/promotion-pipeline.md` |
| Phase 2 | Ship inquiry-first surfaces | `product/epistemic-status.md`, `agents/claim-analysis.md`, `agents/graph-theory.md` |
| Phase 3 | Ship executable knowledge | `patterns/PATTERNS-method-dsl.md`, `product/method-dsl-design.md` |
| Phase 4 | Add domain packs | `product/domain-pack-spec.md`, `agents/program-synthesis.md` |
| Phase 5 | Add learning and evaluation loops | `product/learning-roadmap.md`, `agents/training-pipeline.md` |

## Load Order
1. Read this file.
2. Read only the agents needed for the active workflow.
3. Read one pattern file that matches the implementation move.
4. Read product file(s) when the task changes roadmap behavior, status semantics, or promotion policy.
5. Read code and refs before editing.

## Source-First Reminders
- Read the target `research_api` module before applying any pattern.
- Verify framework behavior in source repos when API details matter.
- Prefer graceful degradation and explicit pass states over hidden failures.
