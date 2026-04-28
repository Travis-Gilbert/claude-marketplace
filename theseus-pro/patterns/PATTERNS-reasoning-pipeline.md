# PATTERNS-reasoning-pipeline.md

## Wiring R1-R4 Into Ask Theseus

### What This Pattern Covers

The query flow transformation from flat retrieval + LLM synthesis to
structured reasoning + LLM translation.

### Before (Current)

```
POST /api/v1/notebook/ask/
  -> views.AskView
  -> inquiry_engine.process_inquiry()
  -> unified_retrieval.unified_retrieve()  # returns flat ranked list
  -> compose_engine.run_compose_query()    # LLM synthesizes from list
  -> Response (objects, summary)
```

### After (Target)

```
POST /api/v1/notebook/ask/
  -> views.AskView
  -> inquiry_engine.process_inquiry()
  -> unified_retrieval.unified_retrieve()  # returns flat ranked list
  -> evidence_assembly.assemble_evidence() # builds ArgumentGraph (R1)
  -> deliberation.deliberate()             # produces ReasoningResult (R2)
  -> compose_engine.compose_with_reasoning()  # LLM translates (R4)
  -> Response (perspectives, tensions, confidence, gaps, sources)
```

### Integration Point: inquiry_engine.py

The change is in `process_inquiry()`. Add the reasoning pipeline after
retrieval, falling back to existing behavior if unavailable:

```python
def process_inquiry(query_text, notebook, **kwargs):
    # Step 1: Retrieve (unchanged)
    retrieval_results = unified_retrieve(query_text, notebook)

    # Step 2: Reasoning pipeline (NEW)
    try:
        from .evidence_assembly import assemble_evidence
        from .deliberation import deliberate
        argument_graph = assemble_evidence(query_text, retrieval_results)
        reasoning_result = deliberate(argument_graph)
        use_reasoning = True
    except (ImportError, Exception) as e:
        logger.warning(f"Reasoning pipeline unavailable: {e}")
        reasoning_result = None
        use_reasoning = False

    # Step 3: Expression
    if use_reasoning and reasoning_result:
        response = compose_with_reasoning(query_text, reasoning_result)
    else:
        response = run_compose_query(query_text, retrieval_results)

    return response
```

### Graceful Degradation Chain

```
Full pipeline available (PyTorch + NLI):
  Retrieval -> Evidence Assembly (with NLI pairs) -> Deliberation -> Expression

NLI unavailable (no PyTorch, production mode):
  Retrieval -> Evidence Assembly (existing edges + shared claims only) -> Deliberation -> Expression

Evidence assembly fails:
  Retrieval -> run_compose_query (existing behavior)
```

### Data Flow

```
unified_retrieve() returns:
  list[dict] with keys: object_pk, title, text, bm25_score, sbert_score,
  graph_score, entity_score, rrf_score, signal_sources

assemble_evidence() returns:
  ArgumentGraph with:
    nodes: dict[int, EvidenceNode]
    relations: list[EvidenceRelation]
    perspectives: list[dict]
    overall_confidence: float
    assembly_metadata: dict

deliberate() returns:
  ReasoningResult with:
    perspectives: list[Perspective]  # each has claims, confidence, support_chain
    tensions: list[dict]
    overall_confidence: float
    gaps: list[dict]
    reasoning_trace: list[dict]

compose_with_reasoning() returns:
  dict with:
    response: str
    perspectives: list[dict]
    tensions: list[dict]
    confidence: float
    gaps: list[dict]
    sources_cited: list[int]
```

### Verification

```bash
# After wiring:
python manage.py shell -c "
from apps.notebook.inquiry_engine import process_inquiry
from apps.notebook.models import Notebook
nb = Notebook.objects.first()
result = process_inquiry('what is epistemic entrenchment?', nb)
print('Has perspectives:', 'perspectives' in result)
print('Has tensions:', 'tensions' in result)
print('Has confidence:', 'confidence' in result)
"
```

### Agents Involved

1. argumentation-frameworks: ArgumentGraph semantics, perspective grouping
2. formal-epistemology: confidence calibration, entrenchment integration
3. retrieval-engineering: unified_retrieve output format and filtering
4. llm-engineering: compose_with_reasoning prompt, faithfulness checks
5. control-theory: spreading activation convergence in deliberation
6. software-architecture: graceful degradation, two-mode fallback
