"""
NLI Pair Scoring Example
=========================
Demonstrates Natural Language Inference (NLI) scoring between pairs of claims.

Pipeline:
  two texts -> claim decomposition -> cross-product claim pairs
  -> CrossEncoder scoring -> entailment/contradiction/neutral classification
  -> tension signal detection

Key concepts:
  - CrossEncoder NLI for pairwise claim comparison
  - Two-mode: CrossEncoder in dev, skip in production
  - Cross-product pairing: every claim from text A against every claim from text B
  - Three-way classification: entailment, contradiction, neutral
  - Tension signals emerge from high-contradiction scores
"""

import logging
from dataclasses import dataclass
from itertools import product
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Two-mode import: CrossEncoder NLI (dev/local only)
# ---------------------------------------------------------------------------
try:
    from sentence_transformers import CrossEncoder
    _NLI_AVAILABLE = True
except ImportError:
    _NLI_AVAILABLE = False

# Local module import (claim decomposition is always available)
# In practice this would be: from apps.research.claim_decomposition import ...
# For this example we define a minimal version inline.

import spacy
nlp = spacy.load("en_core_web_sm")


# ---------------------------------------------------------------------------
# Minimal claim structure (see claim-decomposition.py for the full version)
# ---------------------------------------------------------------------------
@dataclass
class Claim:
    text: str
    source_id: str  # identifies which source text this came from


@dataclass
class NLIPairScore:
    """Result of comparing two claims via NLI."""
    claim_a: Claim
    claim_b: Claim
    entailment: float     # probability that A entails B
    contradiction: float  # probability that A contradicts B
    neutral: float        # probability of neither
    label: str            # "entailment" | "contradiction" | "neutral"

    @property
    def is_tension_signal(self) -> bool:
        """A pair signals tension when contradiction probability is high.
        Threshold tuned empirically; 0.7 catches clear contradictions while
        avoiding false positives from ambiguous phrasing."""
        return self.contradiction > 0.7


# ---------------------------------------------------------------------------
# Stage 1: Extract claims from two texts
# ---------------------------------------------------------------------------
def extract_claims(text: str, source_id: str) -> list[Claim]:
    """Simple sentence-based claim extraction. In production code this
    delegates to the full claim_decomposition pipeline."""
    doc = nlp(text)
    claims = []
    for sent in doc.sents:
        s = sent.text.strip()
        # Skip questions and very short fragments
        if s.endswith("?") or len(s.split()) < 4:
            continue
        claims.append(Claim(text=s, source_id=source_id))
    return claims


# ---------------------------------------------------------------------------
# Stage 2: Build cross-product claim pairs
# ---------------------------------------------------------------------------
def build_claim_pairs(
    claims_a: list[Claim],
    claims_b: list[Claim],
) -> list[tuple[Claim, Claim]]:
    """Generate all (claim_from_A, claim_from_B) pairs for NLI scoring.

    For large claim sets this becomes O(n*m). In practice, pre-filter
    with embedding similarity to keep only plausibly related pairs.
    """
    pairs = list(product(claims_a, claims_b))
    logger.info(
        "Built %d claim pairs from %d x %d claims",
        len(pairs), len(claims_a), len(claims_b),
    )
    return pairs


# ---------------------------------------------------------------------------
# Stage 3: Score pairs with CrossEncoder NLI
# ---------------------------------------------------------------------------

# Model choice: cross-encoder/nli-deberta-v3-base is accurate and fast enough
# for interactive use. For batch scoring on Modal, use the -large variant.
NLI_MODEL = "cross-encoder/nli-deberta-v3-base"

# The model outputs logits in this order (DeBERTa NLI convention):
NLI_LABELS = ["contradiction", "entailment", "neutral"]


def score_pairs_nli(
    pairs: list[tuple[Claim, Claim]],
) -> list[NLIPairScore]:
    """Score each claim pair using CrossEncoder NLI.

    Returns NLIPairScore with three-way probabilities and a label.
    Only available in dev/local mode (requires sentence-transformers).
    """
    if not _NLI_AVAILABLE:
        logger.debug("CrossEncoder NLI unavailable, returning empty scores")
        return []

    model = CrossEncoder(NLI_MODEL)

    # Prepare input as list of (premise, hypothesis) tuples
    sentence_pairs = [(a.text, b.text) for a, b in pairs]

    # predict() returns logits; we need softmax probabilities
    import numpy as np
    logits = model.predict(sentence_pairs)

    # Softmax over the three NLI classes
    def softmax(x):
        exp_x = np.exp(x - np.max(x, axis=-1, keepdims=True))
        return exp_x / exp_x.sum(axis=-1, keepdims=True)

    probabilities = softmax(np.array(logits))

    results = []
    for (claim_a, claim_b), probs in zip(pairs, probabilities):
        # Map probabilities to named fields
        prob_dict = dict(zip(NLI_LABELS, probs.tolist()))
        label = NLI_LABELS[probs.argmax()]

        results.append(NLIPairScore(
            claim_a=claim_a,
            claim_b=claim_b,
            entailment=prob_dict["entailment"],
            contradiction=prob_dict["contradiction"],
            neutral=prob_dict["neutral"],
            label=label,
        ))

    return results


# ---------------------------------------------------------------------------
# Stage 4: Filter for tension signals
# ---------------------------------------------------------------------------
def detect_tension_signals(scores: list[NLIPairScore]) -> list[NLIPairScore]:
    """Filter scored pairs to those that signal tension (high contradiction).

    These pairs become candidates for Tension record creation in the
    knowledge graph. A human reviews them before they become canonical.
    """
    tensions = [s for s in scores if s.is_tension_signal]
    logger.info(
        "Found %d tension signals from %d scored pairs",
        len(tensions), len(scores),
    )
    return tensions


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------
def score_text_pair(
    text_a: str,
    text_b: str,
    source_id_a: str = "source_a",
    source_id_b: str = "source_b",
) -> dict:
    """Full NLI pair scoring pipeline.

    1. Extract claims from both texts
    2. Build cross-product claim pairs
    3. Score each pair with CrossEncoder NLI
    4. Detect tension signals

    Returns a dict with claims, scores, and tension signals.
    """
    claims_a = extract_claims(text_a, source_id_a)
    claims_b = extract_claims(text_b, source_id_b)

    pairs = build_claim_pairs(claims_a, claims_b)
    scores = score_pairs_nli(pairs)
    tensions = detect_tension_signals(scores)

    return {
        "claims_a": claims_a,
        "claims_b": claims_b,
        "total_pairs": len(pairs),
        "scores": scores,
        "tensions": tensions,
    }


# ---------------------------------------------------------------------------
# Usage example
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    text_a = """
    The building's facade uses load-bearing masonry walls that support
    the roof structure directly. The original architect specified a
    maximum of three stories for structural safety.
    """

    text_b = """
    The renovation plan adds two additional floors, bringing the total
    to five stories. The new steel frame transfers all loads to the
    foundation, bypassing the masonry walls entirely. The masonry walls
    are decorative and carry no structural load.
    """

    result = score_text_pair(text_a, text_b)

    print(f"Claims from text A: {len(result['claims_a'])}")
    print(f"Claims from text B: {len(result['claims_b'])}")
    print(f"Total pairs scored: {result['total_pairs']}")
    print(f"Tension signals: {len(result['tensions'])}")

    if result["tensions"]:
        print("\nTension signals found:")
        for t in result["tensions"]:
            print(f"\n  A: {t.claim_a.text}")
            print(f"  B: {t.claim_b.text}")
            print(f"  Contradiction: {t.contradiction:.3f}")
    elif not _NLI_AVAILABLE:
        print("\n(CrossEncoder NLI not available -- install sentence-transformers)")
    else:
        print("\nNo tensions detected between these texts.")
