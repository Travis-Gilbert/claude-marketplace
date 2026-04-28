# PATTERNS-network-effects.md

How the three-layer graph architecture enables seven network effects that
make the system more valuable as it grows.

## Problem

A single-user knowledge graph grows linearly with effort. Each Object
captured produces edges only to other Objects in the same graph. There
is no mechanism for knowledge to compound beyond one person's input.
The three-layer architecture introduces promotion, federation, and
network effects that make the system super-linear.

## When to Use

- Designing the promotion pipeline from private to shared graph
- Implementing federated graph queries
- Understanding why certain network effects require specific data flows
- Evaluating risks of shared graph pollution
- Planning the trust and reputation system

## The Pattern

### Layer 1: Private Graph (Personal Working Memory)

Everything the user captures. Raw notes, hunches, half-formed ideas,
private reflections. No quality filter. This is the user's epistemic
scratchpad.

Properties:
- Full read/write for the owning user
- No external visibility
- Engine processes Objects here (NER, edges, claims, tensions)
- Compound learning operates here (auto-capture, /learn)
- All seven engine passes run on this layer

### Layer 2: Shared Reviewed Graph (Promoted Evidence)

Knowledge that has passed through the promotion pipeline. Validated
claims, reviewed edges, preserved tensions with resolution notes.
This is the canonical knowledge base.

Promotion criteria:
1. **Review**: A human has examined the claim/edge and confirmed it
2. **Provenance**: Source is traceable (SHA-linked to an Object)
3. **Deduplication**: No semantic duplicate already exists in shared
4. **Conflict check**: Does not contradict existing shared claims without
   an explicit Tension record

```python
def promote_claim(claim, reviewer_id):
    # Check all criteria
    if not claim.reviewed_at:
        raise PromotionError("Claim must be reviewed before promotion")
    if not claim.provenance_sha:
        raise PromotionError("Claim must have provenance chain")

    # Deduplication: SBERT similarity > 0.95 = duplicate
    duplicates = find_semantic_duplicates(claim.text, threshold=0.95)
    if duplicates:
        raise PromotionError(f"Semantic duplicate: {duplicates[0].id}")

    # Conflict check
    contradictions = find_contradictions(claim)
    if contradictions:
        # Create Tension record, do not block promotion
        for contra in contradictions:
            Tension.objects.create(
                claim_a=claim, claim_b=contra,
                status='open',
                notes=f"Detected during promotion of {claim.id}"
            )

    claim.status = 'promoted'
    claim.promoted_at = now()
    claim.promoted_by = reviewer_id
    claim.save()
```

### Layer 3: Federated Graph (Cross-Instance)

Knowledge shared across instances via evidence packets. Not a shared
database; a protocol for structured knowledge exchange.

Evidence packets:
```json
{
    "packet_id": "sha256-of-contents",
    "source_instance": "instance-a",
    "claims": [
        {"text": "...", "confidence": 0.85, "provenance": "sha-chain"}
    ],
    "edges": [
        {"from": "claim-sha-1", "to": "claim-sha-2", "type": "supports", "reason": "..."}
    ],
    "tensions": [
        {"claim_a": "sha-1", "claim_b": "sha-2", "status": "open"}
    ]
}
```

Federated queries: an instance can query others for evidence relevant
to a Question. The receiving instance decides what to share based on
access control and trust level.

Trust negotiation: instances build trust through successful knowledge
exchanges. Trust starts at 0 and increases when shared knowledge proves
useful (consulted, accepted). Trust decays with rejected or contradicted
knowledge.

### The Seven Network Effects

**1. Evidence Effect**
More sources produce more edges. Each new Object captures evidence that
can connect to any existing Object. Growth is O(N^2) in potential
connections, though the engine prunes aggressively.

**2. Validation Effect**
More users reviewing claims produces higher-confidence knowledge. Each
review is a Bayesian update. The shared graph's average confidence
increases with reviewer count (assuming honest review).

**3. Contradiction Effect**
More diverse sources surface more Tensions. A single user's knowledge
tends toward internal consistency. Multiple users bring competing
frameworks that expose assumptions and blind spots.

**4. Abstraction Effect (EBL)**
Enough specific examples trigger explanation-based learning. When the
system sees the same pattern across 5+ specific Objects, it can abstract
a general rule (Method). More examples produce more robust abstractions.

**5. Analogy Effect**
Cross-domain structural rhymes. When a pattern in domain A (e.g.,
"feedback loops in control theory") has the same graph shape as a pattern
in domain B (e.g., "feedback loops in organizational design"), the system
can transfer insights. More domains produce more analogy candidates.

**6. Reviewer Trust Effect**
Reviewers who consistently promote high-quality claims earn higher trust
weights. Their future reviews carry more weight in confidence updates.
This creates a reputation gradient that improves review quality over time.

**7. Investigation Effect**
Open Questions attract evidence from multiple users. When one user asks
a Question, another user's captured Source may provide the answer. The
Question acts as a coordination mechanism that directs collective
attention.

### Risk Factors

**Shared graph pollution:** If promotion criteria are too loose, low-quality
claims enter the shared graph and degrade confidence for all users.
Prevention: strict promotion pipeline (review + provenance + dedup +
conflict check).

**Consensus collapse:** If the shared graph converges on a single viewpoint,
it loses the Contradiction Effect. Prevention: preserve Tensions in the
shared graph. Resolved tensions keep their history.

**Reputation ossification:** If trust weights only increase, early reviewers
dominate. Prevention: trust decays over time (similar to claim confidence
decay). Active reviewers maintain trust; inactive ones decay.

**Private/shared leakage:** Private hunches or incomplete thoughts must
never auto-promote. Prevention: promotion requires explicit human action
(architectural invariant #7).

**Generic crowd data:** If federated evidence is too general, it dilutes
domain-specific knowledge. Prevention: federated queries include domain
tags and the receiving instance filters by relevance.

## Key Decisions

1. Three layers (not two). The private layer must exist because raw
   capture quality varies wildly. Promoting everything would overwhelm
   the shared graph.
2. Tensions are preserved, not resolved-and-hidden. Open contradictions
   are a feature: they represent the actual state of knowledge, not a
   consensus illusion.
3. Federated queries, not shared databases. Each instance controls what
   it shares. There is no global knowledge base; there are negotiated
   exchanges.
4. Trust is earned and decays. No permanent trust grants. This prevents
   both early-mover advantage and compromised-reviewer persistence.

## Common Mistakes

- Auto-promoting high-confidence claims. Confidence measures model
  certainty, not human review quality. Promotion requires human action.
- Merging contradicting claims during deduplication. Contradictions are
  signal, not noise. Create a Tension, do not merge.
- Exposing private graph to federated queries. Only the shared reviewed
  graph participates in federation.
- Treating trust as binary (trusted / untrusted). Trust is a continuous
  score that weights review quality.

## Related Patterns

- PATTERNS-promotion.md (the promotion pipeline in detail)
- PATTERNS-self-org-loop.md (feedback loops that feed promotion candidates)
