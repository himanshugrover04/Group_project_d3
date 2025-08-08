import * as d3 from "https://cdn.skypack.dev/d3@7";

// Team color map
const teamColors = {
  "RCB": "#da1818",
  "PBKS": "#d71920",
  "DC": "#17449b",
  "MI": "#045093",
  "CSK": "#f9cd05"
};

d3.csv("data/most_runs_in_ipl.csv", d3.autoType).then(data => {
  const svg = d3.select("#pie");
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const radius = Math.min(width, height) / 2 - 40;

  const g = svg.append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  // Aggregate runs by team
  const teamRuns = d3.rollup(
    data,
    v => d3.sum(v, d => d.Runs),
    d => d.Team
  );

  const pie = d3.pie()
    .sort(null)
    .value(d => d[1]);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const arcHover = d3.arc()
    .innerRadius(0)
    .outerRadius(radius + 15); // expands on hover

  const arcs = pie(Array.from(teamRuns.entries()));

  // Draw slices with animation
  g.selectAll("path")
    .data(arcs)
    .enter()
    .append("path")
    .attr("fill", d => teamColors[d.data[0]] || "#ccc")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .transition()
    .delay((d, i) => i * 200) // stagger animation
    .duration(800)
    .attrTween("d", function(d) {
      const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return t => arc(i(t));
    });

  // Hover effect
  g.selectAll("path")
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(300)
        .attr("d", arcHover);
    })
    .on("mouseout", function (event, d) {
      d3.select(this)
        .transition()
        .duration(300)
        .attr("d", arc);
    });

  // Add labels with percentages
  g.selectAll("text")
    .data(arcs)
    .enter()
    .append("text")
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .style("font-weight", "bold")
    .style("fill", "#fff")
    .text(d => {
      const percent = ((d.data[1] / d3.sum(teamRuns.values())) * 100).toFixed(1);
      return `${d.data[0]} ${percent}%`;
    });

  // Add legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - 150}, 20)`);

  const legendData = Array.from(teamRuns.entries());

  legend.selectAll("rect")
    .data(legendData)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 25)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", d => teamColors[d[0]] || "#ccc");

  legend.selectAll("text")
    .data(legendData)
    .enter()
    .append("text")
    .attr("x", 25)
    .attr("y", (d, i) => i * 25 + 14)
    .style("font-size", "14px")
    .text(d => `${d[0]} (${d[1]} runs)`);
});
