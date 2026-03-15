# Domain Pack Architecture

Domain packs customize how research_api processes, compiles, and evaluates knowledge for specific fields. They are the mechanism for domain adaptation without modifying core infrastructure.

## What Is a Domain Pack?

A domain pack is a configuration bundle that teaches the epistemic engine how a specific domain organizes its knowledge. It contains:

1. **Type mappings**: How domain concepts map to research_api Object and Edge types
2. **Compilation rules**: How to extract and compile domain-specific Methods
3. **Evaluation criteria**: What counts as valid, complete, or correct in this domain
4. **Vocabulary**: Domain-specific terms for NER, BM25 boosting, and claim classification
5. **Promotion heuristics**: Domain-specific priority scoring for the review queue

## Domain Pack Structure

```
domain_packs/
  built_environment/
    pack.json           # pack metadata and configuration
    type_mappings.json   # Object/Edge type customization
    compilation.json     # rules for Method compilation
    evaluation.json      # domain-specific evaluation criteria
    vocabulary.txt       # terms for NER and search boosting
    examples/            # example Methods for this domain
  computer_science/
    pack.json
    type_mappings.json
    compilation.json
    evaluation.json
    vocabulary.txt
    examples/
```

## pack.json

```json
{
  "name": "built_environment",
  "version": "1.0.0",
  "display_name": "Built Environment",
  "description": "Architecture, structural engineering, construction, and urban planning.",
  "parent": null,
  "authors": ["research_api"],
  "object_types_extended": ["standard", "specification", "material", "detail"],
  "edge_types_extended": ["complies_with", "specifies", "supersedes"]
}
```

### Inheritance

Domain packs can inherit from a parent pack. The child pack overrides or extends the parent's configuration.

```json
{
  "name": "structural_engineering",
  "parent": "built_environment"
}
```

Resolution order: child -> parent -> defaults.

## Type Mappings

### Object Type Mappings

Domain packs can extend the base 10 Object types with domain-specific types:

```json
{
  "object_types": {
    "standard": {
      "base_type": "source",
      "description": "A normative document (EN, ISO, ASTM standard)",
      "icon": "scroll",
      "claim_extraction": "normative",
      "auto_tags": ["standard", "normative"]
    },
    "specification": {
      "base_type": "source",
      "description": "A project specification or requirement document",
      "claim_extraction": "normative",
      "auto_tags": ["specification"]
    },
    "material": {
      "base_type": "entity",
      "description": "A construction material with measurable properties",
      "properties": ["compressive_strength", "tensile_strength", "density", "cost"],
      "auto_tags": ["material"]
    },
    "detail": {
      "base_type": "note",
      "description": "A construction detail or assembly drawing",
      "claim_extraction": "descriptive",
      "auto_tags": ["detail", "drawing"]
    }
  }
}
```

Each domain type maps to a base research_api type. This means:
- The database schema doesn't change (it stores the base type)
- Domain types are metadata-level distinctions
- The UI can display domain-specific icons and fields
- Claim extraction adjusts its strategy based on the domain type

### Edge Type Mappings

```json
{
  "edge_types": {
    "complies_with": {
      "base_type": "support",
      "description": "Source A demonstrates compliance with standard B",
      "directional": true,
      "typical_strength": 0.9
    },
    "specifies": {
      "base_type": "support",
      "description": "Standard A specifies requirements for material/process B",
      "directional": true,
      "typical_strength": 0.95
    },
    "supersedes": {
      "base_type": "derived_from",
      "description": "Standard A replaces/supersedes standard B",
      "directional": true,
      "typical_strength": 1.0,
      "triggers_supersession": true
    }
  }
}
```

## Compilation Rules

How the domain pack customizes Method compilation:

```json
{
  "compilation": {
    "normative_modals": {
      "shall": { "type": "requirement", "severity": "mandatory" },
      "must": { "type": "requirement", "severity": "mandatory" },
      "should": { "type": "recommendation", "severity": "advisory" },
      "may": { "type": "permission", "severity": "optional" }
    },

    "step_vocabulary": {
      "prepare": ["cast", "pour", "mix", "fabricate", "assemble"],
      "measure": ["gauge", "survey", "inspect", "probe", "test"],
      "calculate": ["compute", "determine", "derive", "estimate"],
      "validate": ["verify", "check", "confirm", "certify"],
      "apply_load": ["load", "stress", "compress", "tension"]
    },

    "unit_conversions": {
      "MPa": { "to_si": 1e6, "base": "Pa" },
      "kN": { "to_si": 1e3, "base": "N" },
      "psi": { "to_si": 6894.76, "base": "Pa" }
    },

    "reference_patterns": [
      "EN \\d{3,5}(-\\d+)?",
      "ISO \\d{4,5}(-\\d+)?",
      "ASTM [A-Z]\\d{1,4}",
      "ACI \\d{3}(-\\d+)?",
      "BS \\d{4}(-\\d+)?"
    ]
  }
}
```

### How compilation rules are applied:

1. **Modal detection** uses `normative_modals` to classify extracted rules
2. **Action mapping** uses `step_vocabulary` to map domain verbs to DSL actions
3. **Unit handling** uses `unit_conversions` for formula normalization
4. **Reference detection** uses `reference_patterns` to identify cited standards

## Evaluation Criteria

Domain-specific rules for evaluating Methods and MethodRuns:

```json
{
  "evaluation": {
    "completeness_checks": [
      {
        "id": "COMP-001",
        "description": "Methods referencing standards must cite specific clause numbers",
        "check": "all_standard_references_have_clauses",
        "severity": "warning"
      },
      {
        "id": "COMP-002",
        "description": "Measurement steps must specify units and precision",
        "check": "measurement_steps_have_units",
        "severity": "fail"
      }
    ],

    "validity_checks": [
      {
        "id": "VALID-001",
        "description": "Compressive strength values must be positive and < 200 MPa",
        "check": "compressive_strength_in_range",
        "range": { "min": 0, "max": 200 },
        "unit": "MPa"
      }
    ],

    "consistency_checks": [
      {
        "id": "CONS-001",
        "description": "Steps referencing outputs from previous steps must reference valid step numbers",
        "check": "step_output_references_valid"
      }
    ]
  }
}
```

## Example Packs

### built_environment

Covers architecture, structural engineering, construction, materials science, and urban planning.

**Custom Object types:** standard, specification, material, detail, assembly
**Custom Edge types:** complies_with, specifies, supersedes, loads, supports_structurally
**Compilation focus:** Normative documents (EN, ISO, ASTM), procedural standards, material specifications
**Evaluation focus:** Unit consistency, standard reference validity, measurement completeness

### computer_science

Covers algorithms, data structures, software architecture, and programming languages.

**Custom Object types:** algorithm, data_structure, api, library, pattern
**Custom Edge types:** implements, extends, depends_on, benchmarks, deprecates
**Compilation focus:** Algorithm descriptions, API contracts, design patterns
**Evaluation focus:** Complexity bounds, correctness proofs, test coverage

## Integration with the Promotion Pipeline

Domain packs integrate at three points:

### 1. Extraction (parsed -> extracted)

The domain pack's vocabulary and type mappings guide claim extraction:
- `claim_extraction: "normative"` uses modal detection for standards
- `claim_extraction: "descriptive"` uses general claim decomposition
- Domain vocabulary boosts NER for domain-specific entities

### 2. Compilation (promoted -> compiled)

The domain pack's compilation rules transform promoted claims into Methods:
- Modal classification follows `normative_modals`
- Verb mapping follows `step_vocabulary`
- Units are normalized via `unit_conversions`
- Standard references are detected via `reference_patterns`

### 3. Evaluation (MethodRun assessment)

The domain pack's evaluation criteria validate MethodRun outputs:
- Completeness checks ensure Methods have required elements
- Validity checks ensure values are within domain-reasonable ranges
- Consistency checks ensure internal coherence

## Creating a New Domain Pack

1. Copy `domain_packs/_template/` as a starting point
2. Define type mappings for the domain's key concepts
3. Add compilation rules (modals, vocabulary, units, reference patterns)
4. Define evaluation criteria
5. Add vocabulary terms for NER boosting
6. Include 2-3 example Methods showing expected compilation output
7. Register the pack in `domain_packs/registry.json`
8. Test by compiling a known source document and reviewing the output
