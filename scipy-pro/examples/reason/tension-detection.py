"""
Tension Detection Example
==========================
Demonstrates the full tension detection flow: identifying pairs of claims
that are semantically similar yet contradictory, and creating Tension records
linking back to source Claims and Objects.

Pipeline:
  claim pairs -> embedding similarity filter -> NLI contradiction scoring
  -> tension threshold -> Tension record creation with provenance

Key concepts:
  - High similarity + high contradiction = tension
  - Two-stage filter: embedding pre-filter (fast) then NLI scoring (accurate)
  - Tension records carry full provenance (source claims, objects, scores)
  - Tensions trigger downstream model revision
  - Two-mode: SBERT + CrossEncoder in dev, BM25 similarity in production
"""

import hashlib
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Two-mode imports
# ---------------------------------------------------------------------------
try:
    from sentence_transformers import SentenceTransformer, CrossEncoder
    import numpy as np
    _ML_AVAILABLE = True
except ImportError:
    _ML_AVAILABLE = False

# spaCy + BM25 are always available (production fallback)
import spacy
nlp = spacy.load("en_core_web_sm")

try:
    from rank_bm25 import BM25Okapi
    _BM25_AVAILABLE = True
except ImportError:
    _BM25_AVAILABLE = False


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------
@dataclass
class Claim:
    """A sentence-sized proposition extracted from a source Object."""
    id: int
    text: str
    source_object_id: int
    embedding: Optional[list[float]] = None


@dataclass
class Tension:
    """A stored contradiction, ambiguity, or unresolved conflict between
    two claims. Tensions are first-class epistemic primitives in research_api.

    Invariant: LLMs propose, humans review. Tensions start as 'detected'
    and must be reviewed before they influence model formation.
    """
    claim_a_id: int
    claim_b_id: int
    claim_a_text: str
    claim_b_text: str
    source_object_a_id: int
    source_object_b_id: int
    similarity_score: float       # how semantically similar the claims are
    contradiction_score: float    # how contradictory (from NLI)
    tension_type: str = "contradiction"  # contradiction | ambiguity | gap
    status: str = "detected"      # detected | reviewed | resolved | dismissed
    resolution: Optional[str] = None
    sha: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)

    def __post_init__(self):
        if not self.sha:
            self.sha = self._generate_sha()

    def _generate_sha(self) -> str:
        """Deterministic identity. Two claims in the same order always
        produce the same tension SHA."""
        payload = f"{self.claim_a_id}|{self.claim_b_id}|{self.tension_type}"
        return hashlib.sha256(payload.encode()).hexdigest()[:16]

    @property
    def tension_strength(self) -> float:
        """Combined signal: high similarity AND high contradiction.
        A tension is most interesting when two claims say similar things
        but reach opposite conclusions."""
        return self.similarity_score * self.contradiction_score


# ---------------------------------------------------------------------------
# Stage 1: Compute pairwise similarity (pre-filter)
# ---------------------------------------------------------------------------
def compute_similarity_matrix_sbert(claims: list[Claim]) -> "np.ndarray":
    """Compute cosine similarity between all claim pairs using SBERT.
    Only available in dev/local mode."""
    if not _ML_AVAILABLE:
        logger.debug("SBERT unavailable for similarity matrix")
        return None

    model = SentenceTransformer("all-MiniLM-L6-v2")
    texts = [c.text for c in claims]
    embeddings = model.encode(texts, normalize_embeddings=True)

    # Store embeddings on the claim objects for later use
    for claim, emb in zip(claims, embeddings):
        claim.embedding = emb.tolist()

    # Cosine similarity matrix (embeddings are already L2-normalized)
    similarity_matrix = np.dot(embeddings, embeddings.T)
    return similarity_matrix


def compute_similarity_bm25(claims: list[Claim]) -> list[tuple[int, int, float]]:
    """BM25-based similarity as a production fallback.
    Less accurate than SBERT but runs without PyTorch."""
    if not _BM25_AVAILABLE:
        logger.warning("Neither SBERT nor BM25 available for similarity")
        return []

    tokenized = [c.text.lower().split() for c in claims]
    bm25 = BM25Okapi(tokenized)

    similar_pairs = []
    for i, claim in enumerate(claims):
        scores = bm25.get_scores(claim.text.lower().split())
        for j, score in enumerate(scores):
            if i < j and score > 5.0:  # BM25 threshold (empirically tuned)
                # Normalize to 0-1 range (approximate)
                normalized = min(score / 20.0, 1.0)
                similar_pairs.append((i, j, normalized))

    return similar_pairs


# ---------------------------------------------------------------------------
# Stage 2: Filter to high-similarity pairs
# ---------------------------------------------------------------------------
SIMILARITY_THRESHOLD = 0.5  # only consider pairs with cosine sim > 0.5


def find_similar_pairs(
    claims: list[Claim],
) -> list[tuple[Claim, Claim, float]]:
    """Find claim pairs that are semantically similar enough to potentially
    be in tension. This is a pre-filter before the expensive NLI step.

    Uses SBERT in dev mode, BM25 in production mode.
    """
    if _ML_AVAILABLE:
        sim_matrix = compute_similarity_matrix_sbert(claims)
        if sim_matrix is not None:
            pairs = []
            n = len(claims)
            for i in range(n):
                for j in range(i + 1, n):
                    sim = sim_matrix[i, j]
                    if sim > SIMILARITY_THRESHOLD:
                        # Skip claims from the same source object
                        if claims[i].source_object_id != claims[j].source_object_id:
                            pairs.append((claims[i], claims[j], float(sim)))
            logger.info("SBERT found %d similar cross-source pairs", len(pairs))
            return pairs

    # Production fallback: BM25 similarity
    bm25_pairs = compute_similarity_bm25(claims)
    result = []
    for i, j, sim in bm25_pairs:
        if claims[i].source_object_id != claims[j].source_object_id:
            result.append((claims[i], claims[j], sim))
    logger.info("BM25 found %d similar cross-source pairs", len(result))
    return result


# ---------------------------------------------------------------------------
# Stage 3: NLI contradiction scoring
# ---------------------------------------------------------------------------
NLI_MODEL = "cross-encoder/nli-deberta-v3-base"
NLI_LABELS = ["contradiction", "entailment", "neutral"]
CONTRADICTION_THRESHOLD = 0.7


def score_contradictions(
    pairs: list[tuple[Claim, Claim, float]],
) -> list[tuple[Claim, Claim, float, float]]:
    """Score each similar pair for contradiction using CrossEncoder NLI.

    Returns pairs augmented with contradiction probability.
    Only available in dev/local mode.
    """
    if not _ML_AVAILABLE:
        logger.debug("CrossEncoder unavailable, skipping NLI scoring")
        return []

    if not pairs:
        return []

    model = CrossEncoder(NLI_MODEL)
    sentence_pairs = [(a.text, b.text) for a, b, _ in pairs]
    logits = model.predict(sentence_pairs)

    # Softmax to get probabilities
    def softmax(x):
        exp_x = np.exp(x - np.max(x, axis=-1, keepdims=True))
        return exp_x / exp_x.sum(axis=-1, keepdims=True)

    probs = softmax(np.array(logits))

    results = []
    for (claim_a, claim_b, sim), prob_row in zip(pairs, probs):
        contradiction_prob = float(prob_row[NLI_LABELS.index("contradiction")])
        if contradiction_prob > CONTRADICTION_THRESHOLD:
            results.append((claim_a, claim_b, sim, contradiction_prob))

    logger.info(
        "NLI scoring: %d of %d pairs exceed contradiction threshold %.2f",
        len(results), len(pairs), CONTRADICTION_THRESHOLD,
    )
    return results


# ---------------------------------------------------------------------------
# Stage 4: Create Tension records
# ---------------------------------------------------------------------------
def create_tensions(
    contradictory_pairs: list[tuple[Claim, Claim, float, float]],
) -> list[Tension]:
    """Create Tension records from pairs with high similarity AND high
    contradiction. Each Tension links back to its source Claims and
    Objects for full provenance."""
    tensions = []
    for claim_a, claim_b, similarity, contradiction in contradictory_pairs:
        tension = Tension(
            claim_a_id=claim_a.id,
            claim_b_id=claim_b.id,
            claim_a_text=claim_a.text,
            claim_b_text=claim_b.text,
            source_object_a_id=claim_a.source_object_id,
            source_object_b_id=claim_b.source_object_id,
            similarity_score=similarity,
            contradiction_score=contradiction,
        )
        tensions.append(tension)

    # Sort by tension strength (highest first)
    tensions.sort(key=lambda t: t.tension_strength, reverse=True)
    return tensions


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------
def detect_tensions(claims: list[Claim]) -> list[Tension]:
    """Full tension detection pipeline.

    1. Find semantically similar claim pairs (SBERT or BM25)
    2. Score similar pairs for contradiction (CrossEncoder NLI)
    3. Create Tension records for pairs exceeding both thresholds

    The key insight: tension = high similarity + high contradiction.
    Two claims must be *about the same thing* to be in tension. Random
    unrelated claims may contradict each other but that is not a meaningful
    tension in the knowledge graph.
    """
    similar_pairs = find_similar_pairs(claims)
    contradictory_pairs = score_contradictions(similar_pairs)
    tensions = create_tensions(contradictory_pairs)

    logger.info(
        "Tension detection: %d claims -> %d similar pairs -> %d tensions",
        len(claims), len(similar_pairs), len(tensions),
    )
    return tensions


# ---------------------------------------------------------------------------
# Usage example
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Simulate claims from two different source Objects about the same topic
    claims = [
        Claim(id=1, text="The facade is load-bearing masonry supporting the roof.",
              source_object_id=10),
        Claim(id=2, text="The building was designed for a maximum of three stories.",
              source_object_id=10),
        Claim(id=3, text="The masonry walls are decorative and carry no structural load.",
              source_object_id=20),
        Claim(id=4, text="The renovation adds two floors for a total of five stories.",
              source_object_id=20),
        Claim(id=5, text="Steel framing transfers all loads directly to the foundation.",
              source_object_id=20),
    ]

    tensions = detect_tensions(claims)

    if tensions:
        print(f"\nDetected {len(tensions)} tensions:\n")
        for t in tensions:
            print(f"  Tension (strength={t.tension_strength:.3f}):")
            print(f"    A [obj {t.source_object_a_id}]: {t.claim_a_text}")
            print(f"    B [obj {t.source_object_b_id}]: {t.claim_b_text}")
            print(f"    similarity={t.similarity_score:.3f}  "
                  f"contradiction={t.contradiction_score:.3f}")
            print(f"    sha={t.sha}  status={t.status}")
            print()
    else:
        mode = "SBERT+NLI" if _ML_AVAILABLE else "BM25 (production fallback)"
        print(f"\nNo tensions detected. Mode: {mode}")
        if not _ML_AVAILABLE:
            print("Install sentence-transformers for full tension detection.")
