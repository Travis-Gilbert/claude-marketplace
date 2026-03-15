"""
Triplet Construction Example
===============================
Demonstrates building training triplets for contrastive learning from
the research_api knowledge graph: strong edges become positive pairs,
cross-cluster non-edges become hard negatives.

Pipeline:
  edges with strength > 0.7 = positive pairs -> different clusters with
  no edges = hard negatives -> construct (anchor, positive, negative) triplets

Key concepts:
  - Positive pairs: Objects connected by strong edges (strength > 0.7)
  - Hard negatives: Objects in different clusters with no edge between them
  - Triplet format: (anchor, positive, negative) for contrastive training
  - Hard negative mining: selecting negatives that are superficially similar
    but semantically unrelated (more informative than random negatives)
  - Graph structure informs training data quality
"""

import logging
import random
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Two-mode import for embedding similarity (used in hard negative mining)
# ---------------------------------------------------------------------------
try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    _SBERT_AVAILABLE = True
except ImportError:
    _SBERT_AVAILABLE = False


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------
@dataclass
class Object:
    id: int
    title: str
    body: str
    cluster_id: Optional[int] = None  # assigned by Louvain community detection


@dataclass
class Edge:
    from_object_id: int
    to_object_id: int
    edge_type: str
    strength: float
    reason: str


@dataclass
class Triplet:
    """A training triplet for contrastive learning.

    The model learns to embed the anchor closer to the positive
    and farther from the negative in embedding space.
    """
    anchor_id: int
    anchor_text: str
    positive_id: int
    positive_text: str
    negative_id: int
    negative_text: str
    edge_type: str         # type of the positive edge
    edge_strength: float   # strength of the positive edge
    negative_type: str     # "hard" or "random"

    def to_texts(self) -> tuple[str, str, str]:
        """Return (anchor, positive, negative) text tuple for training."""
        return (self.anchor_text, self.positive_text, self.negative_text)


# ---------------------------------------------------------------------------
# Stage 1: Extract positive pairs from strong edges
# ---------------------------------------------------------------------------
POSITIVE_THRESHOLD = 0.7

# Edge types that represent meaningful positive relationships
POSITIVE_EDGE_TYPES = {
    "similarity", "support", "entailment", "derived_from",
    "builds_on", "instance_of", "broader",
}


def extract_positive_pairs(
    edges: list[Edge],
    objects: dict[int, Object],
) -> list[tuple[Object, Object, Edge]]:
    """Extract positive pairs from edges with strength > threshold.

    Only considers edge types that represent genuine semantic relationships.
    Contradiction and tension edges are excluded (they represent negative
    relationships, not positive training signal).
    """
    pairs = []
    for edge in edges:
        if edge.strength < POSITIVE_THRESHOLD:
            continue
        if edge.edge_type not in POSITIVE_EDGE_TYPES:
            continue

        obj_a = objects.get(edge.from_object_id)
        obj_b = objects.get(edge.to_object_id)
        if obj_a and obj_b:
            pairs.append((obj_a, obj_b, edge))

    logger.info(
        "Extracted %d positive pairs from %d edges (threshold=%.2f)",
        len(pairs), len(edges), POSITIVE_THRESHOLD,
    )
    return pairs


# ---------------------------------------------------------------------------
# Stage 2: Mine hard negatives
# ---------------------------------------------------------------------------
def mine_hard_negatives(
    anchor: Object,
    positive: Object,
    all_objects: dict[int, Object],
    edge_index: set[tuple[int, int]],
    num_negatives: int = 5,
) -> list[tuple[Object, str]]:
    """Mine hard negatives for a given anchor-positive pair.

    Hard negatives are objects that:
      1. Are in a different cluster than the anchor (no community overlap)
      2. Have no edge to the anchor (confirmed unrelated)
      3. (If SBERT available) Have some embedding similarity to the anchor
         (superficially similar but semantically unrelated -- hardest negatives)

    Hard negatives are more informative for training than random negatives
    because the model must learn subtle distinctions.
    """
    candidates = []
    for obj_id, obj in all_objects.items():
        # Skip the anchor and positive themselves
        if obj_id in (anchor.id, positive.id):
            continue

        # Must be in a different cluster
        if obj.cluster_id is not None and obj.cluster_id == anchor.cluster_id:
            continue

        # Must have no edge to the anchor
        if (anchor.id, obj_id) in edge_index or (obj_id, anchor.id) in edge_index:
            continue

        candidates.append(obj)

    if not candidates:
        return []

    # If SBERT is available, rank candidates by embedding similarity to anchor
    # (pick those with moderate similarity -- they're the hardest negatives)
    if _SBERT_AVAILABLE and len(candidates) > num_negatives:
        return _rank_negatives_by_similarity(anchor, candidates, num_negatives)

    # Fallback: random selection
    selected = random.sample(candidates, min(num_negatives, len(candidates)))
    return [(obj, "random") for obj in selected]


def _rank_negatives_by_similarity(
    anchor: Object,
    candidates: list[Object],
    num_negatives: int,
) -> list[tuple[Object, str]]:
    """Rank negative candidates by embedding similarity to the anchor.

    The hardest negatives are those with moderate-to-high similarity
    (0.3 - 0.6 cosine). Very high similarity (> 0.7) candidates might
    actually be related but missing an edge. Very low similarity (< 0.2)
    candidates are too easy.
    """
    model = SentenceTransformer("all-MiniLM-L6-v2")

    anchor_text = f"{anchor.title}. {anchor.body[:200]}"
    candidate_texts = [f"{c.title}. {c.body[:200]}" for c in candidates]

    anchor_emb = model.encode([anchor_text], normalize_embeddings=True)
    candidate_embs = model.encode(candidate_texts, normalize_embeddings=True)

    similarities = np.dot(candidate_embs, anchor_emb.T).flatten()

    # Score candidates: prefer moderate similarity (0.3-0.6 sweet spot)
    scores = []
    for i, sim in enumerate(similarities):
        # Bell curve centered at 0.45 similarity
        hardness = 1.0 - abs(sim - 0.45) * 2.0
        scores.append((candidates[i], float(sim), max(0.0, hardness)))

    # Sort by hardness score (highest = best hard negative)
    scores.sort(key=lambda x: x[2], reverse=True)

    selected = [(obj, "hard") for obj, sim, score in scores[:num_negatives]]
    logger.debug(
        "Hard negative mining: top similarity range [%.3f, %.3f]",
        scores[0][1] if scores else 0,
        scores[min(num_negatives - 1, len(scores) - 1)][1] if scores else 0,
    )
    return selected


# ---------------------------------------------------------------------------
# Stage 3: Construct triplets
# ---------------------------------------------------------------------------
def construct_triplets(
    objects: list[Object],
    edges: list[Edge],
    negatives_per_positive: int = 3,
    seed: int = 42,
) -> list[Triplet]:
    """Full triplet construction pipeline.

    1. Extract positive pairs from strong edges
    2. For each positive pair, mine hard negatives
    3. Construct (anchor, positive, negative) triplets

    Each positive pair generates multiple triplets (one per negative).
    """
    random.seed(seed)

    obj_map = {o.id: o for o in objects}

    # Build edge index for fast lookup
    edge_index = set()
    for edge in edges:
        edge_index.add((edge.from_object_id, edge.to_object_id))
        edge_index.add((edge.to_object_id, edge.from_object_id))

    positive_pairs = extract_positive_pairs(edges, obj_map)

    triplets = []
    for anchor, positive, edge in positive_pairs:
        negatives = mine_hard_negatives(
            anchor, positive, obj_map, edge_index,
            num_negatives=negatives_per_positive,
        )

        for neg_obj, neg_type in negatives:
            triplet = Triplet(
                anchor_id=anchor.id,
                anchor_text=f"{anchor.title}. {anchor.body[:200]}",
                positive_id=positive.id,
                positive_text=f"{positive.title}. {positive.body[:200]}",
                negative_id=neg_obj.id,
                negative_text=f"{neg_obj.title}. {neg_obj.body[:200]}",
                edge_type=edge.edge_type,
                edge_strength=edge.strength,
                negative_type=neg_type,
            )
            triplets.append(triplet)

    # Also create triplets with anchor/positive swapped (symmetric edges)
    for anchor, positive, edge in positive_pairs:
        if edge.edge_type in ("similarity",):  # symmetric edge types
            negatives = mine_hard_negatives(
                positive, anchor, obj_map, edge_index,
                num_negatives=negatives_per_positive,
            )
            for neg_obj, neg_type in negatives:
                triplet = Triplet(
                    anchor_id=positive.id,
                    anchor_text=f"{positive.title}. {positive.body[:200]}",
                    positive_id=anchor.id,
                    positive_text=f"{anchor.title}. {anchor.body[:200]}",
                    negative_id=neg_obj.id,
                    negative_text=f"{neg_obj.title}. {neg_obj.body[:200]}",
                    edge_type=edge.edge_type,
                    edge_strength=edge.strength,
                    negative_type=neg_type,
                )
                triplets.append(triplet)

    logger.info(
        "Constructed %d triplets from %d positive pairs (%d negatives each)",
        len(triplets), len(positive_pairs), negatives_per_positive,
    )
    return triplets


# ---------------------------------------------------------------------------
# Usage example
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Simulate a small knowledge graph with clusters
    objects = [
        # Cluster 0: Structural engineering
        Object(id=1, title="Reinforced Concrete",
               body="Concrete reinforced with steel rebar for tensile strength.", cluster_id=0),
        Object(id=2, title="Prestressed Concrete",
               body="Concrete with pre-tensioned steel tendons for improved performance.", cluster_id=0),
        Object(id=3, title="Steel Framing",
               body="Structural system using steel beams and columns.", cluster_id=0),
        # Cluster 1: Architecture
        Object(id=4, title="Gothic Architecture",
               body="Medieval architectural style with pointed arches and flying buttresses.", cluster_id=1),
        Object(id=5, title="Brutalism",
               body="Architectural style featuring raw concrete and geometric forms.", cluster_id=1),
        # Cluster 2: Materials science
        Object(id=6, title="Carbon Fiber Composites",
               body="Lightweight high-strength composite material for aerospace.", cluster_id=2),
        Object(id=7, title="Timber Engineering",
               body="Structural use of engineered wood products like CLT.", cluster_id=2),
    ]

    edges = [
        Edge(from_object_id=1, to_object_id=2, edge_type="similarity",
             strength=0.85, reason="Both are concrete construction methods."),
        Edge(from_object_id=1, to_object_id=3, edge_type="similarity",
             strength=0.75, reason="Both are primary structural systems."),
        Edge(from_object_id=4, to_object_id=5, edge_type="similarity",
             strength=0.6, reason="Both are architectural styles."),  # Below threshold
        Edge(from_object_id=5, to_object_id=1, edge_type="support",
             strength=0.8, reason="Brutalism prominently features reinforced concrete."),
    ]

    triplets = construct_triplets(objects, edges, negatives_per_positive=2)

    print(f"Constructed {len(triplets)} triplets:\n")
    for i, t in enumerate(triplets, 1):
        print(f"  Triplet {i}:")
        print(f"    Anchor:   [{t.anchor_id}] {t.anchor_text[:60]}...")
        print(f"    Positive: [{t.positive_id}] {t.positive_text[:60]}...")
        print(f"    Negative: [{t.negative_id}] {t.negative_text[:60]}...")
        print(f"    Edge: {t.edge_type} (strength={t.edge_strength:.2f})")
        print(f"    Negative type: {t.negative_type}")
        print()
