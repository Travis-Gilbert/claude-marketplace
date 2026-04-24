# Pattern: Contract-First Design

See: `lib/contract-first-design/SKILL.md` and `references/methodologies/mycelium-contracts.md`.

## Concrete example (Python / Pydantic)

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

# stages/classify.py
from pydantic import BaseModel, HttpUrl, Field
from .scrape import RawDocument

class Claim(BaseModel):
    text: str
    source_url: HttpUrl
    confidence: float = Field(ge=0.0, le=1.0)

def classify(doc: RawDocument) -> list[Claim]:
    ...
```

Stage 2 input type = Stage 1 output type. Type checker enforces the contract.

## Concrete example (TypeScript / Zod)

```typescript
// stages/scrape.ts
import { z } from "zod"

export const ScrapeRequest = z.object({
  url: z.string().url(),
  depth: z.number().int().min(0).max(5).default(1),
  renderJs: z.boolean().default(false),
})

export const RawDocument = z.object({
  url: z.string().url(),
  html: z.string(),
  fetchedAt: z.date(),
  statusCode: z.number().int(),
})

export type ScrapeRequest = z.infer<typeof ScrapeRequest>
export type RawDocument = z.infer<typeof RawDocument>

export async function scrape(req: ScrapeRequest): Promise<RawDocument> {
  // parse with ScrapeRequest.parse(req) at the boundary
  // implementation
}
```

## Rules

- Schema lives with the stage, not in a shared file.
- Every public function across a module boundary has typed input and typed output.
- Validation happens at the boundary (parse with the schema on untrusted input).
- Invariants that can't be encoded in types → `@validator` / refinement / assertion.

## Where in the plan

In `design-doc.md` under `## Contracts`:

```markdown
## Contracts

### Stage 1: scrape
Input:  ScrapeRequest  (see stages/scrape.py)
Output: RawDocument    (see stages/scrape.py)
Failure: HTTP errors retry 3x, then emit FetchFailed event.

### Stage 2: classify
Input:  RawDocument    (from Stage 1)
Output: list[Claim]    (see stages/classify.py)
Failure: parse errors skipped with warning log.
```

Then each stage gets its own task in `implementation-plan.md`:

```markdown
### Task 3: Implement scrape contract
Files: stages/scrape.py
Tests: tests/stages/test_scrape.py — property test ScrapeRequest validation.
Delegate to: django-engine-pro
```

## Anti-pattern

- "We'll figure out the shape as we go." That's how half-types propagate and every change becomes brittle.
- Shared `schemas.py` at the top of the repo that all stages import from. Drift is inevitable. Co-locate instead.
- Optional fields with no reason. Every optional is a case the reader has to think about. Make fields required unless there's a real reason.
