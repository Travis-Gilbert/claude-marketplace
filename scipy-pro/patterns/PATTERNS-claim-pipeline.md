# Pattern: Claim Pipeline (Text -> Claims -> NLI -> Edges)

The claim pipeline decomposes text into atomic propositions, scores them
pairwise for entailment and contradiction, and creates tension edges
where specific claims conflict.

## Pipeline Stages

```
Text Input -> Sentence Split -> Assertion Filter -> Claim Dedup
  -> Cap (20) -> Pairwise NLI -> Tension Detection -> Edge Creation
```

### Stage 1: Text Input

Input is an Object's body text. The pipeline is triggered post-capture
when an Object is created or updated.

```python
def decompose_claims(obj):
    """Extract claims from an Object's body text."""
    text = obj.body
    if not text or len(text.strip()) < 50:
        return []
```

### Stage 2: Sentence Splitting (spaCy)

Use spaCy's sentence boundary detection. This works in both production
and dev modes (spaCy is always available).

```python
import spacy

nlp = spacy.load('en_core_web_sm')

def _split_sentences(text):
    doc = nlp(text)
    return [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 10]
```

### Stage 3: Assertion Filtering

Not every sentence is a claim. Filter for assertive statements using
regex hints and structural cues.

```python
# Sentences that are likely claims (assertive)
ASSERTION_HINTS = [
    r'\bis\b', r'\bare\b', r'\bwas\b', r'\bwere\b',
    r'\bcauses?\b', r'\bleads?\s+to\b', r'\bresults?\s+in\b',
    r'\bshows?\b', r'\bdemonstrates?\b', r'\bindicates?\b',
    r'\bsuggests?\b', r'\bfinds?\b', r'\bfound\b',
    r'\bincreases?\b', r'\bdecreases?\b', r'\baffects?\b',
]

# Sentences that are NOT claims
NON_ASSERTION_PATTERNS = [
    r'^(who|what|where|when|why|how)\b',   # Questions
    r'^(note|see|cf\.?|e\.g\.?)\b',         # References
    r'^\d+\.\s',                            # List numbering only
    r'^(figure|table|appendix)\s',          # Captions
]

def _is_assertion(sentence):
    s = sentence.lower()
    if any(re.match(p, s) for p in NON_ASSERTION_PATTERNS):
        return False
    return any(re.search(p, s) for p in ASSERTION_HINTS)
```

### Stage 4: Claim Deduplication

Remove near-duplicate claims using simple text similarity. This runs
before NLI (which is expensive) to reduce the candidate set.

```python
def _deduplicate_claims(claims, threshold=0.85):
    """Remove near-duplicate claims using token overlap."""
    unique = []
    for claim in claims:
        tokens_a = set(claim.lower().split())
        is_dup = False
        for existing in unique:
            tokens_b = set(existing.lower().split())
            overlap = len(tokens_a & tokens_b) / max(len(tokens_a | tokens_b), 1)
            if overlap >= threshold:
                is_dup = True
                break
        if not is_dup:
            unique.append(claim)
    return unique
```

### Stage 5: Max Claim Cap

Cap at 20 claims per Object. NLI is O(n^2) on claim pairs, so 20 claims
= 190 pairs, which is tractable. 50 claims = 1225 pairs, which is not.

```python
MAX_CLAIMS_PER_OBJECT = 20

claims = claims[:MAX_CLAIMS_PER_OBJECT]
```

Prioritize claims by information density (longer, more specific claims
first) rather than document order if truncating.

### Stage 6: Claim-Pair NLI Scoring

Use CrossEncoder for pairwise NLI. This is a dev-mode-only feature
(CrossEncoder requires PyTorch).

```python
try:
    from apps.research.advanced_nlp import nli_score
    _NLI_AVAILABLE = True
except ImportError:
    _NLI_AVAILABLE = False

def _score_claim_pairs(claims_a, claims_b):
    """
    Score all pairs between two claim sets.

    Returns:
        list[dict]: Each with 'claim_a', 'claim_b', 'label', 'scores'
        Labels: 'entailment', 'neutral', 'contradiction'
    """
    if not _NLI_AVAILABLE:
        return []

    pairs = []
    for ca in claims_a:
        for cb in claims_b:
            scores = nli_score(ca, cb)  # Returns {entailment, neutral, contradiction}
            label = max(scores, key=scores.get)
            pairs.append({
                'claim_a': ca,
                'claim_b': cb,
                'label': label,
                'scores': scores,
            })
    return pairs
```

### Stage 7: Tension Signal Detection

The key insight: **claim-level NLI catches contradictions between specific
statements even when overall texts are on different topics.**

Two Objects about "nutrition" and "exercise" may seem unrelated at the
document level. But Claim A ("carb restriction improves endurance") and
Claim B ("carbohydrate loading is essential for endurance performance")
directly contradict each other.

Tension = high semantic similarity AND contradiction label.

```python
def _detect_tensions(scored_pairs, config):
    """
    Find claim pairs that indicate genuine intellectual tension.

    A tension is: semantically related (similarity > 0.5) AND
    NLI contradiction score > threshold (default 0.6).
    """
    tension_threshold = config.get('tension_threshold', 0.6)
    tensions = []

    for pair in scored_pairs:
        contradiction = pair['scores'].get('contradiction', 0)
        entailment = pair['scores'].get('entailment', 0)

        # High contradiction AND not just noise
        if contradiction >= tension_threshold and entailment < 0.3:
            tensions.append({
                'claim_a': pair['claim_a'],
                'claim_b': pair['claim_b'],
                'contradiction_score': contradiction,
                'type': 'contradicts',
            })

        # Strong support
        if entailment >= 0.8:
            tensions.append({
                'claim_a': pair['claim_a'],
                'claim_b': pair['claim_b'],
                'entailment_score': entailment,
                'type': 'supports',
            })

    return tensions
```

### Stage 8: Edge Creation

Create edges with claim-pair quotes in the reason field. This gives
humans the specific evidence for the connection.

```python
def _create_claim_edges(obj_a, obj_b, tensions):
    """Create edges from detected claim tensions."""
    new_edges = []
    for tension in tensions:
        edge_type = tension['type']  # 'supports' or 'contradicts'
        score_key = 'contradiction_score' if edge_type == 'contradicts' else 'entailment_score'
        score = tension[score_key]

        reason = (
            f"Claim from '{obj_a.title}': \"{tension['claim_a']}\" "
            f"{edge_type} claim from '{obj_b.title}': \"{tension['claim_b']}\""
        )

        edge, created = Edge.objects.get_or_create(
            from_object=obj_a,
            to_object=obj_b,
            edge_type=edge_type,
            defaults={
                'reason': reason,
                'strength': round(score, 4),
                'is_auto': True,
                'engine': 'claim_nli',
            },
        )
        if created:
            new_edges.append(edge)

    return new_edges
```

## Storing Claims

Claims are stored as their own model for reuse across pipelines:

```python
Claim.objects.create(
    source_object=obj,
    text=claim_text,
    start_char=start,
    end_char=end,
    confidence=assertion_confidence,
    provenance='claim_decomposition',
)
```

## Production vs Dev Behavior

| Stage | Production | Dev |
|-------|-----------|-----|
| Sentence splitting | spaCy (works) | spaCy (works) |
| Assertion filtering | regex (works) | regex (works) |
| Deduplication | token overlap (works) | token overlap (works) |
| NLI scoring | Skipped (_NLI_AVAILABLE=False) | CrossEncoder (works) |
| Tension detection | Skipped (no NLI scores) | Full pipeline |
| Edge creation | Only non-NLI edges | Full tension edges |

In production, the pipeline still extracts and stores claims. NLI scoring
is deferred to Modal batch jobs or skipped entirely.
