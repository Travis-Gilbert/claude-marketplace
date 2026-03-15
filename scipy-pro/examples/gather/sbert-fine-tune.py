"""
SBERT Fine-Tuning Example
============================
Demonstrates fine-tuning a SentenceTransformer model on domain-specific
triplets for improved retrieval in the research_api knowledge graph.

Pipeline:
  load triplets -> configure SentenceTransformer training -> domain adaptation
  -> evaluate with Precision@k and MRR

Key concepts:
  - Domain adaptation: generic SBERT models miss domain-specific similarity
  - Triplet loss: learn to embed anchor closer to positive than negative
  - Two-mode: training runs on Modal (GPU), never in production
  - Evaluation: Precision@k and MRR on held-out pairs
  - Checkpoint management: save best model, track training history
"""

import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Two-mode import: sentence-transformers (dev/Modal only, never production)
# ---------------------------------------------------------------------------
try:
    from sentence_transformers import (
        SentenceTransformer,
        InputExample,
        losses,
        evaluation,
    )
    from torch.utils.data import DataLoader
    import numpy as np
    _TRAINING_AVAILABLE = True
except ImportError:
    _TRAINING_AVAILABLE = False


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------
@dataclass
class Triplet:
    """Training triplet: (anchor, positive, negative)."""
    anchor_text: str
    positive_text: str
    negative_text: str


@dataclass
class EvaluationResult:
    """Results from evaluating the fine-tuned model."""
    precision_at_1: float
    precision_at_5: float
    precision_at_10: float
    mrr: float              # Mean Reciprocal Rank
    num_queries: int
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def summary(self) -> str:
        return (
            f"P@1={self.precision_at_1:.3f}  P@5={self.precision_at_5:.3f}  "
            f"P@10={self.precision_at_10:.3f}  MRR={self.mrr:.3f}  "
            f"(n={self.num_queries})"
        )


@dataclass
class TrainingConfig:
    """Configuration for SBERT fine-tuning."""
    base_model: str = "all-MiniLM-L6-v2"
    output_dir: str = "models/sbert-domain"
    epochs: int = 3
    batch_size: int = 16
    warmup_ratio: float = 0.1
    learning_rate: float = 2e-5
    evaluation_steps: int = 100
    save_best_model: bool = True


# ---------------------------------------------------------------------------
# Stage 1: Load and prepare triplets
# ---------------------------------------------------------------------------
def load_triplets(
    triplet_data: list[dict],
    train_ratio: float = 0.8,
    seed: int = 42,
) -> tuple[list[Triplet], list[Triplet]]:
    """Load triplets and split into train/eval sets.

    Each triplet dict must have keys: anchor_text, positive_text, negative_text.
    """
    import random
    random.seed(seed)

    triplets = [
        Triplet(
            anchor_text=t["anchor_text"],
            positive_text=t["positive_text"],
            negative_text=t["negative_text"],
        )
        for t in triplet_data
    ]

    random.shuffle(triplets)
    split = int(len(triplets) * train_ratio)
    train = triplets[:split]
    eval_set = triplets[split:]

    logger.info("Loaded %d triplets: %d train, %d eval", len(triplets), len(train), len(eval_set))
    return train, eval_set


def triplets_to_input_examples(triplets: list[Triplet]) -> list:
    """Convert triplets to sentence-transformers InputExample format."""
    if not _TRAINING_AVAILABLE:
        return []

    return [
        InputExample(
            texts=[t.anchor_text, t.positive_text, t.negative_text]
        )
        for t in triplets
    ]


# ---------------------------------------------------------------------------
# Stage 2: Configure and run training
# ---------------------------------------------------------------------------
def train_model(
    train_triplets: list[Triplet],
    eval_triplets: list[Triplet],
    config: TrainingConfig,
) -> Optional[str]:
    """Fine-tune a SentenceTransformer model on domain triplets.

    Uses TripletLoss with cosine distance. The model learns to embed
    anchors closer to positives and farther from negatives.

    This function should run on Modal (GPU) or locally with GPU.
    It must never run in production (Railway).

    Returns the path to the saved model.
    """
    if not _TRAINING_AVAILABLE:
        logger.error("Training not available: install sentence-transformers and torch")
        return None

    # Safety check: never train in production
    if os.getenv("RAILWAY_ENVIRONMENT"):
        raise RuntimeError("Model training must not run in production (Railway)")

    logger.info("Loading base model: %s", config.base_model)
    model = SentenceTransformer(config.base_model)

    # Prepare training data
    train_examples = triplets_to_input_examples(train_triplets)
    train_dataloader = DataLoader(
        train_examples,
        shuffle=True,
        batch_size=config.batch_size,
    )

    # Configure loss function
    train_loss = losses.TripletLoss(
        model=model,
        distance_metric=losses.TripletDistanceMetric.COSINE,
        triplet_margin=0.5,  # minimum distance between pos and neg
    )

    # Configure evaluator from eval triplets
    evaluator = _build_evaluator(model, eval_triplets) if eval_triplets else None

    # Calculate warmup steps
    total_steps = len(train_dataloader) * config.epochs
    warmup_steps = int(total_steps * config.warmup_ratio)

    logger.info(
        "Training: %d examples, %d epochs, batch_size=%d, warmup=%d steps",
        len(train_examples), config.epochs, config.batch_size, warmup_steps,
    )

    # Create output directory
    os.makedirs(config.output_dir, exist_ok=True)

    # Train
    model.fit(
        train_objectives=[(train_dataloader, train_loss)],
        epochs=config.epochs,
        warmup_steps=warmup_steps,
        evaluator=evaluator,
        evaluation_steps=config.evaluation_steps,
        output_path=config.output_dir if config.save_best_model else None,
        show_progress_bar=True,
    )

    # Save training metadata
    metadata = {
        "base_model": config.base_model,
        "epochs": config.epochs,
        "train_triplets": len(train_triplets),
        "eval_triplets": len(eval_triplets),
        "completed_at": datetime.utcnow().isoformat(),
    }
    metadata_path = os.path.join(config.output_dir, "training_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    logger.info("Model saved to %s", config.output_dir)
    return config.output_dir


def _build_evaluator(model, eval_triplets: list[Triplet]):
    """Build a TripletEvaluator from eval triplets."""
    anchors = [t.anchor_text for t in eval_triplets]
    positives = [t.positive_text for t in eval_triplets]
    negatives = [t.negative_text for t in eval_triplets]

    return evaluation.TripletEvaluator(
        anchors=anchors,
        positives=positives,
        negatives=negatives,
        name="domain-eval",
    )


# ---------------------------------------------------------------------------
# Stage 3: Evaluate with Precision@k and MRR
# ---------------------------------------------------------------------------
def evaluate_model(
    model_path: str,
    eval_pairs: list[tuple[str, str, list[str]]],
) -> Optional[EvaluationResult]:
    """Evaluate the fine-tuned model on retrieval quality.

    Each eval item is (query, relevant_doc, corpus_docs).
    Measures how well the model ranks the relevant doc among the corpus.

    Metrics:
      - Precision@k: fraction of top-k results that are relevant
      - MRR: reciprocal of the rank of the first relevant result
    """
    if not _TRAINING_AVAILABLE:
        logger.error("Evaluation not available: install sentence-transformers")
        return None

    model = SentenceTransformer(model_path)

    reciprocal_ranks = []
    precision_at = {1: [], 5: [], 10: []}

    for query, relevant_doc, corpus in eval_pairs:
        # Encode query and corpus
        query_emb = model.encode([query], normalize_embeddings=True)
        corpus_embs = model.encode(corpus, normalize_embeddings=True)

        # Compute similarities
        similarities = np.dot(corpus_embs, query_emb.T).flatten()

        # Rank corpus documents by similarity
        ranked_indices = np.argsort(similarities)[::-1]

        # Find rank of the relevant document
        relevant_idx = corpus.index(relevant_doc) if relevant_doc in corpus else -1
        if relevant_idx == -1:
            continue

        rank = list(ranked_indices).index(relevant_idx) + 1
        reciprocal_ranks.append(1.0 / rank)

        # Precision@k
        for k in precision_at:
            top_k = set(ranked_indices[:k])
            precision_at[k].append(1.0 if relevant_idx in top_k else 0.0)

    if not reciprocal_ranks:
        return None

    result = EvaluationResult(
        precision_at_1=sum(precision_at[1]) / len(precision_at[1]),
        precision_at_5=sum(precision_at[5]) / len(precision_at[5]),
        precision_at_10=sum(precision_at[10]) / len(precision_at[10]),
        mrr=sum(reciprocal_ranks) / len(reciprocal_ranks),
        num_queries=len(reciprocal_ranks),
    )

    logger.info("Evaluation: %s", result.summary())
    return result


# ---------------------------------------------------------------------------
# Usage example
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Simulate triplet data (in practice, from triplet-construction.py)
    triplet_data = [
        {
            "anchor_text": "Reinforced concrete uses steel rebar to resist tensile forces.",
            "positive_text": "Prestressed concrete uses pre-tensioned steel tendons for strength.",
            "negative_text": "Gothic architecture features pointed arches and ribbed vaults.",
        },
        {
            "anchor_text": "Steel framing distributes loads through beam-column connections.",
            "positive_text": "Reinforced concrete transfers loads through slab-column interfaces.",
            "negative_text": "Carbon fiber composites are used in aerospace applications.",
        },
        {
            "anchor_text": "Brutalism prominently features exposed raw concrete surfaces.",
            "positive_text": "Le Corbusier used beton brut as an expressive material.",
            "negative_text": "Timber engineering uses cross-laminated timber panels.",
        },
        {
            "anchor_text": "Load distribution in masonry follows compressive stress paths.",
            "positive_text": "Arches and vaults transfer loads through compression.",
            "negative_text": "Machine learning models require large training datasets.",
        },
    ]

    if _TRAINING_AVAILABLE:
        train_triplets, eval_triplets = load_triplets(triplet_data, train_ratio=0.75)

        config = TrainingConfig(
            base_model="all-MiniLM-L6-v2",
            output_dir="/tmp/sbert-domain-test",
            epochs=1,
            batch_size=2,
        )

        model_path = train_model(train_triplets, eval_triplets, config)

        if model_path:
            print(f"\nModel saved to: {model_path}")

            # Quick evaluation
            eval_pairs = [
                (
                    "concrete reinforcement methods",
                    "Reinforced concrete uses steel rebar to resist tensile forces.",
                    [
                        "Reinforced concrete uses steel rebar to resist tensile forces.",
                        "Gothic architecture features pointed arches and ribbed vaults.",
                        "Carbon fiber composites are used in aerospace applications.",
                        "Timber engineering uses cross-laminated timber panels.",
                    ],
                ),
            ]

            result = evaluate_model(model_path, eval_pairs)
            if result:
                print(f"Evaluation: {result.summary()}")
    else:
        print("Training not available. Install sentence-transformers and torch.")
        print("This example is designed to run locally or on Modal, not in production.")

        # Show what would happen
        train_triplets, eval_triplets = load_triplets(triplet_data, train_ratio=0.75)
        print(f"\nWould train on {len(train_triplets)} triplets")
        print(f"Would evaluate on {len(eval_triplets)} triplets")
        print(f"\nSample triplet:")
        t = train_triplets[0]
        print(f"  Anchor:   {t.anchor_text[:60]}...")
        print(f"  Positive: {t.positive_text[:60]}...")
        print(f"  Negative: {t.negative_text[:60]}...")
