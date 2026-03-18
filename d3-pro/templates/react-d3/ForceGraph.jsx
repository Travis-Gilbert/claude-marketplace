// React + D3 Integration Pattern
// React owns the container, D3 owns the contents

import { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function ForceGraph({
  data,
  width = 928,
  height = 600,
  color = d3.scaleOrdinal(d3.schemeObservable10)
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Copy data to avoid mutation
    const nodes = data.nodes.map(d => ({...d}));
    const links = data.links.map(d => ({...d}));

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Zoom
    const g = svg.append("g");
    svg.call(d3.zoom()
        .scaleExtent([0.5, 8])
        .on("zoom", ({transform}) => g.attr("transform", transform)));

    // Links
    const link = g.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    // Nodes
    const node = g.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
        .attr("r", 5)
        .attr("fill", d => color(d.group));

    node.append("title").text(d => d.id);

    // Drag
    node.call(d3.drag()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x; d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        }));

    // Tick
    simulation.on("tick", () => {
      link
          .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node
          .attr("cx", d => d.x).attr("cy", d => d.y);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data, width, height, color]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
}
