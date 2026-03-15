"""
Community Detection Example
=============================
Demonstrates Louvain community detection over the research_api knowledge graph:
build a NetworkX graph from Objects and Edges, run Louvain with resolution
tuning, compute modularity, persist Cluster records, and trigger self-organization.

Pipeline:
  Objects/Edges -> NetworkX graph -> Louvain partitioning -> modularity scoring
  -> Cluster records -> self-organization feedback

Key concepts:
  - NetworkX graph construction from Django model instances
  - Louvain community detection with configurable resolution
  - Modularity as a quality metric for partitioning
  - Cluster records linking Objects to their community
  - Self-organization trigger after re-clustering
  - Edge.reason and from_object/to_object conventions
"""

import hashlib
import logging
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import networkx as nx

logger = logging.getLogger(__name__)

# Louvain is available via networkx (>= 3.0) or community-louvain
try:
    from networkx.algorithms.community import louvain_communities
    _LOUVAIN_AVAILABLE = True
except ImportError:
    try:
        import community as community_louvain
        _LOUVAIN_AVAILABLE = True
    except ImportError:
        _LOUVAIN_AVAILABLE = False


# ---------------------------------------------------------------------------
# Data structures (simplified versions of Django models)
# ---------------------------------------------------------------------------
@dataclass
class Object:
    """Unit of captured knowledge. Has 10 types in research_api."""
    id: int
    title: str
    object_type: str   # e.g., "note", "source", "entity", "concept"
    body: str = ""
    notebook_id: int = 1
    is_deleted: bool = False


@dataclass
class Edge:
    """Explained connection between two Objects. Uses from_object/to_object
    (never source/target). Edge.reason must be a plain-English sentence
    a human can read."""
    id: int
    from_object_id: int
    to_object_id: int
    edge_type: str      # 14 types: similarity, support, contradiction, etc.
    reason: str         # plain-English explanation (architectural invariant)
    strength: float = 1.0


@dataclass
class Cluster:
    """A detected community in the knowledge graph. Clusters are ephemeral:
    they are recomputed when the graph changes. Each Cluster record captures
    a snapshot of the community at detection time."""
    id: int
    label: str
    member_object_ids: list[int]
    modularity_contribution: float
    resolution: float
    sha: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)

    def __post_init__(self):
        if not self.sha:
            ids_str = ",".join(str(i) for i in sorted(self.member_object_ids))
            payload = f"cluster|{ids_str}|{self.resolution}"
            self.sha = hashlib.sha256(payload.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# Stage 1: Build NetworkX graph from Objects and Edges
# ---------------------------------------------------------------------------
def build_graph(
    objects: list[Object],
    edges: list[Edge],
) -> nx.Graph:
    """Construct an undirected weighted graph from research_api primitives.

    Nodes are Objects (with type metadata). Edges carry weight (strength)
    and reason. Deleted objects are excluded.

    Uses from_object/to_object naming per architectural invariant #2.
    """
    G = nx.Graph()

    # Add nodes with metadata
    for obj in objects:
        if obj.is_deleted:
            continue
        G.add_node(obj.id, title=obj.title, object_type=obj.object_type)

    # Add edges with weight and reason
    active_ids = set(G.nodes())
    for edge in edges:
        if edge.from_object_id in active_ids and edge.to_object_id in active_ids:
            # Combine edge strengths if multiple edges exist between nodes
            if G.has_edge(edge.from_object_id, edge.to_object_id):
                existing = G[edge.from_object_id][edge.to_object_id]
                existing["weight"] = max(existing["weight"], edge.strength)
                existing["reasons"].append(edge.reason)
            else:
                G.add_edge(
                    edge.from_object_id,
                    edge.to_object_id,
                    weight=edge.strength,
                    edge_type=edge.edge_type,
                    reasons=[edge.reason],
                )

    logger.info("Built graph: %d nodes, %d edges", G.number_of_nodes(), G.number_of_edges())
    return G


# ---------------------------------------------------------------------------
# Stage 2: Run Louvain community detection
# ---------------------------------------------------------------------------
def detect_communities(
    G: nx.Graph,
    resolution: float = 1.0,
) -> list[set[int]]:
    """Run Louvain community detection on the graph.

    Resolution parameter controls granularity:
      - resolution < 1.0 -> fewer, larger communities
      - resolution = 1.0 -> standard modularity optimization
      - resolution > 1.0 -> more, smaller communities

    Per-notebook engine_config can override the default resolution.
    """
    if not _LOUVAIN_AVAILABLE:
        logger.warning("Louvain not available, returning single community")
        return [set(G.nodes())]

    if G.number_of_nodes() == 0:
        return []

    communities = louvain_communities(
        G,
        weight="weight",
        resolution=resolution,
        seed=42,  # reproducible for testing
    )

    logger.info(
        "Louvain detected %d communities (resolution=%.2f)",
        len(communities), resolution,
    )
    return communities


# ---------------------------------------------------------------------------
# Stage 3: Compute modularity
# ---------------------------------------------------------------------------
def compute_modularity(G: nx.Graph, communities: list[set[int]]) -> float:
    """Compute Newman modularity for the detected partition.

    Modularity ranges from -0.5 to 1.0. Values above 0.3 indicate
    meaningful community structure. Below 0.3 suggests the graph is
    too sparse or too uniform for meaningful clustering.
    """
    if not communities:
        return 0.0
    return nx.community.modularity(G, communities, weight="weight")


# ---------------------------------------------------------------------------
# Stage 4: Create Cluster records
# ---------------------------------------------------------------------------
def create_clusters(
    G: nx.Graph,
    communities: list[set[int]],
    resolution: float,
    modularity: float,
) -> list[Cluster]:
    """Create Cluster records from detected communities.

    Each cluster gets a label derived from its most connected member
    (highest degree centrality within the community). In production,
    the LLM synthesizer generates a human-readable cluster summary.
    """
    clusters = []

    for idx, member_ids in enumerate(communities):
        # Find the most connected node in this community for labeling
        subgraph = G.subgraph(member_ids)
        if subgraph.number_of_nodes() == 0:
            continue

        degree_centrality = nx.degree_centrality(subgraph)
        hub_id = max(degree_centrality, key=degree_centrality.get)
        hub_title = G.nodes[hub_id].get("title", f"Node {hub_id}")

        # Compute this community's contribution to modularity
        # (approximate: proportional to internal edge density)
        internal_edges = subgraph.number_of_edges()
        total_possible = len(member_ids) * (len(member_ids) - 1) / 2
        density = internal_edges / total_possible if total_possible > 0 else 0

        cluster = Cluster(
            id=idx + 1,
            label=f"Cluster around '{hub_title}' ({len(member_ids)} members)",
            member_object_ids=sorted(member_ids),
            modularity_contribution=density,
            resolution=resolution,
        )
        clusters.append(cluster)

    logger.info("Created %d Cluster records (modularity=%.3f)", len(clusters), modularity)
    return clusters


# ---------------------------------------------------------------------------
# Stage 5: Trigger self-organization
# ---------------------------------------------------------------------------
def trigger_self_organization(clusters: list[Cluster], notebook_id: int):
    """After re-clustering, trigger the self-organization feedback loops.

    In research_api, self_organize.py runs 5 feedback loops:
      1. classify: Re-classify object types based on cluster context
      2. cluster->notebook: Suggest notebook splits for large clusters
      3. entity promotion: Promote frequently-referenced phrases to Entities
      4. edge decay: Reduce strength of stale edges
      5. emergent types: Detect new object/edge types from usage patterns

    This function would queue an RQ task in production.
    """
    logger.info(
        "Triggering self-organization for notebook %d (%d clusters)",
        notebook_id, len(clusters),
    )
    # In production:
    # from apps.research.tasks import trigger_self_org
    # trigger_self_org.delay(notebook_id=notebook_id)
    print(f"  [self-org] Would queue self-organization for notebook {notebook_id}")


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------
def run_community_detection(
    objects: list[Object],
    edges: list[Edge],
    resolution: float = 1.0,
    notebook_id: int = 1,
) -> dict:
    """Full community detection pipeline.

    1. Build NetworkX graph from Objects/Edges
    2. Run Louvain community detection
    3. Compute modularity score
    4. Create Cluster records
    5. Trigger self-organization

    Returns dict with graph stats, clusters, and modularity.
    """
    G = build_graph(objects, edges)
    communities = detect_communities(G, resolution=resolution)
    modularity = compute_modularity(G, communities)
    clusters = create_clusters(G, communities, resolution, modularity)
    trigger_self_organization(clusters, notebook_id)

    return {
        "graph_nodes": G.number_of_nodes(),
        "graph_edges": G.number_of_edges(),
        "num_communities": len(communities),
        "modularity": modularity,
        "clusters": clusters,
    }


# ---------------------------------------------------------------------------
# Usage example
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Build a small sample graph with two obvious communities
    objects = [
        # Community 1: Architecture
        Object(id=1, title="Gothic Cathedrals", object_type="concept"),
        Object(id=2, title="Flying Buttresses", object_type="concept"),
        Object(id=3, title="Ribbed Vaults", object_type="concept"),
        Object(id=4, title="Notre-Dame de Paris", object_type="entity"),
        # Community 2: Materials
        Object(id=5, title="Reinforced Concrete", object_type="concept"),
        Object(id=6, title="Steel Framing", object_type="concept"),
        Object(id=7, title="Load Distribution", object_type="concept"),
        Object(id=8, title="Brutalism", object_type="concept"),
        # Bridge node
        Object(id=9, title="Structural Engineering", object_type="concept"),
    ]

    edges = [
        # Community 1 edges
        Edge(id=1, from_object_id=1, to_object_id=2, edge_type="support",
             reason="Gothic cathedrals pioneered the use of flying buttresses.", strength=0.9),
        Edge(id=2, from_object_id=1, to_object_id=3, edge_type="support",
             reason="Ribbed vaults are a defining feature of Gothic architecture.", strength=0.85),
        Edge(id=3, from_object_id=4, to_object_id=1, edge_type="instance_of",
             reason="Notre-Dame is a canonical example of Gothic cathedral design.", strength=0.95),
        Edge(id=4, from_object_id=2, to_object_id=3, edge_type="similarity",
             reason="Both buttresses and vaults distribute structural loads.", strength=0.7),
        # Community 2 edges
        Edge(id=5, from_object_id=5, to_object_id=6, edge_type="similarity",
             reason="Concrete and steel are complementary structural materials.", strength=0.8),
        Edge(id=6, from_object_id=5, to_object_id=7, edge_type="support",
             reason="Reinforced concrete enables complex load distribution.", strength=0.85),
        Edge(id=7, from_object_id=8, to_object_id=5, edge_type="support",
             reason="Brutalist architecture prominently features exposed concrete.", strength=0.9),
        Edge(id=8, from_object_id=6, to_object_id=7, edge_type="support",
             reason="Steel framing is designed primarily for load distribution.", strength=0.75),
        # Bridge edges (weaker, connecting communities)
        Edge(id=9, from_object_id=9, to_object_id=2, edge_type="broader",
             reason="Structural engineering encompasses buttress design.", strength=0.5),
        Edge(id=10, from_object_id=9, to_object_id=7, edge_type="broader",
             reason="Load distribution is a core structural engineering topic.", strength=0.5),
    ]

    result = run_community_detection(objects, edges, resolution=1.0)

    print(f"\nGraph: {result['graph_nodes']} nodes, {result['graph_edges']} edges")
    print(f"Communities: {result['num_communities']}")
    print(f"Modularity: {result['modularity']:.3f}")
    print(f"\nClusters:")
    for cluster in result["clusters"]:
        print(f"  {cluster.label}")
        print(f"    Members: {cluster.member_object_ids}")
        print(f"    Density: {cluster.modularity_contribution:.3f}")
        print(f"    SHA: {cluster.sha}")
