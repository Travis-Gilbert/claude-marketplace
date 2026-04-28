"""
Learned Scorer Training Pipeline

Demonstrates the full Level 2 training workflow: load ConnectionFeedback
records from the database, construct a feature matrix, train a
GradientBoostingClassifier with 5-fold cross-validation, log feature
importances, save the model via joblib, and run the IQ Tracker before
and after training to measure improvement.

This is the core feedback loop that makes Index smarter over time.
User engagement signals become training labels, the model learns which
signal combinations predict real connections, and the IQ Tracker
confirms that learned scoring outperforms fixed weights.

Two-mode note: scikit-learn ships in Railway production, so this
pipeline runs everywhere. No PyTorch dependency.
"""

import logging
import os
import sys
from pathlib import Path

import django
import joblib
import numpy as np

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "research_api.settings")
django.setup()

from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import cross_val_score

from apps.notebook.models import ConnectionFeedback

logger = logging.getLogger("theseus.train.scorer")

# Feature names correspond to the engine pass outputs captured at
# connection-display time. Order matters -- it must match the order
# used during inference in learned_scorer.py.
FEATURE_NAMES = [
    "sbert_cosine",
    "bm25_score",
    "jaccard_coefficient",
    "shared_entity_count",
    "nli_entailment_score",
    "nli_contradiction_score",
    "kge_prediction_score",
    "same_object_type",
    "same_notebook",
    "time_gap_days",
    "source_word_count",
    "target_word_count",
    "source_edge_count",
    "target_edge_count",
    "shared_cluster",
    "web_validation_score",
]

# Labels that indicate a useful connection vs noise.
POSITIVE_LABELS = {"engaged", "manual", "web_validated"}
NEGATIVE_LABELS = {"dismissed", "ignored", "web_unvalidated"}

LEARNED_SCORER_PATH = Path("models/learned_scorer.joblib")


def load_feedback_records():
    """Load all ConnectionFeedback records and build X, y, sample_weight."""
    records = ConnectionFeedback.objects.all().values(
        "feature_vector", "label", "label_strength"
    )

    X, y, weights = [], [], []
    skipped = 0

    for record in records:
        fv = record["feature_vector"]
        if not fv:
            skipped += 1
            continue

        # Extract features in canonical order, replacing missing with NaN.
        row = [fv.get(name, np.nan) for name in FEATURE_NAMES]
        X.append(row)

        # Binary label: positive -> 1.0, negative -> 0.0
        y.append(1.0 if record["label"] in POSITIVE_LABELS else 0.0)
        weights.append(record["label_strength"])

    logger.info("Loaded %d feedback records (%d skipped, no features)", len(X), skipped)
    return np.array(X), np.array(y), np.array(weights)


def run_iq_tracker():
    """Run the IQ Tracker and return the composite score.

    In production this calls the management command. Here we import
    directly for programmatic access.
    """
    try:
        from apps.notebook.iq_tracker import measure_all_axes

        scores = measure_all_axes()
        composite = sum(
            scores[axis] * weight
            for axis, weight in [
                ("discovery", 0.20), ("organization", 0.15),
                ("tension", 0.15), ("lineage", 0.10),
                ("retrieval", 0.15), ("ingestion", 0.10),
                ("learning", 0.15),
            ]
        )
        return {"axes": scores, "composite": round(composite, 2)}
    except ImportError:
        logger.warning("IQ Tracker not available -- skipping measurement")
        return None


def train_scorer():
    """Full training pipeline with cross-validation and IQ measurement."""
    # -- Step 1: Measure IQ before training --
    iq_before = run_iq_tracker()
    if iq_before:
        logger.info("IQ before training: %.1f", iq_before["composite"])

    # -- Step 2: Load data --
    X, y, sample_weight = load_feedback_records()

    if len(X) < 50:
        logger.warning(
            "Only %d feedback records. Need >= 50 for training. "
            "Falling back to fixed weights.", len(X)
        )
        return None

    # -- Step 3: Train with 5-fold cross-validation --
    model = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        min_samples_leaf=5,
        random_state=42,
    )

    cv_scores = cross_val_score(
        model, X, y,
        cv=5,
        scoring="accuracy",
        fit_params={"sample_weight": sample_weight},
    )
    logger.info("5-fold CV accuracy: %.3f (+/- %.3f)", cv_scores.mean(), cv_scores.std())

    # -- Step 4: Train final model on all data --
    model.fit(X, y, sample_weight=sample_weight)

    # -- Step 5: Log feature importances --
    importances = model.feature_importances_
    logger.info("Feature importances:")
    for name, imp in sorted(
        zip(FEATURE_NAMES, importances), key=lambda x: -x[1]
    ):
        logger.info("  %-28s %.4f", name, imp)

    # -- Step 6: Save model --
    LEARNED_SCORER_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, LEARNED_SCORER_PATH)
    logger.info("Model saved to %s", LEARNED_SCORER_PATH)

    # -- Step 7: Measure IQ after training --
    iq_after = run_iq_tracker()
    if iq_before and iq_after:
        delta = iq_after["composite"] - iq_before["composite"]
        logger.info(
            "IQ after training: %.1f (delta: %+.1f)",
            iq_after["composite"], delta,
        )
        if delta < 0:
            logger.warning(
                "IQ DECREASED by %.1f points. Investigate before deploying.",
                abs(delta),
            )

    return model


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    model = train_scorer()
    if model is None:
        sys.exit(1)
    print("\nTraining complete. Model ready for inference.")
