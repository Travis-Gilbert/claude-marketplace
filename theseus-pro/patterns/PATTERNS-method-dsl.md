# PATTERNS-method-dsl.md

How to turn knowledge into an executable Method using the declarative DSL.

## Build Sequence

### Step 1: Understand the Method Model

```python
class Method(TimeStampedModel):
    # Types: rule_set, scoring_model, benchmark_protocol, checklist,
    #        comparison_matrix, procedure, other
    method_type = ...

    # Runtime: declarative_json, python_trusted, manual, llm_draft
    runtime_kind = ...

    # Status lifecycle: draft -> candidate -> reviewed -> trusted -> deprecated
    status = ...

    # The executable specification (JSON)
    spec = models.JSONField(default=dict)

    # Version tracking
    version = models.IntegerField(default=1)
    parent_method = models.ForeignKey('self', ...)
```

### Step 2: DSL Operators

The declarative JSON DSL supports these operators (defined in method_runtime.py):

```python
ALLOWED_DSL_OPERATORS = {
    'comparison',              # Compare two values
    'threshold',               # Score >= threshold -> pass
    'boolean_condition',       # AND/OR/NOT logic
    'weighted_sum',            # Linear combination of scores
    'ordered_steps',           # Sequential checklist
    'required_evidence_check', # Verify evidence exists
}
```

Example spec for a scoring method:
```json
{
  "operator": "weighted_sum",
  "weights": {
    "sbert_cosine": 0.3,
    "shared_entity_count": 0.2,
    "nli_entailment": 0.3,
    "bm25_score": 0.2
  },
  "threshold": 0.5,
  "description": "Connection strength scoring rule"
}
```

Example spec for a checklist:
```json
{
  "operator": "ordered_steps",
  "steps": [
    {"label": "Verify source exists", "operator": "required_evidence_check", "evidence_type": "source"},
    {"label": "Check contradiction score", "operator": "threshold", "field": "nli_contradiction", "threshold": 0.3, "direction": "below"},
    {"label": "Confirm entity overlap", "operator": "comparison", "field": "shared_entity_count", "op": ">=", "value": 1}
  ]
}
```

### Step 3: Security -- Disallowed Keys

```python
DISALLOWED_SPEC_KEYS = {'code', 'python', 'script', 'exec', 'eval', 'command'}
```

The runtime rejects any spec containing these keys. Methods are declarative only.
The `python_trusted` runtime_kind is reserved for admin-reviewed code and requires
TrustPolicy approval.

### Step 4: Method Compilation

```python
def compile_method(spec: dict) -> callable:
    """Compile a declarative spec into an executable function."""
    operator = spec.get('operator')
    if operator not in ALLOWED_DSL_OPERATORS:
        raise MethodRuntimeError(f'Unknown operator: {operator}')

    if operator == 'weighted_sum':
        weights = spec['weights']
        threshold = spec.get('threshold', 0.0)
        def run(features: dict) -> dict:
            score = sum(weights.get(k, 0) * features.get(k, 0) for k in weights)
            return {'score': score, 'passed': score >= threshold}
        return run

    if operator == 'ordered_steps':
        step_fns = [compile_method(step) for step in spec['steps']]
        def run(features: dict) -> dict:
            results = []
            for i, fn in enumerate(step_fns):
                result = fn(features)
                results.append(result)
                if not result.get('passed', True):
                    return {'passed': False, 'failed_step': i, 'results': results}
            return {'passed': True, 'results': results}
        return run
    # ... other operators
```

### Step 5: MethodRun Execution

```python
from .models import Method, MethodRun

def execute_method(method: Method, target_object=None, features=None):
    run = MethodRun.objects.create(
        method=method,
        target_object=target_object,
        status='running',
        input_data=features or {},
    )
    try:
        compiled = compile_method(method.spec)
        result = compiled(features or {})
        run.output_data = result
        run.status = 'succeeded'
    except Exception as exc:
        run.output_data = {'error': str(exc)}
        run.status = 'failed'
    run.save()
    return run
```

### Step 6: Versioning

When modifying a trusted Method, create a new version:

```python
def create_new_version(method: Method, new_spec: dict) -> Method:
    new_method = Method.objects.create(
        name=method.name,
        spec=new_spec,
        version=method.version + 1,
        parent_method=method,
        status='draft',  # New version starts as draft
        runtime_kind=method.runtime_kind,
        method_type=method.method_type,
    )
    method.status = 'deprecated'
    method.save(update_fields=['status'])
    return new_method
```

## Critical Constraints

- Methods are declarative JSON only -- no executable code in specs
- DISALLOWED_SPEC_KEYS are checked recursively through the entire spec tree
- python_trusted requires TrustPolicy approval (admin-only)
- New versions start as draft regardless of parent status
- MethodRun records are immutable once status is succeeded or failed
- Every MethodRun captures input_data and output_data for reproducibility
- LLM-drafted methods (runtime_kind='llm_draft') must be reviewed before execution
