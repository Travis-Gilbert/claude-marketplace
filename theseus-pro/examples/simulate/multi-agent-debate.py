"""
Multi-Agent Epistemic Debate

Demonstrates Level 6 adversarial reasoning: three LM instances
(Advocate, Critic, Judge) evaluate a claim using only evidence from
the knowledge graph. The Advocate builds the strongest case for the
claim, the Critic finds every weakness, and the Judge produces a
confidence score and recommendation.

Every argument must cite specific Object IDs and Edge IDs from the
graph. The agents cannot speculate beyond what the graph contains.
This is grounded reasoning, not open-ended chat.

Two-mode note: LLM calls use the configured API (OpenAI-compatible).
The graph traversal and evidence preparation work in both production
and local environments.
"""

import json
import logging
import os
import sys

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "research_api.settings")
django.setup()

from django.db.models import Q

from apps.notebook.models import Claim, Edge, Object

logger = logging.getLogger("theseus.simulate.debate")


# -- Role system prompts --

ADVOCATE_PROMPT = """You are evaluating Claim: "{claim_text}"
Your role is to find the STRONGEST POSSIBLE CASE for this claim.
You may only cite evidence that exists in the knowledge graph below.
For each piece of supporting evidence, provide:
- The Source title and Object ID
- The specific text that supports the claim
- The Edge type and strength connecting them
- How directly this evidence supports the claim (direct/indirect/contextual)
Do not speculate. Do not reference information outside the graph.

EVIDENCE:
{evidence}"""

CRITIC_PROMPT = """You are evaluating Claim: "{claim_text}"
Your role is to find EVERY WEAKNESS in this claim.
You may only cite evidence that exists in the knowledge graph below.
Look for:
- Direct contradictions (sources that state the opposite)
- Missing evidence (what SHOULD support this but doesn't?)
- Assumption gaps (what does this claim assume that isn't proven?)
- Alternative explanations (do supporting sources also support different conclusions?)
Do not speculate. Do not reference information outside the graph.

EVIDENCE:
{evidence}"""

JUDGE_PROMPT = """The Advocate argues:
{advocate_output}

The Critic argues:
{critic_output}

Evaluate both cases. For each point:
- Is the cited evidence real and correctly characterized?
- Does the evidence actually support/weaken the claim as described?
- How strong is each piece of evidence?

Produce a verdict as JSON:
{{
  "confidence": 0.0-1.0,
  "supporting_evidence": ["top 3 pieces"],
  "key_weaknesses": ["top 3 weaknesses"],
  "unresolved_questions": ["what would settle this?"],
  "recommendation": "accept|contest|investigate|insufficient_evidence"
}}"""


def prepare_evidence_base(claim_object):
    """Gather all graph evidence relevant to a claim's Object.

    Returns a formatted string of evidence that can be injected
    into the role prompts. Each piece of evidence includes its
    Object ID and Edge metadata for citation.
    """
    # Direct connections to this object.
    edges = Edge.objects.filter(
        Q(from_object=claim_object) | Q(to_object=claim_object)
    ).select_related("from_object", "to_object")[:30]

    evidence_lines = []
    for edge in edges:
        other = edge.to_object if edge.from_object_id == claim_object.id else edge.from_object
        direction = "supports" if edge.from_object_id != claim_object.id else "supported_by"
        text_preview = (other.text or other.title or "")[:300]

        evidence_lines.append(
            f"[Object {other.id}] ({other.object_type}) {other.title}\n"
            f"  Edge {edge.id}: {edge.edge_type} (strength={edge.strength or 'N/A'}, "
            f"direction={direction})\n"
            f"  Reason: {edge.reason or 'N/A'}\n"
            f"  Text: {text_preview}"
        )

    # Community context -- related objects in the same cluster.
    community = getattr(claim_object, "community_label", None)
    if community is not None:
        community_objects = Object.objects.filter(
            community_label=community, is_deleted=False
        ).exclude(id=claim_object.id)[:10]

        for obj in community_objects:
            evidence_lines.append(
                f"[Object {obj.id}] ({obj.object_type}) {obj.title}\n"
                f"  Community context (same cluster {community})\n"
                f"  Text: {(obj.text or '')[:200]}"
            )

    return "\n\n".join(evidence_lines)


def call_lm(system_prompt, max_tokens=800):
    """Call the configured LLM API. Falls back to a stub for demonstration."""
    try:
        import openai

        client = openai.OpenAI(
            api_key=os.environ.get("OPENAI_API_KEY", ""),
            base_url=os.environ.get("LLM_BASE_URL"),
        )
        response = client.chat.completions.create(
            model=os.environ.get("LLM_MODEL", "gpt-4o-mini"),
            messages=[{"role": "user", "content": system_prompt}],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        return response.choices[0].message.content

    except Exception as e:
        logger.warning("LLM call failed (%s) -- returning stub response", e)
        return f"[Stub response for demonstration]\n{system_prompt[:200]}..."


def run_debate(claim_id):
    """Execute the full Advocate/Critic/Judge debate for a claim."""
    # Load the claim and its object.
    claim = Claim.objects.select_related("object").get(id=claim_id)
    evidence = prepare_evidence_base(claim.object)

    logger.info("Debating claim %d: '%s'", claim_id, claim.text[:80])
    logger.info("Evidence base: %d characters from graph", len(evidence))

    # -- Run Advocate --
    advocate_prompt = ADVOCATE_PROMPT.format(
        claim_text=claim.text, evidence=evidence
    )
    advocate_output = call_lm(advocate_prompt)
    logger.info("Advocate complete (%d chars)", len(advocate_output))

    # -- Run Critic --
    critic_prompt = CRITIC_PROMPT.format(
        claim_text=claim.text, evidence=evidence
    )
    critic_output = call_lm(critic_prompt)
    logger.info("Critic complete (%d chars)", len(critic_output))

    # -- Run Judge --
    judge_prompt = JUDGE_PROMPT.format(
        advocate_output=advocate_output,
        critic_output=critic_output,
    )
    judge_output = call_lm(judge_prompt, max_tokens=1200)
    logger.info("Judge complete (%d chars)", len(judge_output))

    # Parse the judge's verdict.
    verdict = parse_verdict(judge_output)

    result = {
        "claim_id": claim_id,
        "claim_text": claim.text,
        "advocate": advocate_output,
        "critic": critic_output,
        "judge": judge_output,
        "confidence": verdict.get("confidence", 0.5),
        "recommendation": verdict.get("recommendation", "investigate"),
    }

    # Flag low-confidence claims for human review (Invariant #7).
    if result["confidence"] < 0.5:
        logger.info(
            "Low confidence (%.2f) -- flagging for human review",
            result["confidence"],
        )

    return result


def parse_verdict(judge_output):
    """Extract structured verdict from judge's response."""
    try:
        # Try to find JSON in the output.
        start = judge_output.index("{")
        end = judge_output.rindex("}") + 1
        return json.loads(judge_output[start:end])
    except (ValueError, json.JSONDecodeError):
        return {"confidence": 0.5, "recommendation": "investigate"}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    if len(sys.argv) < 2:
        # Default: debate the first claim in the database.
        claim = Claim.objects.first()
        if not claim:
            print("No claims in database. Ingest some sources first.")
            sys.exit(1)
        claim_id = claim.id
    else:
        claim_id = int(sys.argv[1])

    result = run_debate(claim_id)
    print(f"\nVerdict for claim {result['claim_id']}:")
    print(f"  Confidence: {result['confidence']:.2f}")
    print(f"  Recommendation: {result['recommendation']}")
