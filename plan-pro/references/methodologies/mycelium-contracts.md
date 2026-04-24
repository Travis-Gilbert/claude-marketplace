# Mycelium Contracts

Source: [mycelium-clj/mycelium](https://github.com/mycelium-clj/mycelium), cloned into `refs/mycelium/`.

Mycelium is a Clojure framework built around schema-annotated contracts at every module boundary. plan-pro borrows the principle, not the language.

## The principle

Data that crosses a boundary carries its shape with it. Every stage defines:

- Input schema (what it accepts)
- Output schema (what it emits)
- Invariants (what must be true of a valid output)
- Failure mode (what happens on bad input, partial failure, retry)

## Why schemas at every boundary

- Refactors are cheap when contracts are stable
- Bugs surface at boundaries, not buried in logic
- New stages can swap in without touching neighbors
- Tests write themselves when schemas are typed
- Type mismatches are caught at the boundary, not 3 modules deep

## Adaptation for other stacks

Use the native schema tool:

| Stack | Tool | Library |
|---|---|---|
| Python | Pydantic v2 | `pip install pydantic` |
| TypeScript | Zod | `npm install zod` |
| Go | struct tags + validation | `github.com/go-playground/validator` |
| Rust | serde | `serde`, `serde_derive` |
| Swift | Codable | stdlib |

## Contract definition pattern

Each stage's contract lives with the stage code, not in a shared schema file:

```python
# stages/scrape.py

from pydantic import BaseModel, HttpUrl, Field
from datetime import datetime

class ScrapeRequest(BaseModel):
    url: HttpUrl
    depth: int = Field(default=1, ge=0, le=5)
    render_js: bool = False

class RawDocument(BaseModel):
    url: HttpUrl
    html: str
    fetched_at: datetime
    status_code: int

def scrape(request: ScrapeRequest) -> RawDocument:
    ...
```

The types are the documentation. No separate `docs/schemas.md` that drifts out of sync.

## Between stages

Stage N+1's input equals Stage N's output. Enforce by type:

```python
# stages/classify.py
from .scrape import RawDocument

def classify(doc: RawDocument) -> list[Claim]:
    ...
```

If the type system can't enforce this (Python without strict typing, untyped JS), use runtime validation at the boundary: parse the output through the next stage's schema.

## Invariants

Some properties can't be captured by types alone. Record them as assertions:

```python
class PredictionBatch(BaseModel):
    predictions: list[float]
    weights: list[float]

    @validator("weights")
    def weights_sum_to_one(cls, v):
        assert abs(sum(v) - 1.0) < 1e-6, "weights must sum to 1.0"
        return v
```

## When to use

- Pipelines (extract → transform → classify → store)
- Agent chains
- Module boundaries with different owners
- API boundaries with non-trivial payloads

## When NOT to use

- Single-module refactors
- UI-only changes (use TypeScript / PropTypes for UI contracts)
- Internal function calls that never cross a meaningful boundary

## Contract-first vs. code-first

Contract-first means: write the schema **before** the function body. The schema is the spec. The function body implements the spec.

Code-first often means: write the function, discover the shape, retroactively add types. That works for small functions but breaks down at boundaries.

For module boundaries, pipeline stages, and agent chains: contract-first. Always.
