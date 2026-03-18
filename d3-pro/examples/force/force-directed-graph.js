// Canonical Force-Directed Graph — Les Misérables co-occurrence network
// Source: Observable / Mike Bostock
// This is THE reference implementation. Match this pattern for all force graphs.

export function ForceGraph(data, {
  width = 928,
  height = 600,
  color = d3.scaleOrdinal(d3.schemeObservable10)
} = {}) {
  // Copy data to avoid mutation
  const nodes = data.nodes.map(d => ({...d}));
  const links = data.links.map(d => ({...d}));

  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

  // Links
  const link = svg.append("g")
      .attr("stroke", "var(--theme-foreground-faint)")
      .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));

  // Nodes
  const node = svg.append("g")
      .attr("stroke", "var(--theme-background)")
      .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
      .attr("r", 5)
      .attr("fill", d => color(d.group));

  // Tooltip
  node.append("title")
      .text(d => d.id);

  // Drag behavior (canonical pattern)
  node.call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  // Tick
  simulation.on("tick", () => {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
  });

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return svg.node();
}
