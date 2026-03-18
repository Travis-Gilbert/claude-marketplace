// Scatterplot Matrix (SPLOM) — Multi-axis scatter grid
// Shows pairwise relationships between multiple variables.

export function ScatterplotMatrix(data, columns, {
  width = 928,
  size = width / columns.length,
  padding = 20,
  color = d3.scaleOrdinal(d3.schemeObservable10)
} = {}) {
  const n = columns.length;

  // Scales per column
  const scales = {};
  for (const col of columns) {
    scales[col] = d3.scaleLinear()
        .domain(d3.extent(data, d => d[col]))
        .rangeRound([padding / 2, size - padding / 2])
        .nice();
  }

  const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", width)
      .attr("viewBox", [0, 0, width, width])
      .attr("style", "max-width: 100%; height: auto;");

  // Cells
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const cell = svg.append("g")
          .attr("transform", `translate(${j * size},${i * size})`);

      // Frame
      cell.append("rect")
          .attr("x", padding / 2)
          .attr("y", padding / 2)
          .attr("width", size - padding)
          .attr("height", size - padding)
          .attr("fill", "none")
          .attr("stroke", "var(--theme-foreground-faintest)");

      if (i === j) {
        // Diagonal: variable name
        cell.append("text")
            .attr("x", size / 2)
            .attr("y", size / 2)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("font", "bold 10px var(--sans-serif)")
            .attr("fill", "var(--theme-foreground)")
            .text(columns[i]);
      } else {
        // Off-diagonal: scatter
        const xCol = columns[j];
        const yCol = columns[i];
        const x = scales[xCol];
        const y = scales[yCol];

        cell.selectAll("circle")
            .data(data)
            .join("circle")
            .attr("cx", d => x(d[xCol]))
            .attr("cy", d => y(d[yCol]))
            .attr("r", 2)
            .attr("fill", d => color(d.species ?? d.cluster ?? 0))
            .attr("fill-opacity", 0.6);
      }
    }
  }

  return svg.node();
}

// Usage:
// const data = await d3.csv("iris.csv", d3.autoType);
// const chart = ScatterplotMatrix(data, ["sepalLength", "sepalWidth", "petalLength", "petalWidth"]);
