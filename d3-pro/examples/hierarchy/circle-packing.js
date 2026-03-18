// Circle Packing — Nested circles with area encoding
// Source: Observable / Mike Bostock

export function CirclePacking(data, {
  width = 928,
  height = 928,
  color = d3.scaleLinear()
      .domain([0, 5])
      .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
      .interpolate(d3.interpolateHcl)
} = {}) {
  const root = d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

  d3.pack()
      .size([width, height])
      .padding(3)
      (root);

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");

  const node = svg.append("g")
    .selectAll("circle")
    .data(root.descendants())
    .join("circle")
      .attr("cx", d => d.x - width / 2)
      .attr("cy", d => d.y - height / 2)
      .attr("r", d => d.r)
      .attr("fill", d => d.children ? color(d.depth) : "white")
      .attr("stroke", d => d.children ? "var(--theme-foreground-fainter)" : null)
      .attr("pointer-events", d => !d.children ? "none" : null);

  node.append("title")
      .text(d => `${d.ancestors().reverse().map(d => d.data.name).join(".")}\n${d.value}`);

  return svg.node();
}
