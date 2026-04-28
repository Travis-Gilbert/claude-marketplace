# PATTERNS-claim-pipeline.md

How to process text through the claim decomposition and NLI scoring pipeline: Text -> Claims -> NLI -> Edges.

## Build Sequence

### Step 1: Claim Decomposition

Two paths in claim_decomposition.py, selected by environment:

```python
# Rule-based (always available, production-safe)
def decompose_claims_rule_based(text: str, max_claims: int = 20) -> list[str]:
    # 1. Split into sentences (spaCy or regex)
    # 2. Filter for assertion markers (is, are, causes, argues...)
    # 3. Deduplicate by normalized text
    # 4. Cap at max_claims
    return claims

# LLM-based (requires ANTHROPIC_API_KEY + CLAIM_DECOMPOSITION_LLM=true)
def decompose_claims_llm(text: str, max_claims: int = 20) -> list[str]:
    # Prompt: "Extract atomic, falsifiable claims from this text"
    # Model: claude-haiku-4-5 (fast, cheap)
    # Parse JSON array from response
    return claims
```

The dispatcher selects based on config:
```python
def decompose_claims(text, max_claims=20):
    if LLM_DECOMPOSITION_ENABLED:
        claims = decompose_claims_llm(text, max_claims)
        if claims:
            return claims
    return decompose_claims_rule_based(text, max_claims)
```

### Step 2: Persist Claims

```python
from .models import Claim

for i, claim_text in enumerate(claims):
    Claim.objects.get_or_create(
        source_object=obj,
        text=claim_text,
        defaults={
            'claim_index': i,
            'claim_type': classify_claim_type(claim_text),
            'status': 'proposed',   # Not yet validated
            'polarity': 'positive',
        },
    )
```

Claim.status lifecycle: `proposed -> supported -> contested -> superseded -> archived`

### Step 3: Pairwise NLI Scoring

Compare claims from different Objects using CrossEncoder NLI:

```python
from apps.research.advanced_nlp import nli_score

def score_claim_pairs(claims_a: list[Claim], claims_b: list[Claim]):
    pairs = []
    for ca in claims_a:
        for cb in claims_b:
            scores = nli_score(ca.text, cb.text)
            # scores = {'entailment': 0.8, 'contradiction': 0.1, 'neutral': 0.1}
            if scores['entailment'] > 0.7:
                pairs.append(('supports', ca, cb, scores['entailment']))
            elif scores['contradiction'] > 0.6:
                pairs.append(('contradicts', ca, cb, scores['contradiction']))
    return pairs
```

### Step 4: Create Edges from NLI Results

```python
for relation, claim_a, claim_b, score in pairs:
    edge_type = 'supports' if relation == 'supports' else 'contradicts'
    Edge.objects.get_or_create(
        from_object=claim_a.source_object,
        to_object=claim_b.source_object,
        edge_type=edge_type,
        defaults={
            'reason': f'Claim "{claim_a.text[:60]}..." {relation} "{claim_b.text[:60]}..."',
            'strength': score,
            'is_auto': True,
            'engine': 'nli',
        },
    )
```

### Step 5: Tension Detection

When NLI finds contradiction, create a Tension record:

```python
if relation == 'contradicts' and score > 0.7:
    Tension.objects.get_or_create(
        claim_a=claim_a,
        claim_b=claim_b,
        defaults={
            'tension_type': 'claim_conflict',
            'status': 'open',
            'description': f'{claim_a.text} vs {claim_b.text}',
            'confidence': score,
        },
    )
```

### Step 6: Epistemic Status Lifecycle

Claims move through status transitions based on evidence:

```
proposed  -- NLI entailment from 2+ sources --> supported
proposed  -- NLI contradiction from 1+ source --> contested
supported -- new contradicting evidence --> contested
contested -- human review resolves --> supported or superseded
superseded -- newer claim replaces --> archived
```

Track transitions as Timeline Nodes for full provenance.

## Critical Constraints

- Rule-based decomposition must always be available (production-safe fallback)
- LLM decomposition requires explicit opt-in via environment variable
- Claims are deduplicated by normalized text within a source Object
- NLI scoring requires PyTorch (dev/local only, skipped on Railway)
- Every Tension must reference two specific Claims, not just Objects
- Claim status transitions must be recorded as Timeline events
- Max 20 claims per Object to bound NLI pairwise cost (O(n^2) across Objects)
- Edge.reason for NLI edges must quote the relevant claim text
