---
name: contract-first-design
description: "Mycelium-inspired design. For pipelines, workflows, agent chains, and API boundaries: define input/output schemas at every stage before writing code. The plan's tasks mirror the contracts."
---

# Contract-First Design

Contracts at every boundary. If data crosses a module, a process, or an author, its shape is explicit.

## When to use this skill

- Multi-stage pipelines (extract → transform → classify → store)
- Agent chains (one agent's output is another's input)
- External API integration with non-trivial payloads
- Module boundaries with different owners
- Anywhere stage N's output is stage N+1's input

## When NOT to use

- Single-module refactors
- UI-only changes
- Internal function calls that never cross a process / network / author boundary (but consider anyway if the function is the contract for future callers)

## The contract

For each stage, define:

1. **Input schema**: named type, fields, field types, required/optional, validation rules
2. **Output schema**: same shape
3. **Failure mode**: what happens on malformed input, partial failure, retry, dead-letter?
4. **Invariants**: what must always be true of a valid output (e.g., "sum of allocations equals 1.0")

## Schema tool by stack

Use the project's native schema tool:

| Stack | Tool |
|---|---|
| Python | Pydantic v2 |
| TypeScript | Zod |
| Go | structs with `json:"..."` + validate tags |
| Rust | serde + typed structs |
| Swift | Codable + typed structs |

If the project has no schema convention yet, pick the standard for the language. Record the choice as an ADR.

## Format in design-doc.md

```markdown
## Contracts

### Stage 1: <name>
Input:
```python
class ScrapeRequest(BaseModel):
    url: HttpUrl
    depth: int = Field(default=1, ge=0, le=5)
    render_js: bool = False
```
Output:
```python
class RawDocument(BaseModel):
    url: HttpUrl
    html: str
    fetched_at: datetime
    status_code: int
```
Failure: HTTP errors → retry 3x with backoff, then emit `FetchFailed` event.

### Stage 2: <name>
Input: RawDocument  (output of Stage 1)
Output:
```python
class Claim(BaseModel):
    text: str
    source_url: HttpUrl
    confidence: float = Field(ge=0.0, le=1.0)
```
Failure: parse errors → skipped with warning log.

### Invariants
- Every Claim.source_url must match a RawDocument.url in the batch.
- Claim.confidence >= 0.5 required for downstream use (filter in Stage 3).
```

## Plan integration

Each stage becomes a task (or a small cluster of tasks) in `implementation-plan.md`:

- Task N: Implement Stage 1 contract + function
- Task N+1: Test Stage 1 against schema (property-based tests preferred)
- Task N+2: Implement Stage 2 contract + function
- Task N+3: Integration test: Stage 1 output passes Stage 2 input validation

The schema definition is the first artifact of each stage, not an afterthought.

## Why this matters

- Refactoring is cheap when contracts are explicit and stable
- Bugs surface at boundaries, not buried in logic
- New stages can be added or swapped without touching neighbors
- Tests write themselves when schemas are typed

## Anti-pattern

Do not write "we'll figure out the data shape as we go". That's how half-types spread through a codebase and make everything hard to change.
