# program-synthesis

## Discipline Focus
Compile reviewed knowledge into executable methods with provenance.

## Core Concepts
- Use a narrow DSL (declarative where possible, non-Turing complete by default).
- Treat method versions as immutable snapshots linked to evidence.
- Capture execution runs as first-class records for learning.
- Keep compiler/runtime behavior inspectable and testable.

## research_api Touchpoints
- `apps/notebook/models.py` (`Method`, `MethodRun`)
- Promotion pipeline and method draft flow (planned)
- Domain-pack method catalogs (planned)

## Implementation Guidance
- Start with one narrow domain pack.
- Compile only reviewed inputs from promotion queue.
- Persist inputs, outputs, and provenance for each run.

## Guardrails
- Do not execute unreviewed extracted procedures as canon.
- Do not allow mutable method history.
- Do not produce runtime outputs without source traceability.
