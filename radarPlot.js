// ////////////////////////////////////////////////////////////
// ///////////////// The Radar Plot Function //////////////////
// /////////// Written by Iraquitan Cordeiro Filho ////////////
// ////////////////// github.com/iraquitan ////////////////////
// // Inspired by the code of Mike Bostock and Nadieh Bremer //
// ////////////////////////////////////////////////////////////

function radarPlot (id, data, options) {
  var cfg = {
    w: 960, // Width of the circle
    h: 500, // Height of the circle
    container: 'body',
    pad: 60,
    innerRadius: 45,
    radiusDomain: [0, Math.exp(3)],
    radiusScale: 'linear',
    // radarCurve: d3.curveCardinalClosed,
    // radarCurve: d3.curveCatmullRomClosed,
    radarCurve: d3.curveLinearClosed,
    // radarCurve: d3.curveBasisClosed,
    margin: { top: 70, right: 50, bottom: 60, left: 50 }, // The margins of the SVG
    levels: 3, // How many levels or inner circles should there be drawn
    maxValue: 0, // What is the value that the biggest circle will represent
    labelFactor: 1.25, // How much farther than the radius of the outer circle should the labels be placed
    wrapWidth: 60, // The number of pixels after which a label needs to be given a new line
    opacityArea: 0.35, // The opacity of the area of the blob
    opacityAreaMouseOver: 0.7, // The opacity of the area of the radar area when mouse is over
    dotRadius: 2.5, // The size of the colored circles of each blog
    opacityCircles: 0.1, // The opacity of the circles of each blob
    strokeWidth: 1.5, // The width of the stroke around each blob
    roundStrokes: false, // If true the area and stroke will follow a round path (cardinal-closed)
    color: d3.schemeCategory10, // Color function
    title: 'Template title',
    legendTitle: 'Template legend title',
    legend: ['Legend 1', 'Legend 2'],
    pieData: {},
    pieInnerRadius: 25,
    pieOuterRadius: 35,
    allAxis: undefined,
    enableDownload: false
  }
  // Put all of the options into a variable called cfg
  if (typeof options !== 'undefined') {
    for (var i in options) {
      if (typeof options[i] !== 'undefined') { cfg[i] = options[i] }
    }// for i
  }// if

  var allAxis
  if (typeof cfg.allAxis === 'undefined') {
    allAxis = d3.keys(data[0]).sort(d3.ascending) // The data column names
  } else {
    allAxis = cfg.allAxis
  }
  var total = allAxis.length // The number of different axes
  var outerRadius = Math.min(cfg.w / 2, cfg.h / 2) // Radius of the outermost circle
  var angleSlice = Math.PI * 2 / total // The width in radians of each "slice"
  var Format = d3.format('.2f') // Percentage formatting
  var angleScale = d3.scaleLinear()
//   var angleScale = d3.scalePoint()
    .range([0, 2 * Math.PI])
    .domain([0, total * angleSlice])
    // .domain(allAxis.concat(['']))

  var radiusScale
  if (cfg.radiusScale === 'linear') {
    radiusScale = d3.scaleLinear()
      .range([cfg.innerRadius, outerRadius])
  } else if (cfg.radiusScale === 'log') {
    radiusScale = d3.scaleLog()
    //   .base(Math.E)
      .range([cfg.innerRadius, outerRadius])
  }
  radiusScale
    .domain(cfg.radiusDomain)

  // / //////////////////////////////////////////////////////
  // / ///////// Create the container SVG and g /////////////
  // / //////////////////////////////////////////////////////
  // Remove whatever chart with the same id/class was present before
  //   d3.select(cfg.container).select('svg').remove()
  d3.select(cfg.container).select(`#radar-${id}`).remove()

  var container = d3.select(cfg.container).append('div')
    .attr('class', 'radarPlotContainer')

  // Initiate the radar chart SVG
//   var svg = d3.select(cfg.container).append('svg')
  var svg = container.append('svg')
    .attr('width', cfg.w + cfg.margin.left + cfg.margin.right)
    .attr('height', cfg.h + cfg.margin.top + cfg.margin.bottom)
    .attr('class', 'radar-' + id)
    .attr('id', 'radar-' + id)

  // Append a g element
  var g = svg.append('g')
    .attr('transform', 'translate(' + (cfg.w / 2 + cfg.margin.left) + ',' + (cfg.h / 2 + cfg.margin.top) + ')')

  // Add the title
  var title = svg.append('text')
    .attr('id', 'title')
    .attr('x', cfg.w / 2 - 20)
    .attr('y', cfg.margin.top - 50)
    .attr('dy', '-.6em')
    // .attr('text-anchor', 'middle')
    .attr('fill', 'black')
    .style('font', 'bold 14px sans-serif')
    .text(cfg.title)

  // / //////////////////////////////////////////////////////
  // / //////////// Draw the Circular grid //////////////////
  // / //////////////////////////////////////////////////////
  // Wrapper for the grid & axes
  var axisGrid = g.append('g').attr('class', 'axisWrapper')

  // / //////////////////////////////////////////////////////
  // / ///////////////// Draw the axes //////////////////////
  // / //////////////////////////////////////////////////////
  var axis = axisGrid.selectAll('.axis')
    // .data(d3.range(angle.domain()[1]))
    .data(allAxis)
    .enter().append('g')
    .attr('class', 'axis')
    .attr('id', (d) => { return `axis-${d}` })
    .attr('transform', function (d, i) { return 'rotate(' + angleScale(i * angleSlice) * 180 / Math.PI + ')' })
    // .attr('transform', function (d, i) { return 'rotate(' + angleScale(d) * 180 / Math.PI + ')' })
    .call(d3.axisLeft()
      .scale(radiusScale.copy().range([-cfg.innerRadius, -outerRadius]))
      .tickValues([])
    )
    .append('text')
    .attr('y', -outerRadius - 15)
    .attr('dy', '.71em')
    .attr('text-anchor', 'middle')
    .attr('fill', 'black')
    .text(function (d) { return d.toUpperCase() })

  g.select(`#axis-${allAxis[0]}`)
    .call(d3.axisLeft()
      .scale(radiusScale.copy().range([-cfg.innerRadius, -outerRadius]))
      .tickValues(d3.ticks(cfg.radiusDomain[0], cfg.radiusDomain[1], 5))
    )

    // / //////////////////////////////////////////////////////
    // / ////////// Draw the radar chart blobs ////////////////
    // / //////////////////////////////////////////////////////
  var radarLine = d3.lineRadial()
    .angle(function (d, i) { return angleScale(i * angleSlice) })
    .radius(function (d) { return radiusScale(d.value) })
    .curve(cfg.radarCurve)

  var radarArea = d3.areaRadial()
    .angle(function (d) { return angleScale(d.key) })
    .innerRadius(function (d) { return cfg.innerRadius })
    .outerRadius(function (d) { return radiusScale(d.value) })
    .curve(cfg.radarCurve)

  if (cfg.roundStrokes) {
    // radarLine.interpolate("cardinal-closed");
  }

  var radarGroup = g.selectAll('.radarGroup')
    .data(data)
    .enter().append('g')
    .attr('class', 'radarGroup')

  // Append the radar areas
  radarGroup
    .append('path')
    .attr('class', 'radarArea')
    // .attr('d', function (d, i) { return radarLine(d3.entries(d)) + 'Z' })
    .attr('d', function (d, i) { return radarLine(sortedEntries(d)) + 'Z' })
    .style('fill', function (d, i) { return cfg.color[i] })
    .attr('fill-opacity', cfg.opacityArea)
    // .attr('stroke', 'black')
    .on('mouseover', function (d) {
      d3.select(this)
        .style('fill-opacity', cfg.opacityAreaMouseOver)
    })
    .on('mouseout', function (d) {
      d3.select(this)
        .style('fill-opacity', cfg.opacityArea)
    })

  // Create the outlines
  radarGroup.append('path')
    .attr('class', 'radarStroke')
    // .attr('d', function (d, i) { return radarLine(d3.entries(d)) + 'Z' })
    .attr('d', function (d, i) { return radarLine(sortedEntries(d)) + 'Z' })
    .style('stroke-width', cfg.strokeWidth + 'px')
    .style('stroke', function (d, i) { return cfg.color[i] })
    // .style('stroke', 'black')
    .style('fill', 'none')
    // .style("filter", "url(#glow)");

    // Sort radar areas by sum of all key values
  radarGroup.sort((a, b) => {
    var aSum = d3.sum(d3.values(a))
    var bSum = d3.sum(d3.values(b))
        // return aSum < bSum ? -1 : aSum > bSum ? 1 : aSum >= bSum ? 0 : NaN;
    return bSum < aSum ? -1 : bSum > aSum ? 1 : bSum >= aSum ? 0 : NaN
  })

  // / //////////////////////////////////////////////////////
  // / ///////// Append Arcs fr Grouping Attributes /////////
  // / //////////////////////////////////////////////////////
  var arc = d3.arc()
    .innerRadius(outerRadius + cfg.pieInnerRadius)
    .outerRadius(outerRadius + cfg.pieOuterRadius)
    .padAngle(0.03)

  var pieAngle = d3.scaleLinear()
    .range([0, 2 * Math.PI])
    .domain([0, total])
  var pie = d3.pie().sort(null).startAngle(pieAngle(-0.5)).endAngle(pieAngle(total + 0.5))

  var arcs = pie(d3.values(cfg.pieData))
  var arcGroup = g.selectAll('.arcGroup')
    .data(arcs)
    .enter().append('g')
    .attr('class', 'arcGroup')

  arcGroup
    .append('path')
    .attr('d', function (d) { return arc(d) })
    .style('fill', function (d, i) { return cfg.color[i] })
    .attr('fill-opacity', 0.5)
    .attr('stroke', 'black')

  arcGroup
    .append('text')
    .attr('x', (d) => { return arc.centroid(d)[0] })
    .attr('y', (d) => { return arc.centroid(d)[1] })
    .attr('dy', '-1em')
    .attr('text-anchor', 'middle')
    .attr('fill', (d, i) => { return cfg.color[i] })
    .attr('transform', (d) => {
      let rad = (d.startAngle + d.endAngle) / 2
      let rot = rad * 180 / Math.PI
      let xy = arc.centroid(d)
      return 'rotate(' + rot + ',' + xy + ')'
    })
    .text((d, i) => { return d3.keys(cfg.pieData)[i] })

  // / //////////////////////////////////////////////////////
  // / ///////////////// Append the circles /////////////////
  // / //////////////////////////////////////////////////////
  data.forEach((dot, dotIx) => {
    radarGroup.selectAll(`.radarCircle-${dotIx}`)
    //   .data(d3.entries(dot))
      .data(sortedEntries(dot))
      .enter().append('circle')
      .attr('class', 'radarCircle')
      .attr('r', cfg.dotRadius)
      .attr('cx', function (d, i) { return radiusScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2) })
      .attr('cy', function (d, i) { return radiusScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2) })
      .style('fill', function (d) { return cfg.color[dotIx] })
      .style('fill-opacity', 0.8)
  })

  // / //////////////////////////////////////////////////////
  // / ///// Append invisible circles for tooltip ///////////
  // / //////////////////////////////////////////////////////

  // Wrapper for the invisible circles on top
  var radarDotGroup = g.selectAll('.radarDotGroup')
    .data(data)
    .enter().append('g')
    .attr('class', 'radarDotGroup')

  // Append a set of invisible circles on top for the mouseover pop-up
  radarDotGroup.selectAll('.radarInvisibleDot')
    // .data(function (d, i) { return d3.entries(d) })
    .data(function (d, i) { return sortedEntries(d) })
    .enter().append('circle')
    .attr('class', 'radarInvisibleDot')
    .attr('r', cfg.dotRadius * 1.5)
    .attr('cx', function (d, i) { return radiusScale(d.value) * Math.cos(angleSlice * i - Math.PI / 2) })
    .attr('cy', function (d, i) { return radiusScale(d.value) * Math.sin(angleSlice * i - Math.PI / 2) })
    .style('fill', 'none')
    .style('pointer-events', 'all')
    .on('mouseover', function (d, i) {
      let newX = parseFloat(d3.select(this).attr('cx')) - 10
      let newY = parseFloat(d3.select(this).attr('cy')) - 10

      tooltip
        .attr('x', newX)
        .attr('y', newY)
        .text(Format(d.value))
        .transition().duration(200)
        .style('opacity', 1)
    })
    .on('mouseout', function () {
      tooltip.transition().duration(200)
        .style('opacity', 0)
    })

  // Set up the small tooltip for when you hover over a circle
  var tooltip = g.append('text')
    .attr('class', 'tooltip')
    .style('opacity', 0)

  // / /////////////////////////////////////////
  // / //////// Initiate legend ////////////////
  // / /////////////////////////////////////////

  // Create the title for the legend
  var text = svg.append('text')
    .attr('class', 'title')
    .attr('transform', 'translate(20,0)')
    .attr('x', cfg.w - 388)
    .attr('y', 10)
    .attr('font-size', '12px')
    .attr('fill', '#404040')
    .text(cfg.legendTitle)

  // Initiate Legend
  var legend = svg.append('g')
    .attr('class', 'legend')
    .attr('height', 100)
    .attr('width', 200)
    .attr('transform', `translate(${(cfg.w / 2 - cfg.margin.right - 30)},${cfg.margin.top})`)

  // Create colour squares
  legend.selectAll('rect')
    .data(cfg.legend)
    .enter()
    .append('rect')
    .attr('x', (cfg.w / 2 + cfg.margin.left))
    .attr('y', function (d, i) { return i * 20 })
    .attr('width', 10)
    .attr('height', 10)
    .style('fill', function (d, i) { return cfg.color[i] })

  // Create text next to squares
  legend.selectAll('text')
    .data(cfg.legend)
    .enter()
    .append('text')
    .attr('x', cfg.w / 2 + cfg.margin.left)
    .attr('dx', '1.5em')
    .attr('y', function (d, i) { return i * 20 })
    .attr('dy', '.8em')
    .attr('font-size', '11px')
    .attr('fill', '#737373')
    .text(function (d) { return d })

  if (cfg.enableDownload) {
    writeDownloadLink(container)
  }

  function writeDownloadLink (container) {
    // get svg element.
    var svg = d3.select(`#radar-${id}`).node()

    // get svg source.
    var serializer = new XMLSerializer()
    var source = serializer.serializeToString(svg)

    // add name spaces.
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
    }
    if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"')
    }

    // add xml declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source

    // convert svg source to URI data scheme.
    var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source)
    // var url = 'data:application/octet-stream;base64,' + btoa(encodeURIComponent(source))

    // set url value to a element's href attribute.
    container.append('a')
        .attr('id', `download-radar-${id}`)
        .attr('href', url)
        .attr('download', `${id}.svg`)
        .attr('class', 'btn btn-info')
        .html(`Download #radar-${id}`)
  }

  function sortedEntries (d) {
    var entries = []
    for (const attr of allAxis) {
      entries.push({key: attr, value: d[attr]})
    }
    return entries
  }
}
