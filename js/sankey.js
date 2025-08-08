import * as d3 from "https://cdn.skypack.dev/d3@7";
import { sankey, sankeyLinkHorizontal } from "https://cdn.skypack.dev/d3-sankey@0.12";

const teamColors = {
  "RCB": "#da1818",
  "PBKS": "#ff4827ff",
  "DC": "#17449b",
  "MI": "#045093",
  "CSK": "#f9cd05"
};

d3.csv("data/most_runs_in_ipl.csv", d3.autoType).then(data => {
  const nodes = [];
  const links = [];
  const nodeMap = new Map();

  const getNode = name => {
    if (!nodeMap.has(name)) {
      nodeMap.set(name, nodes.length);
      nodes.push({ name });
    }
    return nodeMap.get(name);
  };

  data.forEach(d => {
    const teamNode = getNode(d.Team);
    const playerNode = getNode(d.Player);
    const scoreNode = getNode(`HS: ${d.Highest}`);

    links.push({ source: teamNode, target: playerNode, value: 1 });
    links.push({ source: playerNode, target: scoreNode, value: 1 });
  });

  const sankeyGen = sankey()
    .nodeWidth(20)
    .nodePadding(12)
    .extent([[1, 1], [880, 580]]);

  const sankeyData = sankeyGen({
    nodes: nodes.map(d => Object.assign({}, d)),
    links: links.map(d => Object.assign({}, d))
  });

  const svg = d3.select("#sankey")
    .attr("width", 900)
    .attr("height", 600);

  svg.selectAll("*").remove();

  const defs = svg.append("defs");
  sankeyData.nodes.forEach((d, i) => {
    if (teamColors[d.name]) {
      defs.append("linearGradient")
        .attr("id", `grad-${i}`)
        .attr("x1", "0%").attr("x2", "100%")
        .attr("y1", "0%").attr("y2", "0%")
        .selectAll("stop")
        .data([
          { offset: "0%", color: "#fff" },
          { offset: "100%", color: teamColors[d.name] }
        ])
        .enter()
        .append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);
    }
  });

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("padding", "6px 10px")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("font-size", "12px")
    .style("opacity", 0);

  // Glow filter
  const filter = defs.append("filter")
    .attr("id", "glow");
  filter.append("feGaussianBlur")
    .attr("stdDeviation", 3)
    .attr("result", "blur");
  filter.append("feMerge")
    .selectAll("feMergeNode")
    .data(["blur", "SourceGraphic"])
    .enter()
    .append("feMergeNode")
    .attr("in", d => d);

  // Links
  const link = svg.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(sankeyData.links)
    .join("path")
    .attr("d", sankeyLinkHorizontal())
    .attr("stroke", "#bbb")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 0)
    .transition()
    .duration(800)
    .attr("stroke-width", d => Math.max(1, d.width));

  // Nodes
  const node = svg.append("g")
    .selectAll("rect")
    .data(sankeyData.nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("rx", 4)
    .attr("fill", d => {
      const color = teamColors[d.name];
      const i = sankeyData.nodes.indexOf(d);
      return color ? `url(#grad-${i})` : "#007acc";
    })
    .attr("opacity", 0)
    .style("filter", "url(#glow)")
    .transition()
    .duration(1000)
    .attr("opacity", 1);

  // Labels
  svg.append("g")
    .selectAll("text")
    .data(sankeyData.nodes)
    .join("text")
    .attr("x", d => d.x0 < 450 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => (d.y0 + d.y1) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < 450 ? "start" : "end")
    .style("font-size", "12px")
    .style("opacity", 0)
    .transition()
    .delay(800)
    .duration(500)
    .style("opacity", 1)
    .text(d => d.name);

  // Hover interactivity
  svg.selectAll("rect")
    .on("mouseover", function(event, d) {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`<strong>${d.name}</strong>`)
        .style("left", (event.pageX + 8) + "px")
        .style("top", (event.pageY - 20) + "px");

      d3.selectAll("path")
        .attr("stroke-opacity", linkData =>
          linkData.source.name === d.name || linkData.target.name === d.name ? 0.8 : 0.05
        );
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 8) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", function() {
      tooltip.transition().duration(300).style("opacity", 0);
      d3.selectAll("path").attr("stroke-opacity", 0.4);
    });
});
