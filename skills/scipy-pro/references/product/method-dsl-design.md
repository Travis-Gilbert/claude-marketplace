# Method DSL Design

## Objective
Encode reviewed procedures as executable, versioned methods.

## Scope
- Start with one domain pack (`computer_science` or `built_environment`).
- Support deterministic evaluation steps before complex orchestration.
- Keep method execution bounded and auditable.

## Suggested DSL Shape
```json
{
  "id": "method_slug",
  "version": "1.0.0",
  "inputs": {"type": "object"},
  "steps": [
    {"op": "extract_claims", "args": {"max_claims": 20}},
    {"op": "score_nli", "args": {"threshold": 0.75}},
    {"op": "emit_report", "args": {"format": "json"}}
  ],
  "checks": [{"op": "min_evidence", "args": {"count": 2}}],
  "outputs": {"type": "object"},
  "provenance_refs": ["claim:123", "object:456"]
}
```

## Runtime Requirements
- Validate schema + version before run.
- Persist `MethodRun` input/output/status/duration.
- Link run artifacts to provenance graph.
