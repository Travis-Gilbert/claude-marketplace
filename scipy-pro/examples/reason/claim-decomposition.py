"""
Claim Decomposition Example
============================
Demonstrates how raw text is decomposed into individual claims using the
two-mode pattern: LLM-based extraction when available, rule-based fallback
when running in production (no PyTorch).

Pipeline: text input -> sentence splitting -> assertion filtering -> Claim records

Key concepts:
  - Two-mode safe imports (try/except with _FEATURE_AVAILABLE flag)
  - spaCy sentence splitting as the universal first stage
  - Assertion detection to filter non-claims (questions, commands, fragments)
  - LLM-based decomposition for compound sentences
  - Rule-based fallback using spaCy dependency parsing
"""

import hashlib
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Two-mode import: LLM claim extraction (dev/local only)
# ---------------------------------------------------------------------------
try:
    from apps.research.advanced_nlp import extract_claims_llm
    _LLM_AVAILABLE = True
except ImportError:
    _LLM_AVAILABLE = False

# spaCy is always available (production + dev)
import spacy

nlp = spacy.load("en_core_web_sm")


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------
@dataclass
class Claim:
    """A sentence-sized proposition extracted from a source Object."""
    text: str
    source_object_id: int
    source_span: tuple[int, int]       # character offsets in the source
    epistemic_status: str = "extracted" # extracted | reviewed | canonical
    confidence: float = 1.0
    sha: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    extraction_method: str = "rule"     # rule | llm

    def __post_init__(self):
        if not self.sha:
            self.sha = self._generate_sha()

    def _generate_sha(self) -> str:
        """Deterministic identity based on text and source. Matches the
        research_api provenance contract: every epistemic primitive carries
        its provenance via SHA-hash identity."""
        payload = f"{self.text}|{self.source_object_id}"
        return hashlib.sha256(payload.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Stage 1: Sentence splitting (always available)
# ---------------------------------------------------------------------------
def split_sentences(text: str) -> list[dict]:
    """Use spaCy to split text into sentence spans with character offsets."""
    doc = nlp(text)
    return [
        {
            "text": sent.text.strip(),
            "start": sent.start_char,
            "end": sent.end_char,
        }
        for sent in doc.sents
        if sent.text.strip()
    ]


# ---------------------------------------------------------------------------
# Stage 2: Assertion filtering (rule-based, always available)
# ---------------------------------------------------------------------------
def is_assertion(sentence: str) -> bool:
    """Filter out non-claims: questions, commands, fragments, and hedged
    meta-statements. A claim is a declarative sentence that asserts something
    about the world.

    This uses simple heuristics. The LLM path (when available) provides
    more nuanced classification.
    """
    s = sentence.strip()

    # Questions are not assertions
    if s.endswith("?"):
        return False

    # Commands / imperatives (start with a base-form verb)
    doc = nlp(s)
    if doc and doc[0].pos_ == "VERB" and doc[0].tag_ == "VB":
        return False

    # Too short to be a meaningful claim
    if len(s.split()) < 4:
        return False

    # Meta-hedging that doesn't assert anything concrete
    meta_prefixes = [
        "it is worth noting that",
        "it should be mentioned that",
        "in this section we",
        "the following discusses",
    ]
    lower = s.lower()
    if any(lower.startswith(prefix) for prefix in meta_prefixes):
        return False

    return True


# ---------------------------------------------------------------------------
# Stage 3a: LLM-based decomposition (dev/local only)
# ---------------------------------------------------------------------------
def decompose_with_llm(
    sentences: list[dict],
    source_object_id: int,
) -> list[Claim]:
    """Use the LLM to decompose compound sentences into atomic claims.

    A compound sentence like "The bridge uses steel cables and was designed
    by Roebling" becomes two claims:
      1. "The bridge uses steel cables"
      2. "The bridge was designed by Roebling"

    Only available when advanced_nlp is importable (dev/local mode).
    """
    if not _LLM_AVAILABLE:
        logger.debug("LLM unavailable, falling back to rule-based decomposition")
        return decompose_with_rules(sentences, source_object_id)

    claims = []
    for sent in sentences:
        if not is_assertion(sent["text"]):
            continue

        # extract_claims_llm returns a list of atomic claim strings
        atomic_claims = extract_claims_llm(sent["text"])

        for claim_text in atomic_claims:
            claims.append(Claim(
                text=claim_text,
                source_object_id=source_object_id,
                source_span=(sent["start"], sent["end"]),
                extraction_method="llm",
            ))

    return claims


# ---------------------------------------------------------------------------
# Stage 3b: Rule-based decomposition (always available)
# ---------------------------------------------------------------------------
def decompose_with_rules(
    sentences: list[dict],
    source_object_id: int,
) -> list[Claim]:
    """Rule-based claim extraction using spaCy dependency parsing.

    Splits compound sentences on coordinating conjunctions (and, but, or)
    that join independent clauses (both sides have a subject and verb).
    Simpler but always available in production.
    """
    claims = []

    for sent in sentences:
        if not is_assertion(sent["text"]):
            continue

        doc = nlp(sent["text"])

        # Check for coordinating conjunctions joining independent clauses
        split_points = []
        for token in doc:
            if token.dep_ == "cc" and token.text.lower() in ("and", "but"):
                # Check if the conjunct has its own subject
                conj_tokens = [t for t in token.head.conjuncts]
                for conj in conj_tokens:
                    has_subject = any(
                        child.dep_ in ("nsubj", "nsubjpass")
                        for child in conj.children
                    )
                    if has_subject:
                        split_points.append(token.idx)

        if split_points:
            # Split the sentence at conjunction boundaries
            text = sent["text"]
            parts = []
            prev = 0
            for sp in split_points:
                part = text[prev:sp].strip().rstrip(",")
                if part:
                    parts.append(part)
                prev = sp
            # Last segment (after the conjunction word)
            remaining = text[prev:].strip()
            # Skip the conjunction word itself
            for conj_word in ("and ", "but ", "or "):
                if remaining.lower().startswith(conj_word):
                    remaining = remaining[len(conj_word):]
                    break
            if remaining:
                parts.append(remaining)

            for part in parts:
                if is_assertion(part):
                    claims.append(Claim(
                        text=part,
                        source_object_id=source_object_id,
                        source_span=(sent["start"], sent["end"]),
                        extraction_method="rule",
                    ))
        else:
            # No split needed -- the sentence is already atomic
            claims.append(Claim(
                text=sent["text"],
                source_object_id=source_object_id,
                source_span=(sent["start"], sent["end"]),
                extraction_method="rule",
            ))

    return claims


# ---------------------------------------------------------------------------
# Main entry point: decompose_claims
# ---------------------------------------------------------------------------
def decompose_claims(
    text: str,
    source_object_id: int,
    prefer_llm: bool = True,
) -> list[Claim]:
    """Full claim decomposition pipeline.

    1. Split text into sentences (spaCy -- always available)
    2. Filter to assertions (rule-based -- always available)
    3. Decompose compound sentences into atomic claims
       - LLM path if available and preferred
       - Rule-based fallback otherwise

    Args:
        text: Raw text from an Object's body.
        source_object_id: ID of the source Object for provenance.
        prefer_llm: Use LLM decomposition when available (default True).

    Returns:
        List of Claim records with SHA-hash identity and provenance.
    """
    sentences = split_sentences(text)
    logger.info("Split text into %d sentences", len(sentences))

    if prefer_llm and _LLM_AVAILABLE:
        claims = decompose_with_llm(sentences, source_object_id)
        logger.info("LLM decomposition produced %d claims", len(claims))
    else:
        claims = decompose_with_rules(sentences, source_object_id)
        logger.info("Rule-based decomposition produced %d claims", len(claims))

    return claims


# ---------------------------------------------------------------------------
# Usage example
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    sample_text = """
    The Brooklyn Bridge was completed in 1883 and spans the East River.
    Its designer, John Roebling, died before construction finished.
    Was this the first suspension bridge? No, but it was the longest at
    the time. The cables use galvanized steel wire, and the towers are
    built from limestone and granite.
    """

    claims = decompose_claims(sample_text, source_object_id=42)

    print(f"\nExtracted {len(claims)} claims:\n")
    for i, claim in enumerate(claims, 1):
        print(f"  {i}. [{claim.extraction_method}] {claim.text}")
        print(f"     sha={claim.sha}  span={claim.source_span}")
        print()
