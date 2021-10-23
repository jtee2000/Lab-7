Promise.all([
  d3.json("airports.json", d3.autoType),
  d3.json("world-110m.json", d3.autoType)
])
  .then(data => {
    let airports = data[0] 
    let worldmap = data[1] 

    const n = airports.nodes 
    const l = airports.links 
    const features = topojson.feature(worldmap, worldmap.objects.countries).features 
    const height = 400 
    const width = 600 
  
  
    const svg = d3.select("body")
        .append("svg")
        .attr("viewBox", [-width/2, -height/2, width, height])  
  
    const projection = d3.geoMercator()
        .fitExtent([[-width,-height/2],[width, height/1.5]], topojson.feature(worldmap, worldmap.objects.countries)) 
    
    const path= d3.geoPath()
        .projection(projection) 
    
    
    const map=svg.append("g")
        .attr("class","map")
        .selectAll("path")
        .data(features)
        .join("path")
        .attr("d", path) 
    
    svg.append("path")
        .datum(topojson.mesh(worldmap, worldmap.objects.countries))
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr("class", "subunit-boundary")
        .attr("d", path)  
  
    const size= d3.scaleLinear()
        .domain(d3.extent( n, d => d.passengers))
        .range([4, 10])  

    const force = d3.forceSimulation(n)
        .force("charge", d3.forceManyBody())              
        .force("link", d3.forceLink(l))    
        .force("x", d3.forceX())
        .force("y", d3.forceY()) 

    let drag = (force,t) => {
        function initializeDrag(e) {
          if(!e.active) force.alphaTarget(0.3).restart()
          e.subject.fx = e.subject.x
          e.subject.fy = e.subject.y
        }
        function isDragged(e) {
          e.subject.fx = e.x
          e.subject.fy = e.y
        }
        function stopDrag(e) {
          if (!e.active) force.alphaTarget(0)
          e.subject.fx = null
          e.subject.fy = null
        }
 
        return d3.drag()
            .on("start", initializeDrag)
            .on("drag", isDragged)
            .on("end", stopDrag)
            .filter( t === "force")    
  }
  const nodes = svg.selectAll("circle")
    .data(n)                              
    .join("circle") 
    .attr("fill","blue")
    .attr("r", d => size( d.passengers))

  const links = svg.append("g").selectAll("line")               
    .data(l)                            
    .join("line")               
    .style("stroke", "#ccc")               
    .style("stroke-width", 1) 
  
   
  
  nodes.call(drag(force,"force")) 
  
    force.on("tick", ()=>{
        nodes.attr("cx",d=>{ return d.x  })
             .attr("cy",d=>{ return d.y }) 
      
        links.attr("x1", (d) => d.source.x)         
          .attr("y1", (d) =>  d.source.y)         
          .attr("x2", (d) => d.target.x)         
          .attr("y2",(d) => d.target.y)
      })
      
   map.attr("opacity",0)

    function switchLayout(visType) {
        if (visType === "map") {
          force.stop() 
          map.attr("opacity",1)
            
          nodes
             .call(drag(force, visType))
             .transition()
             .duration(1000)
             .attr("cy",d => { d.y = projection([d.longitude, d.latitude])[1]  
                return d.y }) 
             .attr("cx",d => { d.x = projection([d.longitude, d.latitude])[0]  
                return d.x })      
        
          links
            .transition()
            .duration(1000)
            .attr("x1", (d) => d.source.x)  
            .attr("y1", (d) => d.source.y)         
            .attr("x2", (d) => d.target.x)         
            .attr("y2", (d) => d.target.y)  
        
         nodes.on("mouseover", (e,d) => {
            const pos = d3.pointer(e, window) 
            d3.select("#tooltip")
            .style("left", pos[0] + "px")
            .style("top", pos[1] + "px")
            .select("#value")
            .html(
               d.name 
             ) 
            d3.select("#tooltip").classed("hidden", false) 
        })
        .on("mouseleave",() => {
           d3.select("#tooltip").classed("hidden", true) 
         }) 
    
        } 
        else { 
          d3.select("#tooltip").classed("hidden", true)
          force.alpha(1).restart()
          nodes.call(drag(force,"force"))
          nodes.on("mouseover", () => {
          d3.select("#tooltip").classed("hidden", true)
         })
          map.attr("opacity",0)
      }
    }

    d3.selectAll("input").on("change", event => {
        const visType = event.target.value
        switchLayout(visType) 
      })
  })
  