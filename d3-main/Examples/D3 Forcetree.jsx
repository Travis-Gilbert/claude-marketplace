// Force-directed tree in plain JavaScript with D3 v7
// Drop this into a <script> tag on a page that has an <svg id="chart"></svg>
// and has already loaded D3 from a CDN (see comment at top).

// Example HTML shell:
//
// <svg id="chart"></svg>
// <script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
// <script src="force-tree.js"></script>

// 1. Example hierarchical data (replace with your own unique data)
const data = {
    name: "root",
    children: [
        {
            name: "group A",
            children: [
                { name: "a1" },
                { name: "a2" },
                { name: "a3" }
            ]
        },
        {
            name: "group B",
            children: [
                { name: "b1" },
                {
                    name: "b2",
                    children: [
                        { name: "b2-1" },
                        { name: "b2-2" },
                        { name: "b2-3" }
                    ]
                }
            ]
        },
        {
            name: "group C",
            children: [
                { name: "c1" },
                { name: "c2" }
            ]
        }
    ]
};

// 2. Chart dimensions
const width = 928;
const height = 600;

// 3. Build hierarchy, links, and nodes (same as Observable code)
const root = d3.hierarchy(data);
const links = root.links();
const nodes = root.descendants();

// 4. Force simulation (ported from the Observable example)
const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links)
        .id(d => d.id)
        .distance(0)
        .strength(1))
    .force("charge", d3.forceManyBody().strength(-50))
    .force("x", d3.forceX())
    .force("y", d3.forceY());

// 5. SVG container (targets an existing <svg id="chart">)
const svg = d3.select("#chart")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .style("max-width", "100%")
    .style("height", "auto");

// 6. Links
const link = svg.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line");

// 7. Nodes
const node = svg.append("g")
    .attr("fill", "#fff")
    .attr("stroke", "#000")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("fill", d => d.children ? null : "#000")
    .attr("stroke", d => d.children ? null : "#fff")
    .attr("r", 3.5)
    .call(drag(simulation));

node.append("title")
    .text(d => d.data.name);

// 8. Tick handler
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

// 9. Drag behavior (same pattern as the Observable cell)
function drag(simulation) {
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

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}
