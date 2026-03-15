"""
Influence DAG Construction Example
====================================
Demonstrates how to build a directed acyclic graph (DAG) of causal influence
from temporal object relationships: filter support/entailment edges by temporal
precedence, build a DAG, prune redundant paths, and trace lineage.

Pipeline:
  Objects with timestamps -> filter temporal edges -> build directed graph
  -> verify acyclicity -> prune transitive edges -> trace ancestors/descendants

Key concepts:
  - Temporal precedence: earlier objects can influence later ones, not vice versa
  - Support and entailment edges imply influence relationships
  - DAG construction ensures no causal cycles
  - Transitive reduction removes redundant paths
  - Lineage tracing: who influenced whom, and through what chain
"""

import logging
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

import networkx as nx

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------
@dataclass
class Object:
    id: int
    title: str
    created_at: datetime
    object_type: str = "note"

    def __repr__(self):
        return f"Object({self.id}, '{self.title}')"


@dataclass
class Edge:
    """Uses from_object/to_object per architectural invariant #2.
    Edge.reason is a plain-English sentence per invariant #1."""
    id: int
    from_object_id: int
    to_object_id: int
    edge_type: str
    reason: str
    strength: float = 1.0
    created_at: datetime = None


# Edge types that imply causal/influence relationships
INFLUENCE_EDGE_TYPES = {
    "support",       # A provides evidence for B
    "entailment",    # A logically entails B
    "derived_from",  # B was derived from A
    "inspired_by",   # B was inspired by A
    "builds_on",     # B builds on A's ideas
}


# ---------------------------------------------------------------------------
# Stage 1: Filter edges for influence relationships with temporal precedence
# ---------------------------------------------------------------------------
def filter_influence_edges(
    objects: list[Object],
    edges: list[Edge],
) -> list[tuple[int, int, dict]]:
    """Filter to edges that represent influence and respect temporal order.

    An influence edge from A to B is valid only if:
      1. The edge type implies influence (support, entailment, etc.)
      2. Object A was created before Object B (temporal precedence)

    If the temporal order is reversed, we flip the direction: the earlier
    object is the influencer.
    """
    obj_map = {o.id: o for o in objects}
    influence_edges = []

    for edge in edges:
        if edge.edge_type not in INFLUENCE_EDGE_TYPES:
            continue

        obj_from = obj_map.get(edge.from_object_id)
        obj_to = obj_map.get(edge.to_object_id)
        if not obj_from or not obj_to:
            continue

        metadata = {
            "edge_type": edge.edge_type,
            "reason": edge.reason,
            "strength": edge.strength,
        }

        # Enforce temporal precedence: earlier -> later
        if obj_from.created_at <= obj_to.created_at:
            influence_edges.append((edge.from_object_id, edge.to_object_id, metadata))
        else:
            # Flip direction: the earlier object is the influencer
            logger.debug(
                "Flipping edge %d: %s (later) -> %s (earlier)",
                edge.id, obj_from.title, obj_to.title,
            )
            influence_edges.append((edge.to_object_id, edge.from_object_id, metadata))

    logger.info("Filtered %d influence edges from %d total", len(influence_edges), len(edges))
    return influence_edges


# ---------------------------------------------------------------------------
# Stage 2: Build directed graph and verify acyclicity
# ---------------------------------------------------------------------------
def build_influence_dag(
    objects: list[Object],
    influence_edges: list[tuple[int, int, dict]],
) -> nx.DiGraph:
    """Construct a directed graph from influence edges and verify it is a DAG.

    If cycles are detected (which shouldn't happen with temporal precedence
    but can occur from data errors), we break them by removing the weakest
    edge in each cycle.
    """
    G = nx.DiGraph()

    # Add nodes with metadata
    for obj in objects:
        G.add_node(obj.id, title=obj.title, created_at=obj.created_at)

    # Add directed edges
    for src, dst, metadata in influence_edges:
        G.add_edge(src, dst, **metadata)

    # Verify acyclicity
    if not nx.is_directed_acyclic_graph(G):
        logger.warning("Cycle detected in influence graph -- breaking weak edges")
        G = _break_cycles(G)

    logger.info("Influence DAG: %d nodes, %d edges", G.number_of_nodes(), G.number_of_edges())
    return G


def _break_cycles(G: nx.DiGraph) -> nx.DiGraph:
    """Break cycles by removing the weakest edge in each cycle.
    This is a safety net for data errors; temporal precedence should
    prevent cycles in well-formed data."""
    while not nx.is_directed_acyclic_graph(G):
        cycle = nx.find_cycle(G)
        # Find the weakest edge in the cycle
        weakest_edge = min(
            cycle,
            key=lambda e: G[e[0]][e[1]].get("strength", 1.0),
        )
        logger.warning(
            "Breaking cycle: removing edge %d -> %d (strength=%.2f)",
            weakest_edge[0], weakest_edge[1],
            G[weakest_edge[0]][weakest_edge[1]].get("strength", 1.0),
        )
        G.remove_edge(weakest_edge[0], weakest_edge[1])
    return G


# ---------------------------------------------------------------------------
# Stage 3: Prune redundant (transitive) edges
# ---------------------------------------------------------------------------
def prune_transitive_edges(G: nx.DiGraph) -> nx.DiGraph:
    """Apply transitive reduction to remove redundant paths.

    If A -> B -> C and A -> C, the direct edge A -> C is redundant because
    the influence is already captured by the A -> B -> C path. Removing it
    makes the DAG cleaner without losing any reachability information.

    The original edges are preserved in a 'pruned_edges' attribute on the graph.
    """
    original_edge_count = G.number_of_edges()
    reduced = nx.transitive_reduction(G)

    # Copy node and edge attributes from original
    reduced.add_nodes_from(G.nodes(data=True))
    for u, v in reduced.edges():
        if G.has_edge(u, v):
            reduced[u][v].update(G[u][v])

    pruned_count = original_edge_count - reduced.number_of_edges()
    logger.info("Pruned %d transitive edges (%d -> %d)",
                pruned_count, original_edge_count, reduced.number_of_edges())

    return reduced


# ---------------------------------------------------------------------------
# Stage 4: Trace lineage (ancestors and descendants)
# ---------------------------------------------------------------------------
def trace_ancestors(G: nx.DiGraph, node_id: int) -> list[dict]:
    """Find all objects that influenced the given node, with paths.

    Returns ancestors sorted by distance (closest influencers first).
    Each entry includes the influence chain (path from ancestor to node).
    """
    if node_id not in G:
        return []

    ancestors = nx.ancestors(G, node_id)
    results = []

    for anc_id in ancestors:
        # Find shortest path (influence chain)
        path = nx.shortest_path(G, anc_id, node_id)
        distance = len(path) - 1

        # Collect reasons along the path
        reasons = []
        for i in range(len(path) - 1):
            edge_data = G[path[i]][path[i + 1]]
            reasons.append(edge_data.get("reason", ""))

        results.append({
            "ancestor_id": anc_id,
            "ancestor_title": G.nodes[anc_id].get("title", ""),
            "distance": distance,
            "path": path,
            "reasons": reasons,
        })

    results.sort(key=lambda r: r["distance"])
    return results


def trace_descendants(G: nx.DiGraph, node_id: int) -> list[dict]:
    """Find all objects influenced by the given node."""
    if node_id not in G:
        return []

    descendants = nx.descendants(G, node_id)
    results = []

    for desc_id in descendants:
        path = nx.shortest_path(G, node_id, desc_id)
        distance = len(path) - 1

        reasons = []
        for i in range(len(path) - 1):
            edge_data = G[path[i]][path[i + 1]]
            reasons.append(edge_data.get("reason", ""))

        results.append({
            "descendant_id": desc_id,
            "descendant_title": G.nodes[desc_id].get("title", ""),
            "distance": distance,
            "path": path,
            "reasons": reasons,
        })

    results.sort(key=lambda r: r["distance"])
    return results


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------
def build_influence_lineage(
    objects: list[Object],
    edges: list[Edge],
    prune: bool = True,
) -> dict:
    """Full influence DAG pipeline.

    1. Filter edges for influence relationships with temporal precedence
    2. Build directed acyclic graph
    3. Optionally prune transitive (redundant) edges
    4. Return the DAG with lineage tracing functions
    """
    influence_edges = filter_influence_edges(objects, edges)
    dag = build_influence_dag(objects, influence_edges)

    if prune:
        dag = prune_transitive_edges(dag)

    # Compute topological order (earliest influencers first)
    topo_order = list(nx.topological_sort(dag))

    return {
        "dag": dag,
        "node_count": dag.number_of_nodes(),
        "edge_count": dag.number_of_edges(),
        "topological_order": topo_order,
        "roots": [n for n in dag if dag.in_degree(n) == 0],
        "leaves": [n for n in dag if dag.out_degree(n) == 0],
    }


# ---------------------------------------------------------------------------
# Usage example
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    from datetime import timedelta

    base = datetime(2024, 1, 1)

    objects = [
        Object(id=1, title="Seminal Paper on Load Distribution",
               created_at=base),
        Object(id=2, title="Response Paper: Alternative Model",
               created_at=base + timedelta(days=30)),
        Object(id=3, title="Experimental Results Supporting Alternative",
               created_at=base + timedelta(days=60)),
        Object(id=4, title="Synthesis: Unified Load Model",
               created_at=base + timedelta(days=90)),
        Object(id=5, title="Field Study Validating Unified Model",
               created_at=base + timedelta(days=120)),
    ]

    edges = [
        Edge(id=1, from_object_id=1, to_object_id=2, edge_type="support",
             reason="The response paper directly cites and builds on the seminal paper."),
        Edge(id=2, from_object_id=2, to_object_id=3, edge_type="support",
             reason="Experimental results test the alternative model's predictions."),
        Edge(id=3, from_object_id=1, to_object_id=4, edge_type="support",
             reason="The synthesis incorporates the seminal paper's framework."),
        Edge(id=4, from_object_id=3, to_object_id=4, edge_type="support",
             reason="The synthesis integrates the experimental findings."),
        Edge(id=5, from_object_id=4, to_object_id=5, edge_type="derived_from",
             reason="The field study applies the unified model in practice."),
        # Redundant transitive edge (will be pruned)
        Edge(id=6, from_object_id=1, to_object_id=5, edge_type="support",
             reason="The field study traces back to the seminal paper's concepts.",
             strength=0.3),
    ]

    result = build_influence_lineage(objects, edges, prune=True)

    print(f"Influence DAG: {result['node_count']} nodes, {result['edge_count']} edges")
    print(f"Roots (original influencers): {result['roots']}")
    print(f"Leaves (terminal influenced): {result['leaves']}")
    print(f"Topological order: {result['topological_order']}")

    # Trace lineage for the synthesis paper
    print(f"\nAncestors of 'Synthesis: Unified Load Model' (id=4):")
    for anc in trace_ancestors(result["dag"], 4):
        chain = " -> ".join(str(n) for n in anc["path"])
        print(f"  {anc['ancestor_title']} (distance={anc['distance']}, path: {chain})")
        for reason in anc["reasons"]:
            print(f"    reason: {reason}")

    print(f"\nDescendants of 'Seminal Paper' (id=1):")
    for desc in trace_descendants(result["dag"], 1):
        chain = " -> ".join(str(n) for n in desc["path"])
        print(f"  {desc['descendant_title']} (distance={desc['distance']}, path: {chain})")
