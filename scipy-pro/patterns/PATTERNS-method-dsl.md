# Pattern: Method DSL (Executable Knowledge)

Methods store executable knowledge as structured JSON definitions.
They are not Turing-complete. They are declarative where possible,
with controlled procedural elements for scoring and evaluation.

## Method Model

```python
class Method(models.Model):
    source_object = models.ForeignKey(Object, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=500)
    definition = models.JSONField()        # The executable spec
    version = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20)  # draft, compiled, active, retired
    provenance_sha = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class MethodRun(models.Model):
    method = models.ForeignKey(Method, on_delete=models.CASCADE)
    input_data = models.JSONField()
    output_data = models.JSONField()
    status = models.CharField(max_length=20)  # running, completed, failed
    duration_ms = models.PositiveIntegerField(null=True)
    input_sha = models.CharField(max_length=64)
    output_sha = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
```

## Definition Schema

The `definition` JSONField follows a type-specific schema.

### Protocol (from papers/procedures)

```json
{
  "type": "protocol",
  "version": "1.0",
  "source_sha": "abc123...",
  "steps": [
    {
      "order": 1,
      "instruction": "Collect baseline measurements",
      "inputs": ["subject_data"],
      "outputs": ["baseline_metrics"],
      "conditions": [],
      "notes": "Ensure fasting state for blood markers"
    },
    {
      "order": 2,
      "instruction": "Apply intervention for 4 weeks",
      "inputs": ["baseline_metrics", "intervention_spec"],
      "outputs": ["post_metrics"],
      "conditions": [
        {"field": "baseline_metrics.complete", "op": "eq", "value": true}
      ]
    }
  ],
  "required_inputs": ["subject_data", "intervention_spec"],
  "expected_outputs": ["baseline_metrics", "post_metrics", "comparison"]
}
```

### Rule Set (from laws/guidelines/rules)

```json
{
  "type": "rule_set",
  "version": "1.0",
  "source_sha": "def456...",
  "rules": [
    {
      "id": "R1",
      "condition": {
        "field": "sample_size",
        "op": "gte",
        "value": 30
      },
      "outcome": "sufficient_power",
      "explanation": "Minimum sample size for statistical significance"
    },
    {
      "id": "R2",
      "condition": {
        "all": [
          {"field": "p_value", "op": "lt", "value": 0.05},
          {"field": "effect_size", "op": "gte", "value": 0.2}
        ]
      },
      "outcome": "significant_with_meaningful_effect",
      "explanation": "Both statistical and practical significance"
    }
  ],
  "evaluation_mode": "all"
}
```

### Checklist (from guides/standards)

```json
{
  "type": "checklist",
  "version": "1.0",
  "source_sha": "789abc...",
  "items": [
    {
      "order": 1,
      "check": "Research question clearly stated",
      "category": "framing",
      "required": true
    },
    {
      "order": 2,
      "check": "Prior work surveyed (minimum 5 sources)",
      "category": "context",
      "required": true,
      "validation": {
        "field": "source_count",
        "op": "gte",
        "value": 5
      }
    }
  ],
  "pass_threshold": 0.8
}
```

### Scoring Function (from methods/criteria)

```json
{
  "type": "scoring_function",
  "version": "1.0",
  "source_sha": "xyz789...",
  "dimensions": [
    {
      "name": "novelty",
      "weight": 0.3,
      "scale": {"min": 0, "max": 5},
      "rubric": {
        "0": "No new information",
        "3": "New combination of known ideas",
        "5": "Fundamentally new insight"
      }
    },
    {
      "name": "evidence_quality",
      "weight": 0.4,
      "scale": {"min": 0, "max": 5},
      "rubric": {
        "0": "No evidence cited",
        "3": "Multiple sources, some primary",
        "5": "Systematic evidence with replication"
      }
    }
  ],
  "aggregation": "weighted_sum",
  "normalization": "min_max"
}
```

## Condition Operators

The DSL supports a fixed set of comparison operators:

| Operator | Meaning |
|----------|---------|
| `eq` | Equals |
| `neq` | Not equals |
| `gt` | Greater than |
| `gte` | Greater than or equal |
| `lt` | Less than |
| `lte` | Less than or equal |
| `in` | Value in list |
| `contains` | String contains |
| `matches` | Regex match |

Logical combinators:

| Combinator | Meaning |
|-----------|---------|
| `all` | All conditions must be true (AND) |
| `any` | At least one condition must be true (OR) |
| `not` | Negate the condition |

## Method Versioning

Each version is a snapshot. Edits create a new version, not a mutation.

```python
def create_method_version(method, new_definition, reason):
    """Create a new version of a method."""
    new_version = Method.objects.create(
        source_object=method.source_object,
        title=method.title,
        definition=new_definition,
        version=method.version + 1,
        status='draft',
        provenance_sha=_sha256(json.dumps(new_definition, sort_keys=True)),
    )
    # Link versions
    Edge.objects.create(
        from_object=new_version.source_object,
        to_object=method.source_object,
        edge_type='version_of',
        reason=f"Version {new_version.version}: {reason}",
        strength=1.0,
        is_auto=True,
        engine='method_versioning',
    )
    return new_version
```

## MethodRun Recording

Every execution is recorded with SHA hashes for reproducibility:

```python
import hashlib, json, time

def run_method(method, input_data):
    """Execute a method and record the run."""
    input_sha = hashlib.sha256(
        json.dumps(input_data, sort_keys=True).encode()
    ).hexdigest()

    run = MethodRun.objects.create(
        method=method,
        input_data=input_data,
        output_data={},
        status='running',
        input_sha=input_sha,
        output_sha='',
    )

    start = time.monotonic()
    try:
        output = _execute_definition(method.definition, input_data)
        duration = int((time.monotonic() - start) * 1000)

        run.output_data = output
        run.output_sha = hashlib.sha256(
            json.dumps(output, sort_keys=True).encode()
        ).hexdigest()
        run.status = 'completed'
        run.duration_ms = duration
    except Exception as exc:
        run.output_data = {'error': str(exc)}
        run.status = 'failed'
        run.duration_ms = int((time.monotonic() - start) * 1000)

    run.save()
    return run
```

## Rule Compilation: Source Type -> Method Type

| Source Object Type | Method Type | What It Produces |
|-------------------|-------------|------------------|
| Paper / Study | Protocol | Step-by-step procedure |
| Law / Regulation | Rule Set | Machine-evaluable conditions |
| Guide / Standard | Checklist | Ordered verification steps |
| Method / Criteria | Scoring Function | Weighted evaluation rubric |

Compilation is LLM-assisted: the LLM reads the source Object and proposes
a structured definition. Human reviews before the Method becomes active.

## Evaluation Feedback Loop

MethodRun outcomes feed back into the learning layer:

```python
def evaluate_run(run, human_judgment):
    """Record human evaluation of a method run."""
    run.output_data['evaluation'] = {
        'judgment': human_judgment,  # 'correct', 'partially_correct', 'incorrect'
        'evaluated_at': now_iso(),
    }
    run.save()

    # If method consistently produces poor results, flag for revision
    recent_runs = MethodRun.objects.filter(
        method=run.method,
        status='completed',
    ).order_by('-created_at')[:10]

    failure_rate = sum(
        1 for r in recent_runs
        if r.output_data.get('evaluation', {}).get('judgment') == 'incorrect'
    ) / max(len(recent_runs), 1)

    if failure_rate > 0.3:
        run.method.status = 'needs_revision'
        run.method.save()
```

## Design Constraints

1. **Not Turing-complete.** No loops, no recursion, no arbitrary code
   execution. Methods are evaluated, not executed as programs.

2. **Declarative where possible.** Conditions, rules, and scoring
   dimensions are data, not code. The evaluator interprets them.

3. **Deterministic.** Same input + same definition = same output.
   No randomness, no external API calls during evaluation.

4. **Auditable.** SHA hashes on inputs, outputs, and definitions
   allow exact reproduction and verification of any run.
