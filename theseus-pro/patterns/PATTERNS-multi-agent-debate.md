# PATTERNS-multi-agent-debate.md

How to implement the Advocate/Critic/Judge epistemic debate system.

## Architecture

Three LM instances with different system prompts, all grounded
in the same knowledge graph. Each role has access to graph
traversal tools but different instructions about what to find.

### Role Prompts

**Advocate:**
```
You are evaluating Claim: "{claim_text}"
Your role is to find the STRONGEST POSSIBLE CASE for this claim.
You may only cite evidence that exists in the knowledge graph.
For each piece of supporting evidence, provide:
- The Source title and Object ID
- The specific text that supports the claim
- The Edge type and strength connecting them
- How directly this evidence supports the claim (direct/indirect/contextual)
Do not speculate. Do not reference information outside the graph.
```

**Critic:**
```
You are evaluating Claim: "{claim_text}"
Your role is to find EVERY WEAKNESS in this claim.
You may only cite evidence that exists in the knowledge graph.
Look for:
- Direct contradictions (Sources that state the opposite)
- Missing evidence (what SHOULD support this but doesn't?)
- Assumption gaps (what does this claim assume that isn't proven?)
- Alternative explanations (do the supporting Sources also support a different conclusion?)
Do not speculate. Do not reference information outside the graph.
```

**Judge:**
```
The Advocate argues: {advocate_output}
The Critic argues: {critic_output}

Evaluate both cases. For each point:
- Is the cited evidence real and correctly characterized?
- Does the evidence actually support/weaken the claim as described?
- How strong is each piece of evidence?

Produce a verdict:
- Confidence: 0.0 to 1.0
- Key supporting evidence (top 3)
- Key weaknesses (top 3)
- Unresolved questions (what would settle this?)
- Recommendation: accept / contest / investigate / insufficient_evidence
```

## Implementation

### Step 1: Graph Evidence Retrieval

Before debate, prepare the evidence base:
```python
def prepare_evidence_base(claim):
    """Gather all graph evidence relevant to a Claim."""
    # Direct connections
    direct_edges = Edge.objects.filter(
        Q(from_object=claim.object) | Q(to_object=claim.object)
    ).select_related('from_object', 'to_object')

    # NLI-scored pairs
    supporting = Edge.objects.filter(
        to_object=claim.object, edge_type='supports'
    )
    contradicting = Edge.objects.filter(
        to_object=claim.object, edge_type='contradicts'
    )

    # Community context
    community = claim.object.community_label
    community_objects = Object.objects.filter(
        community_label=community, is_deleted=False
    ).exclude(id=claim.object_id)[:20]

    return {
        'direct_edges': direct_edges,
        'supporting': supporting,
        'contradicting': contradicting,
        'community_context': community_objects,
        'claim_text': claim.text,
        'claim_source': claim.object.title,
    }
```

### Step 2: Run Debate (Background Job)

```python
@rq_task('reasoning')
def run_debate(claim_id):
    claim = Claim.objects.get(id=claim_id)
    evidence = prepare_evidence_base(claim)

    # Format evidence for LM context
    context = format_evidence_for_prompt(evidence)

    # Run Advocate
    advocate_result = call_lm(
        role='advocate',
        claim=claim.text,
        evidence=context,
    )

    # Run Critic
    critic_result = call_lm(
        role='critic',
        claim=claim.text,
        evidence=context,
    )

    # Run Judge
    verdict = call_lm(
        role='judge',
        advocate=advocate_result,
        critic=critic_result,
    )

    # Store result
    DebateResult.objects.create(
        claim=claim,
        advocate_output=advocate_result,
        critic_output=critic_result,
        verdict=verdict,
        confidence=parse_confidence(verdict),
        recommendation=parse_recommendation(verdict),
    )

    # Surface disagreements in Resurface
    if parse_confidence(verdict) < 0.5:
        flag_as_epistemically_interesting(claim)
```

### Step 3: Human Review Loop

Debate results are surfaced in the UI for human review:
- Human agrees with verdict: positive training signal for Judge
- Human disagrees: correction becomes ground truth
- Over time, all three roles improve

```python
@api_view(['POST'])
def review_debate(request, debate_id):
    debate = DebateResult.objects.get(id=debate_id)
    human_agrees = request.data.get('agrees', None)
    human_notes = request.data.get('notes', '')

    debate.human_reviewed = True
    debate.human_agrees = human_agrees
    debate.human_notes = human_notes
    debate.save()

    # Create training signal
    if human_agrees is not None:
        ConnectionFeedback.objects.create(
            from_object=debate.claim.object,
            to_object=debate.claim.object,  # self-reference for debate feedback
            label='engaged' if human_agrees else 'dismissed',
            feature_vector={'debate_confidence': debate.confidence},
        )
```

## Trigger Conditions

Run debate automatically when:
- A new Object enters with >5 connections (high-connectivity threshold)
- A Tension is detected with NLI confidence >0.7
- A Claim's epistemic status changes to 'contested'
- User requests debate on demand

## Key Constraints

- All three roles run as background RQ jobs (never synchronous)
- Every argument must cite specific Object IDs and Edge IDs
- The Judge's verdict is a PROPOSAL, not a final determination (Invariant #7)
- Debate results expire after 30 days if the graph has changed significantly
