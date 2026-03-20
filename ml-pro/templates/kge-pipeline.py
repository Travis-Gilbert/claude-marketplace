"""
Knowledge Graph Embedding Pipeline (PyKEEN)
=============================================
Train and evaluate KGE models for link prediction / KG completion.
"""

from pathlib import Path

from pykeen.pipeline import pipeline
from pykeen.triples import TriplesFactory


def train_kge(
    triples_path: str = "triples.tsv",
    model_name: str = "RotatE",
    embedding_dim: int = 200,
    num_epochs: int = 200,
    batch_size: int = 256,
    lr: float = 1e-3,
    num_negs: int = 128,
    output_dir: str = "kge_output",
    test_ratio: float = 0.2,
    val_ratio: float = 0.1,
):
    """
    Train a KGE model on a triple file.

    Triple file format (TSV, no header):
        head_entity\trelation\ttail_entity
    """
    # Load triples
    tf = TriplesFactory.from_path(
        triples_path,
        create_inverse_triples=True,
    )
    print(f"Entities: {tf.num_entities}, Relations: {tf.num_relations}, "
          f"Triples: {tf.num_triples}")

    # Split
    train, rest = tf.split([1 - test_ratio - val_ratio,
                             test_ratio + val_ratio],
                            random_state=42)
    val_ratio_adj = val_ratio / (test_ratio + val_ratio)
    val, test = rest.split([val_ratio_adj, 1 - val_ratio_adj],
                            random_state=42)

    print(f"Train: {train.num_triples}, Val: {val.num_triples}, "
          f"Test: {test.num_triples}")

    # Train
    result = pipeline(
        training=train,
        validation=val,
        testing=test,
        model=model_name,
        model_kwargs=dict(embedding_dim=embedding_dim),
        optimizer="Adam",
        optimizer_kwargs=dict(lr=lr),
        training_kwargs=dict(
            num_epochs=num_epochs,
            batch_size=batch_size,
            checkpoint_name="best.pt",
            checkpoint_directory=output_dir,
        ),
        negative_sampler="basic",
        negative_sampler_kwargs=dict(num_negs_per_pos=num_negs),
        evaluator_kwargs=dict(filtered=True),
        random_seed=42,
    )

    # Results
    print("\n=== Test Results ===")
    metrics = result.metric_results
    mrr = metrics.get_metric("both.realistic.inverse_harmonic_mean_rank")
    h1 = metrics.get_metric("both.realistic.hits_at_1")
    h3 = metrics.get_metric("both.realistic.hits_at_3")
    h10 = metrics.get_metric("both.realistic.hits_at_10")
    print(f"MRR:     {mrr:.4f}")
    print(f"Hits@1:  {h1:.4f}")
    print(f"Hits@3:  {h3:.4f}")
    print(f"Hits@10: {h10:.4f}")

    # Save
    result.save_to_directory(output_dir)
    print(f"\nModel saved to {output_dir}/")

    return result


def predict_links(
    model_dir: str,
    head: str = None,
    relation: str = None,
    tail: str = None,
    top_k: int = 10,
):
    """
    Predict missing links. Provide two of three (head, relation, tail).
    Returns top_k predictions for the missing element.
    """
    from pykeen.models import Model
    import torch

    model = torch.load(Path(model_dir) / "trained_model.pkl")
    # Use model.predict_* methods from PyKEEN
    # This is task-specific; adapt as needed
    pass


if __name__ == "__main__":
    # Example: train RotatE on a triples file
    train_kge(
        triples_path="triples.tsv",
        model_name="RotatE",
        embedding_dim=200,
        num_epochs=200,
        batch_size=256,
        lr=1e-3,
    )
