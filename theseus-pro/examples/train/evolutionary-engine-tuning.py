"""
Evolutionary Engine Tuning with NSGA-II

Demonstrates multi-objective optimization of engine hyperparameters
using the DEAP library's NSGA-II algorithm. The genome encodes engine
configuration parameters (thresholds, weights, decay rates), and the
IQ Tracker's seven-axis scores serve as the multi-objective fitness
function.

NSGA-II finds the Pareto frontier: configurations where no IQ axis
can be improved without degrading another. This captures parameter
interactions that grid search misses -- for example, raising the
SBERT threshold only helps when BM25 k1 is also high.

Two-mode note: evolution runs against a staging corpus snapshot,
never against production data. The resulting Pareto-optimal configs
are reviewed by a human before deployment (Invariant #7).
"""

import json
import logging
import os
import random
import sys

import django
import numpy as np

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "research_api.settings")
django.setup()

from deap import algorithms, base, creator, tools

logger = logging.getLogger("theseus.train.evolution")

# Each gene defines a tunable engine parameter with its valid range.
# These correspond to fields in Notebook.engine_config.
GENOME_SPEC = {
    "sbert_threshold":            (0.20, 0.60),
    "bm25_k1":                    (1.00, 2.50),
    "bm25_b":                     (0.50, 1.00),
    "nli_confidence_cutoff":      (0.50, 0.90),
    "kge_threshold":              (0.30, 0.70),
    "decay_half_life_days":       (30.0, 180.0),
    "community_resolution":       (0.50, 2.00),
    "entity_promotion_threshold": (3.00, 15.0),
    "jaccard_threshold":          (0.10, 0.40),
    "max_edges_per_object":       (5.00, 50.0),
    "web_validation_weight":      (0.00, 1.00),
}

GENE_NAMES = list(GENOME_SPEC.keys())
GENE_BOUNDS = list(GENOME_SPEC.values())
N_GENES = len(GENE_NAMES)

# NSGA-II optimizes 7 objectives (one per IQ axis).
N_OBJECTIVES = 7
IQ_AXES = [
    "discovery", "organization", "tension", "lineage",
    "retrieval", "ingestion", "learning",
]


def genome_to_config(individual):
    """Convert a DEAP individual (list of floats) to an engine config dict."""
    config = {}
    for i, name in enumerate(GENE_NAMES):
        lo, hi = GENE_BOUNDS[i]
        # Clamp to valid range after crossover/mutation.
        config[name] = max(lo, min(hi, individual[i]))
    return config


def evaluate_fitness(individual):
    """Apply an engine config and measure IQ across all 7 axes.

    This is the fitness function. Each evaluation:
    1. Applies the candidate config to a staging notebook
    2. Runs the engine on a test corpus
    3. Measures IQ scores via the tracker
    4. Returns a 7-tuple of axis scores (all maximized)
    """
    config = genome_to_config(individual)

    try:
        from apps.notebook.iq_tracker import measure_all_axes
        from apps.notebook.engine import run_engine

        # Apply config to staging notebook (never production).
        staging_notebook_id = os.environ.get("STAGING_NOTEBOOK_ID")
        if not staging_notebook_id:
            logger.warning("No STAGING_NOTEBOOK_ID set -- using mock scores")
            return tuple(random.uniform(20, 80) for _ in IQ_AXES)

        from apps.notebook.models import Notebook
        notebook = Notebook.objects.get(id=staging_notebook_id)
        notebook.engine_config.update(config)
        notebook.save()

        # Run engine on test corpus.
        run_engine(notebook_id=int(staging_notebook_id))

        # Measure IQ.
        scores = measure_all_axes()
        return tuple(scores.get(axis, 0.0) for axis in IQ_AXES)

    except ImportError:
        # Fallback: synthetic fitness for demonstration.
        logger.warning("Engine not available -- using synthetic fitness")
        base_scores = [45, 15, 20, 35, 50, 55, 0]
        noise = [random.gauss(0, 5) for _ in base_scores]
        return tuple(max(0, min(100, b + n)) for b, n in zip(base_scores, noise))


def setup_deap():
    """Configure DEAP's NSGA-II toolbox."""
    # Multi-objective: maximize all 7 IQ axes.
    creator.create("FitnessMulti", base.Fitness, weights=(1.0,) * N_OBJECTIVES)
    creator.create("Individual", list, fitness=creator.FitnessMulti)

    toolbox = base.Toolbox()

    # Gene initialization: uniform random within bounds.
    def init_gene(i):
        lo, hi = GENE_BOUNDS[i]
        return random.uniform(lo, hi)

    def init_individual():
        return creator.Individual(init_gene(i) for i in range(N_GENES))

    toolbox.register("individual", init_individual)
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)
    toolbox.register("evaluate", evaluate_fitness)

    # Crossover: simulated binary (good for real-valued parameters).
    toolbox.register("mate", tools.cxSimulatedBinaryBounded,
                     low=[b[0] for b in GENE_BOUNDS],
                     up=[b[1] for b in GENE_BOUNDS], eta=20.0)

    # Mutation: polynomial bounded.
    toolbox.register("mutate", tools.mutPolynomialBounded,
                     low=[b[0] for b in GENE_BOUNDS],
                     up=[b[1] for b in GENE_BOUNDS],
                     eta=20.0, indpb=1.0 / N_GENES)

    # Selection: NSGA-II non-dominated sorting.
    toolbox.register("select", tools.selNSGA2)

    return toolbox


def extract_pareto_front(population):
    """Extract the Pareto-optimal individuals from the final population."""
    pareto = tools.sortNondominated(population, len(population), first_front_only=True)[0]
    results = []
    for ind in pareto:
        config = genome_to_config(ind)
        scores = dict(zip(IQ_AXES, ind.fitness.values))
        composite = sum(
            scores[a] * w for a, w in zip(
                IQ_AXES, [0.20, 0.15, 0.15, 0.10, 0.15, 0.10, 0.15]
            )
        )
        results.append({
            "config": config,
            "iq_scores": scores,
            "composite": round(composite, 2),
        })
    return sorted(results, key=lambda r: -r["composite"])


def run_evolution(pop_size=40, n_generations=25):
    """Run NSGA-II and return Pareto-optimal engine configurations."""
    toolbox = setup_deap()
    population = toolbox.population(n=pop_size)

    # Evaluate initial population.
    fitnesses = list(map(toolbox.evaluate, population))
    for ind, fit in zip(population, fitnesses):
        ind.fitness.values = fit

    logger.info("Generation  0 | Best composite: %.1f",
                max(sum(f) / N_OBJECTIVES for f in fitnesses))

    # Evolve.
    for gen in range(1, n_generations + 1):
        offspring = algorithms.varAnd(population, toolbox, cxpb=0.7, mutpb=0.2)

        # Evaluate offspring.
        invalid = [ind for ind in offspring if not ind.fitness.valid]
        fitnesses = list(map(toolbox.evaluate, invalid))
        for ind, fit in zip(invalid, fitnesses):
            ind.fitness.values = fit

        # NSGA-II selection.
        population = toolbox.select(population + offspring, pop_size)

        best = max(population, key=lambda ind: sum(ind.fitness.values))
        logger.info("Generation %2d | Best composite: %.1f",
                    gen, sum(best.fitness.values) / N_OBJECTIVES)

    # Extract and report Pareto front.
    pareto = extract_pareto_front(population)
    logger.info("\nPareto front: %d configurations", len(pareto))
    for i, result in enumerate(pareto[:5]):
        logger.info("  Config %d (composite %.1f):", i + 1, result["composite"])
        for axis, score in result["iq_scores"].items():
            logger.info("    %-15s %.1f", axis, score)

    return pareto


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    random.seed(42)

    pareto = run_evolution()

    # Save results for human review (Invariant #7).
    os.makedirs("models", exist_ok=True)
    with open("models/pareto_configs.json", "w") as f:
        json.dump(pareto, f, indent=2)

    print(f"\n{len(pareto)} Pareto-optimal configs saved to models/pareto_configs.json")
    print("Review before deploying to production.")
