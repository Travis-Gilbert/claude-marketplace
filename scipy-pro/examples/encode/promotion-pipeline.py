"""
Promotion Pipeline Example
============================
Demonstrates the full promotion pipeline: how epistemic primitives move from
initial capture through review to canonical status, and optionally compile
into executable Methods.

Pipeline stages:
  captured -> parsed -> extracted -> reviewed -> promoted -> compiled -> learned from

Key concepts:
  - Architectural invariant #7: LLMs propose, humans review. Nothing auto-promotes.
  - Each stage has explicit entry/exit criteria
  - Queue mechanics: items wait in review queues until a human acts
  - Promotion creates provenance links to the review event
  - Compilation: canonical claims/patterns can become Method definitions
  - Learning: downstream systems observe promotions for retrieval tuning
"""

import hashlib
import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Promotion stages
# ---------------------------------------------------------------------------
class PromotionStage(Enum):
    """The lifecycle stages of an epistemic primitive.

    captured   -> Raw input. User typed it, API received it, file was uploaded.
    parsed     -> Structure extracted. Sentences split, entities detected.
    extracted  -> Claims, observations, patterns identified by LLM or rules.
    reviewed   -> A human has examined the extraction and approved/modified it.
    promoted   -> Merged into the canonical knowledge graph.
    compiled   -> Encoded as an executable Method (optional stage).
    """
    CAPTURED = "captured"
    PARSED = "parsed"
    EXTRACTED = "extracted"
    REVIEWED = "reviewed"
    PROMOTED = "promoted"
    COMPILED = "compiled"


# Valid transitions. Each stage can only advance to the next, or be
# sent back to EXTRACTED for re-extraction.
VALID_TRANSITIONS = {
    PromotionStage.CAPTURED: {PromotionStage.PARSED},
    PromotionStage.PARSED: {PromotionStage.EXTRACTED},
    PromotionStage.EXTRACTED: {PromotionStage.REVIEWED},
    PromotionStage.REVIEWED: {PromotionStage.PROMOTED, PromotionStage.EXTRACTED},
    PromotionStage.PROMOTED: {PromotionStage.COMPILED},
    PromotionStage.COMPILED: set(),  # terminal
}


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------
@dataclass
class PromotionEvent:
    """Records a stage transition for audit trail.
    Every promotion carries its provenance per architectural invariant #10."""
    item_sha: str
    from_stage: PromotionStage
    to_stage: PromotionStage
    actor: str            # "system" for automated, username for human review
    reason: str           # plain-English explanation of the decision
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: dict = field(default_factory=dict)


@dataclass
class ReviewItem:
    """An item waiting in the review queue."""
    sha: str
    item_type: str        # "claim", "tension", "method", "entity"
    content: dict         # the actual content to review
    stage: PromotionStage = PromotionStage.EXTRACTED
    priority: float = 0.5 # 0-1, higher = more urgent
    created_at: datetime = field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None
    reviewer: Optional[str] = None
    review_notes: str = ""
    events: list[PromotionEvent] = field(default_factory=list)

    def current_stage(self) -> PromotionStage:
        return self.stage


@dataclass
class ReviewDecision:
    """A human reviewer's decision on a review item."""
    action: str           # "approve", "reject", "modify", "defer"
    reviewer: str
    notes: str = ""
    modifications: Optional[dict] = None  # changes if action == "modify"


# ---------------------------------------------------------------------------
# Review Queue
# ---------------------------------------------------------------------------
class ReviewQueue:
    """Queue for items awaiting human review.

    Items enter the queue at the EXTRACTED stage. A human reviewer
    can approve (promote), reject (discard), modify (edit + promote),
    or defer (keep in queue) each item.
    """

    def __init__(self):
        self._queue: list[ReviewItem] = []
        self._events: list[PromotionEvent] = []

    def enqueue(self, item: ReviewItem):
        """Add an item to the review queue."""
        self._queue.append(item)
        self._record_event(item, PromotionStage.PARSED, PromotionStage.EXTRACTED,
                           actor="system", reason="Automated extraction complete")
        logger.info("Enqueued %s '%s' for review (priority=%.2f)",
                    item.item_type, item.sha, item.priority)

    def pending(self, item_type: Optional[str] = None) -> list[ReviewItem]:
        """Get items waiting for review, optionally filtered by type."""
        items = [
            item for item in self._queue
            if item.stage == PromotionStage.EXTRACTED
        ]
        if item_type:
            items = [i for i in items if i.item_type == item_type]
        return sorted(items, key=lambda i: i.priority, reverse=True)

    def review(self, item_sha: str, decision: ReviewDecision) -> ReviewItem:
        """Process a review decision on an item.

        This is the critical gate: LLMs propose, humans review (#7).
        """
        item = self._find_item(item_sha)
        if item is None:
            raise ValueError(f"Item {item_sha} not found in queue")

        if item.stage != PromotionStage.EXTRACTED:
            raise ValueError(
                f"Item {item_sha} is in stage {item.stage.value}, "
                f"expected EXTRACTED for review"
            )

        item.reviewed_at = datetime.utcnow()
        item.reviewer = decision.reviewer
        item.review_notes = decision.notes

        if decision.action == "approve":
            self._transition(item, PromotionStage.REVIEWED, decision)
            logger.info("Approved %s '%s'", item.item_type, item.sha)

        elif decision.action == "reject":
            # Rejected items stay at EXTRACTED but are marked
            item.review_notes = f"REJECTED: {decision.notes}"
            self._record_event(
                item, PromotionStage.EXTRACTED, PromotionStage.EXTRACTED,
                actor=decision.reviewer, reason=f"Rejected: {decision.notes}",
            )
            logger.info("Rejected %s '%s': %s", item.item_type, item.sha, decision.notes)

        elif decision.action == "modify":
            if decision.modifications:
                item.content.update(decision.modifications)
            self._transition(item, PromotionStage.REVIEWED, decision)
            logger.info("Modified and approved %s '%s'", item.item_type, item.sha)

        elif decision.action == "defer":
            logger.info("Deferred %s '%s': %s", item.item_type, item.sha, decision.notes)

        return item

    def _transition(self, item: ReviewItem, to_stage: PromotionStage,
                    decision: ReviewDecision):
        """Execute a stage transition with validation."""
        valid_targets = VALID_TRANSITIONS.get(item.stage, set())
        if to_stage not in valid_targets:
            raise ValueError(
                f"Invalid transition: {item.stage.value} -> {to_stage.value}"
            )
        from_stage = item.stage
        item.stage = to_stage
        self._record_event(item, from_stage, to_stage,
                           actor=decision.reviewer, reason=decision.notes)

    def _record_event(self, item: ReviewItem, from_stage: PromotionStage,
                      to_stage: PromotionStage, actor: str, reason: str):
        """Record a promotion event for the audit trail."""
        event = PromotionEvent(
            item_sha=item.sha,
            from_stage=from_stage,
            to_stage=to_stage,
            actor=actor,
            reason=reason,
        )
        item.events.append(event)
        self._events.append(event)

    def _find_item(self, sha: str) -> Optional[ReviewItem]:
        for item in self._queue:
            if item.sha == sha:
                return item
        return None


# ---------------------------------------------------------------------------
# Promotion: REVIEWED -> PROMOTED
# ---------------------------------------------------------------------------
def promote_to_canonical(
    item: ReviewItem,
    queue: ReviewQueue,
) -> ReviewItem:
    """Promote a reviewed item to canonical status.

    This merges the item into the canonical knowledge graph. In research_api:
      - Claims become canonical claims (epistemic_status='canonical')
      - Tensions become confirmed tensions
      - Entities become canonical entities (promoted from adaptive NER)
      - Methods move from draft to canonical

    Promotion creates an Edge linking the item to its review event.
    """
    if item.stage != PromotionStage.REVIEWED:
        raise ValueError(f"Cannot promote item in stage {item.stage.value}")

    decision = ReviewDecision(
        action="approve",
        reviewer="system",
        notes="Promoted to canonical after review approval",
    )
    queue._transition(item, PromotionStage.PROMOTED, decision)

    logger.info("Promoted %s '%s' to canonical", item.item_type, item.sha)
    return item


# ---------------------------------------------------------------------------
# Compilation: PROMOTED -> COMPILED (optional)
# ---------------------------------------------------------------------------
def compile_to_method(
    item: ReviewItem,
    queue: ReviewQueue,
    method_name: str,
) -> dict:
    """Optionally compile a promoted item into a Method definition.

    Only applicable to items that contain procedural knowledge.
    Creates a Method DSL JSON structure linked to the source item.
    """
    if item.stage != PromotionStage.PROMOTED:
        raise ValueError(f"Cannot compile item in stage {item.stage.value}")

    # Build a simple Method DSL from the item content
    method_json = {
        "method": method_name,
        "version": 1,
        "provenance": {
            "source_sha": item.sha,
            "source_type": item.item_type,
            "reviewed_by": item.reviewer,
            "promoted_at": item.reviewed_at.isoformat() if item.reviewed_at else None,
        },
        "steps": item.content.get("steps", []),
    }

    decision = ReviewDecision(
        action="approve",
        reviewer="system",
        notes=f"Compiled to Method '{method_name}'",
    )
    queue._transition(item, PromotionStage.COMPILED, decision)

    logger.info("Compiled %s '%s' to Method '%s'", item.item_type, item.sha, method_name)
    return method_json


# ---------------------------------------------------------------------------
# Learning signal: observe promotions for downstream tuning
# ---------------------------------------------------------------------------
def emit_learning_signal(item: ReviewItem):
    """Notify downstream systems that a promotion occurred.

    Learning signals from promotions feed:
      1. Retrieval learning: promoted items boost similar items' BM25/SBERT scores
      2. Knowledge learning: world model updates from confirmed claims
      3. Model training: fine-tune extraction models on reviewed examples

    In production, this queues an RQ task:
      emit_learning_signal.delay(item_sha=item.sha, stage=item.stage.value)
    """
    logger.info(
        "Learning signal: %s '%s' reached stage %s",
        item.item_type, item.sha, item.stage.value,
    )
    # In production:
    # from apps.research.tasks import emit_learning_signal
    # emit_learning_signal.delay(item_sha=item.sha, stage=item.stage.value)
    print(f"  [learning] Signal emitted for {item.item_type} {item.sha}")


# ---------------------------------------------------------------------------
# Usage example
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    queue = ReviewQueue()

    # Simulate the pipeline: a claim extracted from a source object
    claim_item = ReviewItem(
        sha="abc123def456",
        item_type="claim",
        content={
            "text": "Reinforced concrete has a compressive strength of 20-40 MPa.",
            "source_object_id": 42,
            "extraction_method": "llm",
            "confidence": 0.92,
        },
        priority=0.8,
    )

    # Stage 1-3: Automated (captured -> parsed -> extracted)
    queue.enqueue(claim_item)
    print(f"Item enqueued at stage: {claim_item.stage.value}")

    # Show pending review items
    pending = queue.pending("claim")
    print(f"\nPending review: {len(pending)} claims")
    for item in pending:
        print(f"  [{item.priority:.1f}] {item.sha}: {item.content['text'][:60]}...")

    # Stage 4: Human review
    decision = ReviewDecision(
        action="modify",
        reviewer="researcher_jane",
        notes="Corrected range based on EN 206 standard",
        modifications={"text": "Reinforced concrete typically has a compressive strength of 25-50 MPa (EN 206)."},
    )
    reviewed = queue.review(claim_item.sha, decision)
    print(f"\nAfter review: stage={reviewed.stage.value}, reviewer={reviewed.reviewer}")
    print(f"  Modified text: {reviewed.content['text']}")

    # Stage 5: Promote to canonical
    promoted = promote_to_canonical(reviewed, queue)
    print(f"\nAfter promotion: stage={promoted.stage.value}")
    emit_learning_signal(promoted)

    # Show full audit trail
    print(f"\nAudit trail ({len(promoted.events)} events):")
    for event in promoted.events:
        print(f"  {event.from_stage.value} -> {event.to_stage.value} "
              f"by {event.actor}: {event.reason}")
