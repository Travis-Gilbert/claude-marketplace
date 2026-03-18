// Label Occlusion Avoidance — Force-based label placement
// Use when labels overlap in scatter plots or node-link diagrams.

export function placeLabels(nodes, {
  labelOffset = 12,
  collideRadius = 14,
  iterations = 120
} = {}) {
  // Create label nodes offset from their anchors
  const labelNodes = nodes.map(d => ({
    x: d.x + labelOffset,
    y: d.y,
    anchor: d
  }));

  // Links from labels back to their anchor nodes
  const anchorLinks = labelNodes.map((label, i) => ({
    source: label,
    target: nodes[i]
  }));

  // Run a secondary force simulation for label placement
  const labelSim = d3.forceSimulation(labelNodes)
      .force("collide", d3.forceCollide(collideRadius))
      .force("anchor", d3.forceLink(anchorLinks)
          .distance(labelOffset)
          .strength(2))
      .stop();

  // Run to convergence
  for (let i = 0; i < iterations; ++i) labelSim.tick();

  return labelNodes;
}

// Usage:
// const labelPositions = placeLabels(importantNodes);
// svg.selectAll("text.label")
//     .data(labelPositions)
//     .join("text")
//     .attr("x", d => d.x)
//     .attr("y", d => d.y)
//     .attr("font", "10px var(--sans-serif)")
//     .text(d => d.anchor.name);
