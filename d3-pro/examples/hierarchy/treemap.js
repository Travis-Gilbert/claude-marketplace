// Treemap — Nested rectangles with area encoding
// Source: Observable / Mike Bostock

export function Treemap(data, {
  width = 928,
  height = 600,
  color = d3.scaleOrdinal(d3.schemeObservable10)
} = {}) {
  const root = d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

  d3.treemap()
      .size([width, height])
      .padding(1)
      .round(true)
      (root);

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  const cell = svg.selectAll("g")
    .data(root.leaves())
    .join("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

  cell.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => {
        while (d.depth > 1) d = d.parent;
        return color(d.data.name);
      })
      .attr("fill-opacity", 0.6)
      .attr("stroke", "var(--theme-background)");

  cell.append("clipPath")
      .attr("id", (d, i) => `clip-${i}`)
    .append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0);

  cell.append("text")
      .attr("clip-path", (d, i) => `url(#clip-${i})`)
    .selectAll("tspan")
    .data(d => d.data.name.split(/(?=[A-Z][a-z])/g))
    .join("tspan")
      .attr("x", 3)
      .attr("y", (d, i) => 13 + i * 10)
      .text(d => d);

  cell.append("title")
      .text(d => `${d.ancestors().reverse().map(d => d.data.name).join(".")}\n${d.value}`);

  return svg.node();
}
