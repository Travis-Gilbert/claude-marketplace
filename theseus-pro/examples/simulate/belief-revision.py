"""
AGM Belief Revision Simulation

Demonstrates principled belief revision when new evidence contradicts
existing claims. Following the AGM framework (Alchourron, Gardenfors,
Makinson), the system identifies the contradiction, computes the
minimal set of claims that must be revised to restore consistency,
and simulates each revision option so a human can choose.

Key AGM principles:
- Consistency: the revised belief set must not contain contradictions
- Minimal change: revise as little as possible
- Recovery: if the reason for revision is later retracted, the
  original beliefs can be restored

Two-mode note: this is pure logic over Django models and NLI scores.
When NLI is unavailable (production mode), it falls back to edge-type
heuristics for contradiction detection.
"""

import logging
import os
import sys
from itertools import combinations

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "research_api.settings")
django.setup()

from django.db.models import Q

from apps.notebook.models import Claim, Edge, Object

logger = logging.getLogger("theseus.simulate.belief_revision")


def detect_contradictions(notebook_id=None):
    """Find pairs of claims that contradict each other.

    Uses 'contradicts' edges from the NLI pass. In production mode
    (no NLI), falls back to edges explicitly typed as contradictions.
    """
    edge_qs = Edge.objects.filter(
        edge_type="contradicts"
    ).select_related("from_object", "to_object")

    if notebook_id:
        edge_qs = edge_qs.filter(
            Q(from_object__notebooks=notebook_id)
            | Q(to_object__notebooks=notebook_id)
        )

    contradictions = []
    for edge in edge_qs:
        # Look up the claims associated with these objects.
        claims_a = Claim.objects.filter(object=edge.from_object)
        claims_b = Claim.objects.filter(object=edge.to_object)

        for ca in claims_a:
            for cb in claims_b:
                contradictions.append({
                    "claim_a": ca,
                    "claim_b": cb,
                    "edge": edge,
                    "strength": edge.strength or 0.5,
                    "reason": edge.reason or "NLI contradiction detected",
                })

    logger.info("Found %d contradiction pairs", len(contradictions))
    return contradictions


def compute_support_strength(claim):
    """Compute the total evidential support for a claim.

    Support strength = sum of supporting edge strengths weighted
    by the reliability of the source type.
    """
    source_type_weights = {
        "source": 1.0,       # Primary sources are strongest
        "claim": 0.7,        # Claims supporting claims are weaker
        "note": 0.5,         # User notes are medium
        "question": 0.3,     # Questions provide weak support
    }

    support_edges = Edge.objects.filter(
        to_object=claim.object,
        edge_type__in=["supports", "entailment"],
    ).select_related("from_object")

    total = 0.0
    sources = []
    for edge in support_edges:
        weight = source_type_weights.get(edge.from_object.object_type, 0.5)
        strength = (edge.strength or 0.5) * weight
        total += strength
        sources.append({
            "object_id": edge.from_object_id,
            "title": (edge.from_object.title or "")[:80],
            "type": edge.from_object.object_type,
            "strength": round(strength, 3),
        })

    return total, sources


def compute_minimal_revision_set(contradiction):
    """Determine the minimal set of belief changes to resolve a contradiction.

    AGM minimal change: we prefer to revise the claim with less
    evidential support, preserving the better-supported belief.
    Returns a list of revision options, each describing what would
    change and at what cost.
    """
    claim_a = contradiction["claim_a"]
    claim_b = contradiction["claim_b"]

    support_a, sources_a = compute_support_strength(claim_a)
    support_b, sources_b = compute_support_strength(claim_b)

    options = []

    # Option 1: Revise claim A (keep B).
    options.append({
        "action": "revise",
        "revise_claim": {
            "id": claim_a.id,
            "text": claim_a.text[:200],
            "current_support": round(support_a, 3),
            "supporting_sources": sources_a,
        },
        "keep_claim": {
            "id": claim_b.id,
            "text": claim_b.text[:200],
            "current_support": round(support_b, 3),
        },
        "cost": round(support_a, 3),  # Cost = strength of evidence lost
        "recommended": support_a < support_b,
    })

    # Option 2: Revise claim B (keep A).
    options.append({
        "action": "revise",
        "revise_claim": {
            "id": claim_b.id,
            "text": claim_b.text[:200],
            "current_support": round(support_b, 3),
            "supporting_sources": sources_b,
        },
        "keep_claim": {
            "id": claim_a.id,
            "text": claim_a.text[:200],
            "current_support": round(support_a, 3),
        },
        "cost": round(support_b, 3),
        "recommended": support_b < support_a,
    })

    # Option 3: Mark both as contested (no revision, flag for investigation).
    options.append({
        "action": "contest",
        "claims": [
            {"id": claim_a.id, "text": claim_a.text[:200]},
            {"id": claim_b.id, "text": claim_b.text[:200]},
        ],
        "cost": 0,
        "recommended": abs(support_a - support_b) < 0.2,
    })

    return sorted(options, key=lambda o: o["cost"])


def simulate_revision(option):
    """Simulate applying a revision option and show the downstream effects.

    Does NOT modify the database (Invariant #7: humans review first).
    Shows what would change if the revision were accepted.
    """
    if option["action"] == "contest":
        return {
            "action": "contest",
            "changes": [
                f"Claim {c['id']} marked as 'contested'"
                for c in option["claims"]
            ],
            "downstream_impact": "None -- both claims remain but are flagged",
        }

    revise_id = option["revise_claim"]["id"]
    claim = Claim.objects.get(id=revise_id)

    # Find claims that depend on the revised claim.
    dependent_edges = Edge.objects.filter(
        from_object=claim.object,
        edge_type__in=["supports", "entailment"],
    ).select_related("to_object")

    downstream = []
    for edge in dependent_edges:
        # Check if the dependent claim has other support.
        other_support = Edge.objects.filter(
            to_object=edge.to_object,
            edge_type__in=["supports", "entailment"],
        ).exclude(from_object=claim.object).count()

        downstream.append({
            "object_id": edge.to_object_id,
            "title": (edge.to_object.title or "")[:80],
            "other_support_count": other_support,
            "status": "still_supported" if other_support > 0 else "needs_review",
        })

    return {
        "action": "revise",
        "revised_claim": option["revise_claim"]["text"][:100],
        "new_status": "retracted",
        "downstream_claims": downstream,
        "claims_needing_review": len(
            [d for d in downstream if d["status"] == "needs_review"]
        ),
    }


def run_belief_revision(notebook_id=None):
    """Full belief revision workflow: detect, compute options, simulate."""
    contradictions = detect_contradictions(notebook_id)

    if not contradictions:
        print("No contradictions detected. Belief set is consistent.")
        return []

    results = []
    for contradiction in contradictions:
        logger.info(
            "\nContradiction: '%s' vs '%s'",
            contradiction["claim_a"].text[:60],
            contradiction["claim_b"].text[:60],
        )

        options = compute_minimal_revision_set(contradiction)
        recommended = [o for o in options if o.get("recommended")]

        # Simulate the recommended option.
        if recommended:
            simulation = simulate_revision(recommended[0])
        else:
            simulation = simulate_revision(options[0])

        results.append({
            "contradiction": {
                "claim_a": contradiction["claim_a"].text[:200],
                "claim_b": contradiction["claim_b"].text[:200],
                "strength": contradiction["strength"],
            },
            "revision_options": options,
            "simulation": simulation,
        })

    return results


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    notebook_id = int(sys.argv[1]) if len(sys.argv) > 1 else None
    results = run_belief_revision(notebook_id)

    print(f"\nAnalyzed {len(results)} contradiction(s)")
    for i, r in enumerate(results):
        print(f"\n--- Contradiction {i + 1} ---")
        print(f"  A: {r['contradiction']['claim_a'][:80]}")
        print(f"  B: {r['contradiction']['claim_b'][:80]}")
        rec = [o for o in r["revision_options"] if o.get("recommended")]
        if rec:
            print(f"  Recommended: {rec[0]['action']} (cost={rec[0]['cost']})")
        print(f"  Downstream impact: {r['simulation'].get('claims_needing_review', 0)} claims need review")
