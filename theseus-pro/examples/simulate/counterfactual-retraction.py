"""
Counterfactual Retraction Simulation

Demonstrates Level 7 truth maintenance: build a dependency tree from
Claims and their supporting sources, simulate retracting one or more
sources, compute the cascading effect on all dependent claims, and
produce a fragility score for the knowledge base.

This answers "what if this source were wrong?" without modifying the
database. The simulation walks the justification network using BFS,
marking claims as unsupported (all support lost) or weakened (some
support lost), and reports cascade depth and fragility metrics.

Two-mode note: this is pure graph traversal over Django models. It
runs in both production and local environments with no ML dependencies.
"""

import logging
import os
import sys
from collections import defaultdict

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "research_api.settings")
django.setup()

from django.db.models import Q

from apps.notebook.models import Claim, Edge, Object

logger = logging.getLogger("theseus.simulate.counterfactual")


def build_dependency_graph(notebook_id=None):
    """Build the claim dependency adjacency structure from edges.

    Each claim depends on the sources and claims connected to it via
    'supports', 'entailment', or 'citation' edges. This is the
    justification network that TMS operates over.
    """
    edge_qs = Edge.objects.filter(
        edge_type__in=["supports", "entailment", "citation"]
    ).select_related("from_object", "to_object")

    if notebook_id:
        edge_qs = edge_qs.filter(
            Q(to_object__notebooks=notebook_id)
            | Q(from_object__notebooks=notebook_id)
        )

    # Map: object_id -> list of (dependent_object_id, edge_strength)
    dependents = defaultdict(list)
    # Map: object_id -> list of (supporting_object_id, edge_strength)
    supporters = defaultdict(list)

    for edge in edge_qs:
        # from_object supports to_object
        dependents[edge.from_object_id].append(
            (edge.to_object_id, edge.strength or 1.0)
        )
        supporters[edge.to_object_id].append(
            (edge.from_object_id, edge.strength or 1.0)
        )

    logger.info(
        "Dependency graph: %d support relationships, %d objects with supporters",
        sum(len(v) for v in dependents.values()),
        len(supporters),
    )
    return dependents, supporters


def simulate_retraction(retract_ids, notebook_id=None):
    """Simulate removing sources or claims and compute the cascade.

    Does NOT modify the database. Returns a report with:
    - fragility: fraction of claims that become unsupported
    - affected_claims: list of claims with old/new status
    - cascade_depth: how many levels deep the retraction propagates
    - load_bearing: whether the retracted nodes are structurally critical
    """
    dependents, supporters = build_dependency_graph(notebook_id)

    retracted = set(retract_ids)
    affected = []
    visited = set()
    queue = list(retract_ids)

    while queue:
        node_id = queue.pop(0)
        if node_id in visited:
            continue
        visited.add(node_id)

        # Find all objects that depend on this node.
        for dep_id, strength in dependents.get(node_id, []):
            if dep_id in visited:
                continue

            # Check surviving support paths for this dependent.
            all_support = supporters.get(dep_id, [])
            surviving = [
                (sid, s) for sid, s in all_support if sid not in retracted
            ]

            # Look up the object for reporting.
            try:
                dep_obj = Object.objects.get(id=dep_id)
                obj_text = (dep_obj.title or dep_obj.text or "")[:200]
            except Object.DoesNotExist:
                obj_text = f"Object {dep_id}"

            if not surviving:
                # All support removed -- claim becomes unsupported.
                depth = len([a for a in affected if a["new_status"] == "unsupported"])
                affected.append({
                    "object_id": dep_id,
                    "text": obj_text,
                    "old_support_count": len(all_support),
                    "new_status": "unsupported",
                    "depth": depth,
                })
                retracted.add(dep_id)
                queue.append(dep_id)
            elif len(surviving) < len(all_support):
                # Partial support lost -- claim is weakened.
                old_conf = sum(s for _, s in all_support) / len(all_support)
                new_conf = sum(s for _, s in surviving) / len(surviving)
                affected.append({
                    "object_id": dep_id,
                    "text": obj_text,
                    "old_support_count": len(all_support),
                    "surviving_support_count": len(surviving),
                    "new_status": "weakened",
                    "confidence_delta": round(new_conf - old_conf, 3),
                })

    # Compute summary metrics.
    total_claims = Object.objects.filter(is_deleted=False)
    if notebook_id:
        total_claims = total_claims.filter(notebooks=notebook_id)
    total_count = total_claims.count()

    unsupported = [a for a in affected if a["new_status"] == "unsupported"]
    weakened = [a for a in affected if a["new_status"] == "weakened"]
    max_depth = max((a.get("depth", 0) for a in affected), default=0)

    return {
        "retracted_ids": list(retract_ids),
        "fragility": round(len(unsupported) / max(total_count, 1), 4),
        "total_affected": len(affected),
        "unsupported_count": len(unsupported),
        "weakened_count": len(weakened),
        "cascade_depth": max_depth,
        "load_bearing": len(unsupported) > total_count * 0.05,
        "affected_claims": affected,
    }


def compute_load_bearing_scores(notebook_id=None, top_n=20):
    """Rank sources by their structural importance.

    For each source, simulate its retraction and measure how many
    claims become unsupported. Sources with high fragility impact
    are "load-bearing" -- the knowledge base depends on them.
    """
    sources = Object.objects.filter(
        object_type="source", is_deleted=False
    )
    if notebook_id:
        sources = sources.filter(notebooks=notebook_id)

    scores = []
    for source in sources:
        result = simulate_retraction({source.id}, notebook_id)
        scores.append({
            "source_id": source.id,
            "title": (source.title or "")[:100],
            "fragility_impact": result["fragility"],
            "claims_lost": result["unsupported_count"],
            "claims_weakened": result["weakened_count"],
            "cascade_depth": result["cascade_depth"],
        })

    scores.sort(key=lambda x: -x["fragility_impact"])
    return scores[:top_n]


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    # Example: simulate retracting specific source IDs.
    if len(sys.argv) > 1:
        retract_ids = set(int(x) for x in sys.argv[1:])
        result = simulate_retraction(retract_ids)
        print(f"\nRetraction of {len(retract_ids)} source(s):")
        print(f"  Fragility score: {result['fragility']:.2%}")
        print(f"  Claims unsupported: {result['unsupported_count']}")
        print(f"  Claims weakened: {result['weakened_count']}")
        print(f"  Cascade depth: {result['cascade_depth']}")
        print(f"  Load-bearing: {result['load_bearing']}")
    else:
        # Default: show the most load-bearing sources.
        print("Computing load-bearing scores for all sources...\n")
        scores = compute_load_bearing_scores()
        for s in scores:
            print(
                f"  [{s['source_id']:5d}] {s['title'][:60]:60s} "
                f"fragility={s['fragility_impact']:.2%}  "
                f"lost={s['claims_lost']}  depth={s['cascade_depth']}"
            )
