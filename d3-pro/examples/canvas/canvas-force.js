// Canvas Force Graph — Large graph rendering
// Use canvas when node count exceeds 500.
// See templates/canvas-force/ for full working template.

export function CanvasForceGraph(data, {
  width = 928,
  height = 600,
  color = d3.scaleOrdinal(d3.schemeObservable10)
} = {}) {
  const nodes = data.nodes.map(d => ({...d}));
  const links = data.links.map(d => ({...d}));

  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id))
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(width / 2, height / 2));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  simulation.on("tick", () => {
    context.clearRect(0, 0, width, height);

    // Links (single path for performance)
    context.beginPath();
    context.strokeStyle = "rgba(153, 153, 153, 0.6)";
    context.lineWidth = 0.5;
    for (const link of links) {
      context.moveTo(link.source.x, link.source.y);
      context.lineTo(link.target.x, link.target.y);
    }
    context.stroke();

    // Nodes (individual fills for color)
    for (const node of nodes) {
      context.beginPath();
      context.arc(node.x, node.y, 5, 0, 2 * Math.PI);
      context.fillStyle = color(node.group);
      context.fill();
      context.strokeStyle = "#fff";
      context.lineWidth = 1.5;
      context.stroke();
    }
  });

  // Hit testing via simulation.find()
  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const node = simulation.find(mx, my, 20);
    canvas.title = node ? node.id : "";
    canvas.style.cursor = node ? "pointer" : "default";
  });

  return canvas;
}
