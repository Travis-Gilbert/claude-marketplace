"""
Structural Hole Detection Example
===================================
Demonstrates Burt's structural hole theory applied to the research_api
knowledge graph: compute constraint per node, identify bridge nodes,
find gaps between communities, and suggest missing connections.

Pipeline:
  NetworkX graph -> Burt's constraint per node -> bridge identification
  -> inter-community gap analysis -> missing connection suggestions

Key concepts:
  - Burt's constraint: measures how much a node's contacts are connected
    to each other (low constraint = structural hole position)
  - Bridge nodes: low-constraint nodes connecting otherwise separate communities
  - Structural holes: gaps between communities that represent missing knowledge
  - Suggested connections: potential edges that would bridge gaps
  - Integration with Louvain communities for gap contextualization
"""

import logging
from collections import defaultdict
from dataclasses import dataclass
from itertools import combinations
from typing import Optional

import networkx as nx

logger = logging.getLogger(__name__)

try:
    from networkx.algorithms.community import louvain_communities
    _LOUVAIN_AVAILABLE = True
except ImportError:
    _LOUVAIN_AVAILABLE = False


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------
@dataclass
class BridgeNode:
    """A node occupying a structural hole position between communities."""
    node_id: int
    title: str
    constraint: float          # Burt's constraint (lower = more bridging)
    communities_bridged: list[int]  # indices of connected communities
    betweenness: float = 0.0   # betweenness centrality (for validation)


@dataclass
class StructuralGap:
    """A gap between two communities with no or weak connections."""
    community_a: int
    community_b: int
    community_a_size: int
    community_b_size: int
    existing_bridges: int       # number of cross-community edges
    gap_score: float           # 0 = fully connected, 1 = no connections
    suggested_connections: list[tuple[int, int, str]]  # (node_a, node_b, reason)


# ---------------------------------------------------------------------------
# Stage 1: Compute Burt's constraint per node
# ---------------------------------------------------------------------------
def compute_constraint(G: nx.Graph) -> dict[int, float]:
    """Compute Burt's constraint for each node in the graph.

    Constraint measures how much a node's ego network is closed
    (contacts are connected to each other). Formula:

      constraint(i) = SUM_j (p_ij + SUM_q p_iq * p_qj)^2

    where p_ij is the proportion of i's network investment in j.

    Low constraint (< 0.5) -> the node bridges structural holes.
    High constraint (> 0.8) -> the node is embedded in a dense clique.

    NetworkX provides this directly via nx.constraint().
    """
    if G.number_of_nodes() == 0:
        return {}

    constraint = nx.constraint(G, weight="weight")

    # Log summary statistics
    values = [v for v in constraint.values() if v is not None]
    if values:
        avg = sum(values) / len(values)
        logger.info(
            "Constraint stats: min=%.3f, max=%.3f, avg=%.3f (%d nodes)",
            min(values), max(values), avg, len(values),
        )

    return constraint


# ---------------------------------------------------------------------------
# Stage 2: Identify bridge nodes
# ---------------------------------------------------------------------------
def identify_bridges(
    G: nx.Graph,
    constraint: dict[int, float],
    communities: list[set[int]],
    threshold: float = 0.5,
) -> list[BridgeNode]:
    """Identify nodes that bridge structural holes between communities.

    A bridge node has:
      1. Low constraint (below threshold) -- its contacts are not all
         connected to each other
      2. Neighbors in multiple communities -- it actually spans a gap

    Also computes betweenness centrality as a cross-validation signal.
    Nodes with low constraint AND high betweenness are strong bridges.
    """
    # Build community membership lookup
    node_to_community = {}
    for idx, community in enumerate(communities):
        for node_id in community:
            node_to_community[node_id] = idx

    # Compute betweenness centrality for validation
    betweenness = nx.betweenness_centrality(G, weight="weight")

    bridges = []
    for node_id, c_value in constraint.items():
        if c_value is None or c_value >= threshold:
            continue

        # Check which communities this node's neighbors belong to
        neighbor_communities = set()
        for neighbor in G.neighbors(node_id):
            if neighbor in node_to_community:
                neighbor_communities.add(node_to_community[neighbor])

        # Add the node's own community
        if node_id in node_to_community:
            neighbor_communities.add(node_to_community[node_id])

        # A bridge must span at least 2 communities
        if len(neighbor_communities) >= 2:
            bridges.append(BridgeNode(
                node_id=node_id,
                title=G.nodes[node_id].get("title", f"Node {node_id}"),
                constraint=c_value,
                communities_bridged=sorted(neighbor_communities),
                betweenness=betweenness.get(node_id, 0.0),
            ))

    # Sort by constraint (lowest = most bridging)
    bridges.sort(key=lambda b: b.constraint)
    logger.info("Identified %d bridge nodes (threshold=%.2f)", len(bridges), threshold)
    return bridges


# ---------------------------------------------------------------------------
# Stage 3: Find gaps between communities
# ---------------------------------------------------------------------------
def find_structural_gaps(
    G: nx.Graph,
    communities: list[set[int]],
) -> list[StructuralGap]:
    """Detect gaps between all pairs of communities.

    A gap exists when two communities have few or no connections relative
    to their sizes. The gap score is:

      gap = 1 - (actual_bridges / expected_bridges)

    where expected_bridges = sqrt(|A| * |B|) (geometric mean as baseline).
    """
    gaps = []

    for i, j in combinations(range(len(communities)), 2):
        comm_a = communities[i]
        comm_b = communities[j]

        # Count cross-community edges
        bridge_count = 0
        for node_a in comm_a:
            for neighbor in G.neighbors(node_a):
                if neighbor in comm_b:
                    bridge_count += 1

        # Expected bridges based on community sizes
        import math
        expected = math.sqrt(len(comm_a) * len(comm_b))
        gap_score = max(0.0, 1.0 - (bridge_count / expected)) if expected > 0 else 1.0

        # Only report meaningful gaps (score > 0.5)
        if gap_score > 0.5:
            # Generate suggested connections
            suggestions = _suggest_connections(G, comm_a, comm_b)

            gaps.append(StructuralGap(
                community_a=i,
                community_b=j,
                community_a_size=len(comm_a),
                community_b_size=len(comm_b),
                existing_bridges=bridge_count,
                gap_score=gap_score,
                suggested_connections=suggestions,
            ))

    gaps.sort(key=lambda g: g.gap_score, reverse=True)
    logger.info("Found %d structural gaps between %d communities", len(gaps), len(communities))
    return gaps


# ---------------------------------------------------------------------------
# Stage 4: Suggest missing connections
# ---------------------------------------------------------------------------
def _suggest_connections(
    G: nx.Graph,
    comm_a: set[int],
    comm_b: set[int],
    max_suggestions: int = 3,
) -> list[tuple[int, int, str]]:
    """Suggest potential edges that would bridge the gap between two communities.

    Strategy: find nodes in each community with the highest degree (hubs)
    and suggest connecting them, as hub-to-hub connections are most likely
    to represent genuine knowledge relationships.

    The reason field provides a human-readable suggestion that a researcher
    can evaluate. Per architectural invariant #1: Edge.reason must be
    plain English.
    """
    # Find hubs in each community (highest degree within the subgraph)
    subgraph_a = G.subgraph(comm_a)
    subgraph_b = G.subgraph(comm_b)

    if subgraph_a.number_of_nodes() == 0 or subgraph_b.number_of_nodes() == 0:
        return []

    hubs_a = sorted(comm_a, key=lambda n: subgraph_a.degree(n), reverse=True)
    hubs_b = sorted(comm_b, key=lambda n: subgraph_b.degree(n), reverse=True)

    suggestions = []
    for hub_a in hubs_a[:max_suggestions]:
        for hub_b in hubs_b[:1]:  # top hub from other community
            if not G.has_edge(hub_a, hub_b):
                title_a = G.nodes[hub_a].get("title", f"Node {hub_a}")
                title_b = G.nodes[hub_b].get("title", f"Node {hub_b}")
                reason = (
                    f"Potential connection: '{title_a}' and '{title_b}' "
                    f"are hubs in separate communities that may share "
                    f"an unexplored relationship."
                )
                suggestions.append((hub_a, hub_b, reason))

    return suggestions[:max_suggestions]


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------
def analyze_structural_holes(
    G: nx.Graph,
    resolution: float = 1.0,
) -> dict:
    """Full structural hole analysis pipeline.

    1. Detect communities with Louvain
    2. Compute Burt's constraint per node
    3. Identify bridge nodes
    4. Find gaps between communities
    5. Suggest missing connections for each gap
    """
    # Run Louvain for community context
    if _LOUVAIN_AVAILABLE:
        communities = list(louvain_communities(G, weight="weight",
                                               resolution=resolution, seed=42))
    else:
        communities = [set(G.nodes())]

    constraint = compute_constraint(G)
    bridges = identify_bridges(G, constraint, communities)
    gaps = find_structural_gaps(G, communities)

    return {
        "num_communities": len(communities),
        "communities": communities,
        "constraint": constraint,
        "bridges": bridges,
        "gaps": gaps,
    }


# ---------------------------------------------------------------------------
# Usage example
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Build a graph with two clusters and a weak bridge
    G = nx.Graph()

    # Cluster A: Design Theory
    for i in [1, 2, 3, 4]:
        G.add_node(i, title=f"Design Theory {i}", object_type="concept")
    G.add_edge(1, 2, weight=0.9, reasons=["Same theoretical framework"])
    G.add_edge(1, 3, weight=0.8, reasons=["Related concepts"])
    G.add_edge(2, 3, weight=0.85, reasons=["Complementary approaches"])
    G.add_edge(3, 4, weight=0.7, reasons=["Extension of concept"])
    G.add_edge(1, 4, weight=0.6, reasons=["Historical connection"])

    # Cluster B: Material Science
    for i in [5, 6, 7, 8]:
        G.add_node(i, title=f"Material Science {i}", object_type="concept")
    G.add_edge(5, 6, weight=0.9, reasons=["Same material family"])
    G.add_edge(5, 7, weight=0.85, reasons=["Testing methodology"])
    G.add_edge(6, 7, weight=0.75, reasons=["Shared properties"])
    G.add_edge(7, 8, weight=0.8, reasons=["Application domain"])

    # Weak bridge (single node connecting clusters)
    G.add_node(9, title="Structural Analysis", object_type="concept")
    G.add_edge(4, 9, weight=0.4, reasons=["Design meets structure"])
    G.add_edge(9, 5, weight=0.3, reasons=["Structure meets materials"])

    result = analyze_structural_holes(G, resolution=1.0)

    print(f"Communities: {result['num_communities']}")
    print(f"\nBridge nodes:")
    for bridge in result["bridges"]:
        print(f"  {bridge.title} (constraint={bridge.constraint:.3f}, "
              f"betweenness={bridge.betweenness:.3f})")
        print(f"    Bridges communities: {bridge.communities_bridged}")

    print(f"\nStructural gaps:")
    for gap in result["gaps"]:
        print(f"  Community {gap.community_a} ({gap.community_a_size} nodes) <-> "
              f"Community {gap.community_b} ({gap.community_b_size} nodes)")
        print(f"    Gap score: {gap.gap_score:.3f} ({gap.existing_bridges} existing bridges)")
        for node_a, node_b, reason in gap.suggested_connections:
            print(f"    Suggestion: {reason}")
