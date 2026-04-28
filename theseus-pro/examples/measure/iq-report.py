"""
IQ Tracker Report

Demonstrates the full IQ measurement pipeline: score each of the 7
intelligence axes (Discovery, Organization, Tension, Lineage,
Retrieval, Ingestion, Learning), compute the weighted composite,
compare against the previous snapshot to show trends, and identify
the highest-priority improvement opportunity.

The IQ Tracker is the fitness function for the entire Theseus system.
Every feature launch, engine config change, and training run should
produce a before/after IQ measurement. The composite score is the
single number that answers "is the system getting smarter?"

Two-mode note: all measurements work in both production and local
environments. Axes that depend on unavailable capabilities (e.g.,
Learning axis when no trained scorer exists) score 0 gracefully.
"""

import logging
import os
import sys
from datetime import datetime

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "research_api.settings")
django.setup()

from apps.notebook.models import Edge, Object

logger = logging.getLogger("theseus.measure.iq")

# Axis weights sum to 1.0. Discovery and Learning are weighted highest
# because they represent the system's core purpose.
AXES = {
    "discovery":    0.20,
    "organization": 0.15,
    "tension":      0.15,
    "lineage":      0.10,
    "retrieval":    0.15,
    "ingestion":    0.10,
    "learning":     0.15,
}


def measure_discovery():
    """Discovery: can the system find real, useful connections?

    Scoring components:
    - Precision at 10 on test queries
    - Novel connection rate (cross-notebook edges / total auto edges)
    - Web validation rate (web-validated / total auto edges)
    """
    auto_edges = Edge.objects.filter(is_auto=True)
    total_auto = auto_edges.count()
    if total_auto == 0:
        return 0.0, {"reason": "No auto edges yet"}

    # Cross-notebook edges indicate genuine discovery.
    cross_notebook = auto_edges.filter(
        from_object__notebooks__isnull=False,
        to_object__notebooks__isnull=False,
    ).exclude(
        from_object__notebooks=None
    ).count()
    novel_rate = min(1.0, cross_notebook / max(total_auto, 1))

    # Web validation rate (if available).
    web_validated = auto_edges.filter(engine="web_validation").count()
    web_rate = min(1.0, web_validated / max(total_auto, 1))

    # Precision from user engagement feedback.
    try:
        from apps.notebook.models import ConnectionFeedback
        engaged = ConnectionFeedback.objects.filter(label="engaged").count()
        dismissed = ConnectionFeedback.objects.filter(label="dismissed").count()
        total_fb = engaged + dismissed
        precision = engaged / max(total_fb, 1) if total_fb > 10 else 0.5
    except Exception:
        precision = 0.5

    score = (0.4 * precision + 0.3 * novel_rate + 0.3 * web_rate) * 100
    return round(score, 1), {
        "precision": round(precision, 3),
        "novel_rate": round(novel_rate, 3),
        "web_validation_rate": round(web_rate, 3),
    }


def measure_organization():
    """Organization: can the system structure knowledge without being told?"""
    total_objects = Object.objects.filter(is_deleted=False).count()
    if total_objects == 0:
        return 0.0, {"reason": "No objects"}

    # Objects with community labels indicate auto-clustering.
    clustered = Object.objects.filter(
        is_deleted=False, community_label__isnull=False
    ).count()
    cluster_rate = clustered / total_objects

    # Objects with auto-assigned types.
    typed = Object.objects.filter(
        is_deleted=False
    ).exclude(object_type="note").count()
    type_rate = typed / total_objects

    score = (0.5 * cluster_rate + 0.5 * type_rate) * 100
    return round(score, 1), {
        "cluster_rate": round(cluster_rate, 3),
        "type_rate": round(type_rate, 3),
    }


def measure_tension():
    """Tension: can the system find contradictions?"""
    try:
        from apps.notebook.models import Tension
        detected = Tension.objects.count()
        confirmed = Tension.objects.filter(status="confirmed").count()
        if detected == 0:
            return 0.0, {"reason": "No tensions detected"}
        precision = confirmed / detected
        score = precision * 100
        return round(score, 1), {
            "detected": detected,
            "confirmed": confirmed,
            "precision": round(precision, 3),
        }
    except Exception:
        contradiction_edges = Edge.objects.filter(edge_type="contradicts").count()
        score = min(100, contradiction_edges * 5)
        return round(score, 1), {"contradiction_edges": contradiction_edges}


def measure_lineage():
    """Lineage: can the system trace how knowledge evolved?"""
    total_objects = Object.objects.filter(is_deleted=False).count()
    if total_objects == 0:
        return 0.0, {"reason": "No objects"}

    # Objects with SHA hash provenance.
    with_sha = Object.objects.filter(
        is_deleted=False, sha_hash__isnull=False
    ).count()
    sha_rate = with_sha / total_objects

    # Edges with reasons (provenance).
    total_edges = Edge.objects.count()
    with_reason = Edge.objects.exclude(reason="").exclude(reason__isnull=True).count()
    reason_rate = with_reason / max(total_edges, 1)

    score = (0.5 * sha_rate + 0.5 * reason_rate) * 100
    return round(score, 1), {
        "sha_coverage": round(sha_rate, 3),
        "reason_coverage": round(reason_rate, 3),
    }


def measure_retrieval():
    """Retrieval: can the system find the right thing when asked?"""
    try:
        from apps.notebook.bm25 import BM25Index
        bm25_ready = BM25Index.is_built()
    except Exception:
        bm25_ready = False

    try:
        from apps.notebook.vector_store import FaissStore
        faiss_ready = FaissStore.is_loaded()
    except Exception:
        faiss_ready = False

    # Score based on available retrieval infrastructure.
    infra_score = (0.5 * int(bm25_ready) + 0.5 * int(faiss_ready)) * 100
    return round(infra_score, 1), {
        "bm25_available": bm25_ready,
        "faiss_available": faiss_ready,
    }


def measure_ingestion():
    """Ingestion: can the system handle diverse inputs?"""
    total = Object.objects.filter(is_deleted=False).count()
    if total == 0:
        return 0.0, {"reason": "No objects"}

    type_counts = {}
    for obj_type in Object.objects.filter(is_deleted=False).values_list(
        "object_type", flat=True
    ).distinct():
        type_counts[obj_type] = Object.objects.filter(
            is_deleted=False, object_type=obj_type
        ).count()

    diversity = len(type_counts) / 10.0  # 10 object types = full coverage
    volume = min(1.0, total / 1000.0)    # 1000+ objects = full throughput

    score = (0.5 * diversity + 0.5 * volume) * 100
    return round(score, 1), {
        "type_diversity": round(diversity, 3),
        "volume_score": round(volume, 3),
        "type_counts": type_counts,
    }


def measure_learning():
    """Learning: does the system get smarter over time?"""
    try:
        from apps.notebook.models import ConnectionFeedback
        feedback_count = ConnectionFeedback.objects.count()
    except Exception:
        feedback_count = 0

    # Check if a trained scorer exists.
    scorer_exists = os.path.exists("models/learned_scorer.joblib")

    feedback_score = min(1.0, feedback_count / 200.0)  # 200+ = mature
    scorer_score = 1.0 if scorer_exists else 0.0

    score = (0.4 * scorer_score + 0.6 * feedback_score) * 100
    return round(score, 1), {
        "feedback_count": feedback_count,
        "scorer_trained": scorer_exists,
    }


def run_all_measurements():
    """Run all 7 axis measurements and compute composite score."""
    axis_fns = {
        "discovery": measure_discovery,
        "organization": measure_organization,
        "tension": measure_tension,
        "lineage": measure_lineage,
        "retrieval": measure_retrieval,
        "ingestion": measure_ingestion,
        "learning": measure_learning,
    }

    scores = {}
    details = {}
    for axis, fn in axis_fns.items():
        score, detail = fn()
        scores[axis] = score
        details[axis] = detail

    composite = sum(scores[axis] * AXES[axis] for axis in AXES)
    return scores, details, round(composite, 1)


def find_bottleneck(scores):
    """Find the axis with the largest weighted gap from 100."""
    gaps = {axis: (100 - scores[axis]) * AXES[axis] for axis in AXES}
    return max(gaps, key=gaps.get)


def render_bar(score, width=30):
    """Render a score as an ASCII progress bar."""
    filled = int(score / 100 * width)
    return "#" * filled + "-" * (width - filled)


def print_report(scores, details, composite):
    """Print a formatted IQ report to stdout."""
    print("=" * 50)
    print(f" INDEX INTELLIGENCE REPORT - {datetime.now().strftime('%Y-%m-%d')}")
    print("=" * 50)
    print()

    for axis in AXES:
        score = scores[axis]
        bar = render_bar(score)
        print(f"  {axis.capitalize():15s} {score:5.1f}/100  {bar}")
    print()
    print(f"  {'COMPOSITE IQ':15s} {composite:5.1f}/100")
    print()

    bottleneck = find_bottleneck(scores)
    print(f"  Bottleneck: {bottleneck.capitalize()} axis")
    print(f"  Top opportunity: improve {bottleneck} from {scores[bottleneck]:.0f}")
    print()

    # Per-axis detail.
    for axis in AXES:
        if details[axis]:
            detail_str = ", ".join(
                f"{k}={v}" for k, v in details[axis].items()
                if k != "reason"
            )
            if detail_str:
                print(f"  {axis}: {detail_str}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    scores, details, composite = run_all_measurements()
    print_report(scores, details, composite)
