var svg = d3.select("svg");

var shapes = svg.append("g");

var circles;
var node;
var width = window.innerWidth;
var height = window.innerHeight;
//var color = "#b67a4e";
//var color = d3.scaleOrdinal(["#4e79a7","#f28e2c","#e15759","#76b7b2","#59a14f","#edc949","#af7aa1","#ff9da7","#9c755f","#bab0ab"]);
//var color = d3.scaleOrdinal(["#c97d34","#5c38b8","#66b743","#be4ed7","#b5a647","#7176d3","#d14530","#66b28b","#c5449b","#4c6431","#cd466b","#5d96ba","#76372e","#c48ac1","#ce8b7d","#5c3b70"]);
//var color = d3.scaleOrdinal(d3.schemeSpectral[9]);
var color = d3.scaleOrdinal(d3.schemeTableau10);

var group_select = 0;

let zoom = d3.zoom()
  .on('zoom', handleZoom);

function handleZoom(e) {
  d3.select('svg').select('g')
    .attr('transform', e.transform);
}

function initZoom() {
  d3.select('svg')
    .call(zoom);
} 

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-25.0))
    .force("collision", d3.forceCollide().radius(function(d) { return 2*d.size+1; }))
    .force("center", d3.forceCenter(width / 2, height / 2))
    // .force("x", d3.forceX(0.0).strength(0.01))
    // .force("y", d3.forceY(0.0).strength(0.01))
    .alphaDecay(0.005);

d3.json("dat.json").then(graph => {

  var link = shapes
      .append("g")
      .attr("class", "links")
      .attr("stroke-opacity", 0.2)
      .attr("stroke", "#999")
      .selectAll("line")
      .data(graph.links)
      .enter().append("line")
      .attr("stroke-width", 1); //function(d) { return Math.sqrt(d.value); });

  node = shapes
    .append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes)
    .enter().append("g")
    .classed("fixed", d => d.fx !== undefined);

  circles = node.append("circle")
    .attr("r", function(d) { return 2*d.size +1; })
    .attr("fill", function(d) { return color(d.groups[group_select]); })
    .attr("stroke-width", "0")
    .on("mouseenter", (evt, d) => {
      link
        .attr("display", "none")
        .filter(l => l.source.id === d.id || l.target.id === d.id)
        .attr("stroke-opacity", 0.7)
        .attr("stroke", "#a569b9")
        .attr("display", "block")
        .attr("stroke-width", 3)
        .filter(l => l.source.id === d.id)
        .attr("stroke", "#49afa2")
        
    })
    .on("mouseleave", evt => {
      link.attr("display", "block")
          .attr("stroke-opacity", 0.2)
          .attr("stroke-width", 1)
          .attr("stroke", "#999");
    });;

  node.append("text")
    .text(function(d) { return d.id; })
    .style("font-size", function(d) { return (2 * ( 2*d.size +1) - 0) / this.getComputedTextLength() * 0.8 * 24 + "px"; })
    .attr("dy", ".35em");


  const tooltipTriggers = document.querySelectorAll("circle");
  Array.from(tooltipTriggers).map(trigger => {
        trigger.addEventListener('mousemove', showTooltip);
        trigger.addEventListener('mouseout', hideTooltip);
  });


  // Create a drag handler and append it to the node object instead
  var drag_handler = d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);

  drag_handler(node);
  

  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        })
  }
});

function dragstarted(event,d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
  d3.select(this).classed("fixed", d.fixed = true);
}

function dragged(event,d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragended(event,d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

initZoom();

function showTooltip(event) {

  let tooltipElement = document.getElementById('tooltip');

  simulation.stop();
  
  tooltipElement.innerHTML = event.target.nextElementSibling.innerHTML;
  tooltipElement.style.display = 'block';
  tooltipElement.style.left = event.pageX + 10 + 'px';
  tooltipElement.style.top = event.pageY + 10 + 'px';
}

function hideTooltip() {
  simulation.alphaTarget(0.3).restart();
  var tooltip = document.getElementById('tooltip');
  tooltip.style.display = 'none';
}

var coll = document.getElementById("collapsible");
coll.addEventListener("click", function() {
this.classList.toggle("active");
var content = this.nextElementSibling;
if (content.style.display === "block") {
    content.style.display = "none";
} else {
    content.style.display = "block";
}
});


// Listen to the slider?
d3.select("#chargeSlider").on("change", function(d){
  selectedValue = this.value;
  chargeStrength = selectedValue;
  simulation.force("charge")
        .strength(-1*selectedValue)
  simulation.alpha(1).restart();
})

var selectedGroup = 0;
d3.selectAll("input[name='group_alg']").on("change", function(){
    selectedGroup = this.value;
    circles.transition().attr("fill", function(d) {return color(d.groups[selectedGroup]);})
});