# Method DSL Design Specification

The Method DSL is a JSON-based language for encoding procedural knowledge extracted from source texts. It represents executable knowledge that can be evaluated, versioned, and traced back to its provenance.

## Design Principles

1. **Not Turing-complete.** Methods are sequential instruction sets with conditions, not general-purpose programs. No loops, recursion, or arbitrary computation. This keeps them auditable and human-reviewable.

2. **Human-readable.** Every element has a plain-text description. A researcher with no programming background should understand what a Method does by reading its JSON.

3. **Evaluable.** Methods with quantitative criteria can be checked programmatically via MethodRun. Qualitative criteria require human judgment.

4. **Versioned.** Each change creates a new version. Old versions are preserved for provenance.

5. **Provenance-linked.** Every Method traces back to its source Objects, extraction events, and review decisions.

## JSON Structure

```json
{
  "method": "Concrete Compressive Strength Test",
  "version": 3,
  "domain": "structural_engineering",
  "description": "Standard procedure for testing compressive strength of concrete cylinders per EN 12390-3.",

  "provenance": {
    "source_object_ids": [42, 78],
    "extraction_method": "llm",
    "compiled_sha": "a1b2c3d4e5f6",
    "reviewed_by": "researcher_jane",
    "reviewed_at": "2024-03-14T10:30:00Z"
  },

  "inputs": [
    {
      "name": "specimens",
      "type": "list[cylinder]",
      "description": "Concrete cylinder specimens from the batch",
      "constraints": { "min_count": 3 }
    },
    {
      "name": "curing_temperature",
      "type": "float",
      "unit": "celsius",
      "constraints": { "min": 21, "max": 25 }
    }
  ],

  "steps": [
    {
      "order": 1,
      "action": "prepare",
      "target": "specimens",
      "description": "Prepare cylindrical specimens (150mm x 300mm) from the batch.",
      "parameters": {
        "diameter_mm": 150,
        "height_mm": 300
      }
    },
    {
      "order": 2,
      "action": "cure",
      "target": "specimens",
      "description": "Cure specimens in a water bath at controlled temperature.",
      "parameters": {
        "duration_days": 28,
        "medium": "water_bath"
      }
    },
    {
      "order": 3,
      "action": "measure",
      "target": "specimen_diameter",
      "description": "Measure the diameter at three points along the height.",
      "parameters": {
        "measurement_points": 3
      },
      "output": "diameter_measurements"
    },
    {
      "order": 4,
      "action": "validate",
      "target": "diameter_measurements",
      "description": "Check diameter variation. Reject if any measurement varies by more than 2%.",
      "condition": "max_variation(diameter_measurements) > 0.02",
      "on_condition_true": "reject_specimen",
      "on_condition_false": "continue"
    },
    {
      "order": 5,
      "action": "apply_load",
      "target": "specimen",
      "description": "Apply compressive load at a controlled rate.",
      "parameters": {
        "load_rate_mpa_per_second": 0.25
      },
      "output": "max_load_at_failure"
    },
    {
      "order": 6,
      "action": "calculate",
      "target": "compressive_strength",
      "description": "Calculate compressive strength as load divided by cross-sectional area.",
      "formula": "max_load_at_failure / (pi * (diameter / 2)^2)",
      "output": "specimen_strength"
    },
    {
      "order": 7,
      "action": "aggregate",
      "target": "batch_strength",
      "description": "Report the average of all valid specimens as the batch strength.",
      "formula": "mean(specimen_strengths)",
      "output": "batch_compressive_strength"
    }
  ],

  "evaluation": [
    {
      "rule_id": "E001",
      "check": "batch_compressive_strength >= target_strength",
      "description": "Batch strength must meet or exceed the specified target.",
      "severity": "fail"
    },
    {
      "rule_id": "E002",
      "check": "count(valid_specimens) >= 3",
      "description": "At least 3 valid specimens required for a valid test.",
      "severity": "fail"
    },
    {
      "rule_id": "E003",
      "check": "coefficient_of_variation(specimen_strengths) < 0.15",
      "description": "Specimen strengths should not vary by more than 15%.",
      "severity": "warning"
    }
  ]
}
```

## Supported Operations

### Actions

Actions are verb phrases describing what the step does. The DSL defines a fixed set of action categories:

| Action | Description | Evaluable |
|--------|-------------|-----------|
| `prepare` | Set up materials, equipment, or conditions | No |
| `measure` | Take a measurement or observation | Yes (produces output) |
| `calculate` | Compute a value from inputs/previous outputs | Yes (has formula) |
| `validate` | Check a condition, branch on result | Yes (has condition) |
| `apply_load` | Apply a physical force or treatment | No |
| `cure` | Wait for a time-dependent process | No |
| `aggregate` | Combine multiple values into a summary | Yes (has formula) |
| `compare` | Compare two values or sets | Yes |
| `record` | Document an observation | No |
| `report` | Produce output for human consumption | No |

Custom actions are allowed but must include a plain-text description.

### Conditions

Conditions are simple boolean expressions that guard step execution:

```json
{
  "condition": "max_variation(diameter_measurements) > 0.02",
  "on_condition_true": "reject_specimen",
  "on_condition_false": "continue"
}
```

Condition outcomes are limited to:
- `"continue"` -- proceed to the next step
- `"skip_to:<order>"` -- jump to a specific step number
- `"reject_specimen"` -- mark the current specimen as invalid
- `"abort"` -- stop the Method execution with an error

No arbitrary branching. No loops. This preserves auditability.

### Formulas

Formulas express calculations using a restricted expression language:

**Allowed operators:** `+`, `-`, `*`, `/`, `^` (power)

**Allowed functions:** `mean()`, `sum()`, `count()`, `min()`, `max()`, `abs()`, `sqrt()`, `pi`, `coefficient_of_variation()`

**Not allowed:** Conditionals in formulas, function definitions, variable assignments, string operations.

```json
{
  "formula": "max_load_at_failure / (pi * (diameter / 2)^2)",
  "output": "compressive_strength"
}
```

### Parameters

Key-value pairs providing configuration for a step. Values can be numbers, strings, or simple lists. No nested objects.

```json
{
  "parameters": {
    "duration_days": 28,
    "medium": "water_bath",
    "measurement_points": 3
  }
}
```

## Compilation Rules

How source text is compiled into Method DSL:

### 1. Identify procedural content

Source text containing sequences of instructions, numbered steps, or normative statements (shall/must/should) is a compilation candidate.

### 2. Extract steps

Each instruction becomes a step with:
- `order`: sequential position
- `action`: the verb (mapped to the action vocabulary)
- `target`: the object of the action
- `description`: the original text (preserved for human review)
- `parameters`: any numeric or configuration values mentioned

### 3. Extract conditions

"If" and "when" clauses become step conditions. The condition text is preserved as-is; the expression parser normalizes it.

### 4. Extract formulas

Mathematical relationships in the text become formula expressions. Units are tracked in parameters.

### 5. Generate evaluation criteria

Normative statements with quantitative thresholds become evaluation criteria:
- "shall not exceed 12 mm" -> `check: "value <= 12"`, `unit: "mm"`
- "at least 3 specimens" -> `check: "count >= 3"`

### 6. Link provenance

The compiled Method records:
- Source Object IDs
- Extraction method (rule-based or LLM)
- Compilation timestamp
- SHA identity of the compiled output

## Versioning

Methods use integer versioning (v1, v2, v3...).

**When to create a new version:**
- Source text is updated and re-compiled
- A reviewer modifies the Method definition
- Evaluation criteria change
- New source Objects contribute additional steps

**Version chain:**
```
Method v1 (sha: aaa) -> v2 (sha: bbb) -> v3 (sha: ccc)
```

Each version is immutable once created. The `version` field is the only identifier that changes; the `sha` is recomputed from content.

**Active version:** The latest promoted version is the active one. Previous versions are retained for provenance but not used in new MethodRuns.

## Evaluation via MethodRun

A MethodRun records one execution of a Method:

```json
{
  "method_sha": "a1b2c3d4",
  "method_version": 3,
  "started_at": "2024-03-14T14:00:00Z",
  "completed_at": "2024-03-14T14:30:00Z",
  "inputs": { "specimens": [...], "curing_temperature": 23.0 },
  "step_results": [
    { "order": 1, "status": "completed", "output": null },
    { "order": 3, "status": "completed", "output": [150.2, 149.8, 150.1] },
    { "order": 4, "status": "passed", "condition_result": false },
    { "order": 6, "status": "completed", "output": 32.5 }
  ],
  "evaluation_results": [
    { "rule_id": "E001", "passed": true, "actual": 32.5, "threshold": 25.0 },
    { "rule_id": "E002", "passed": true, "actual": 3, "threshold": 3 },
    { "rule_id": "E003", "passed": true, "actual": 0.08, "threshold": 0.15 }
  ],
  "overall_status": "passed",
  "run_sha": "x9y8z7"
}
```

MethodRuns are immutable. They are epistemic primitives with their own SHA identity and provenance.

## Provenance Requirements

Every Method must record:

1. **Source Objects**: IDs of Objects from which the method was extracted
2. **Extraction method**: "rule" or "llm"
3. **Compilation chain**: SHA of the compiled output, linking to the source SHAs
4. **Review history**: Who reviewed, when, what they changed (via PromotionEvents)
5. **Version lineage**: Previous version SHA (if not v1)
6. **Domain pack**: Which domain pack's compilation rules were used

This chain is traversable: given any MethodRun, you can trace back through the Method version, to the compilation event, to the source Objects, to the original captured text.
