# Epistemic Status

## Built vs Planned (Index Transition)
| Capability | Status | Primary files |
| --- | --- | --- |
| 7-pass persisted engine | Built | `apps/notebook/engine.py` |
| 6-pass compose engine | Built | `apps/notebook/compose_engine.py` |
| Adaptive NER + BM25 + FAISS + claim decomposition | Built | `adaptive_ner.py`, `bm25.py`, `vector_store.py`, `claim_decomposition.py` |
| Causal DAG, clustering, gap analysis, resurfacing, self-organization loops | Built | `causal_engine.py`, `community.py`, `gap_analysis.py`, `resurface.py`, `self_organize.py` |
| Epistemic primitives (Claim/Question/Tension/Model/Method/Run/Narrative) | Scaffolded and partially integrated | `apps/notebook/models.py` |
| Promotion queue and review actions | Designed, not fully implemented | transition spec |
| Method DSL + runtime | Designed, narrow implementation pending | transition spec |
| Domain packs | Designed | transition spec |
| Learning/evaluation layer | Designed, staged rollout pending | transition spec |

## Operational Interpretation
- Treat built capabilities as reliable building blocks.
- Treat scaffolded capabilities as extension points requiring reconciliation before edits.
- Treat designed capabilities as roadmap scope; do not claim shipped behavior without code proof.
