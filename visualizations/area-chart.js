// Area Chart Visualization
// Stacked area chart showing cumulative deaths over time by conflict type

function initAreaChart() {
    const container = d3.select('#area-viz');
    const margin = { top: 40, right: 120, bottom: 60, left: 80 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const xScale = d3.scaleLinear()
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .range([height, 0]);
    
    // Define color scale
    const colorScale = d3.scaleOrdinal()
        .domain(['Interstate', 'Civil War', 'Colonial'])
        .range([getConflictTypeColor('Interstate'), 
                getConflictTypeColor('Civil War'), 
                getConflictTypeColor('Colonial')]);
    
    // Create area generator
    const area = d3.area()
        .x(d => xScale(d.data.year))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveMonotoneX);
    
    // Create axes
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format('d'));
    
    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d => formatNumber(d));
    
    // Add axis groups
    const xAxisGroup = svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`);
    
    const yAxisGroup = svg.append('g')
        .attr('class', 'y-axis');
    
    // Add axis labels
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .style('font-size', '14px')
        .text('Year');
    
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)
        .style('font-size', '14px')
        .text('Cumulative Deaths');
    
    // Create legend
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width + 10}, 20)`);
    
    const legendItems = ['Interstate', 'Civil War', 'Colonial'];
    
    legendItems.forEach((item, i) => {
        const legendItem = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);
        
        legendItem.append('rect')
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', colorScale(item));
        
        legendItem.append('text')
            .attr('x', 24)
            .attr('y', 9)
            .attr('dy', '0.35em')
            .style('font-size', '12px')
            .text(item);
    });
    
    // Create tooltip
    const tooltip = createTooltip();
    
    // Draw function
    function draw(data) {
        // Prepare cumulative data
        const cumulativeData = prepareCumulativeData();
        
        // Filter by current time range
        const filterState = getFilterState();
        const filteredCumData = cumulativeData.filter(d => 
            d.year <= filterState.timeRange[1]
        );
        
        // Update scales
        xScale.domain(d3.extent(filteredCumData, d => d.year));
        yScale.domain([0, d3.max(filteredCumData, d => d.total) || 1000000]);
        
        // Update axes
        xAxisGroup.transition().duration(750).call(xAxis);
        yAxisGroup.transition().duration(750).call(yAxis);
        
        // Stack the data
        const stack = d3.stack()
            .keys(['Interstate', 'Civil War', 'Colonial'])
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);
        
        const series = stack(filteredCumData);
        
        // Bind data
        const areas = svg.selectAll('.area-path')
            .data(series, d => d.key);
        
        // Exit
        areas.exit()
            .transition()
            .duration(500)
            .style('opacity', 0)
            .remove();
        
        // Enter
        const areasEnter = areas.enter()
            .append('path')
            .attr('class', 'area-path')
            .attr('fill', d => colorScale(d.key))
            .style('opacity', 0.7)
            .style('cursor', 'pointer');
        
        // Enter + Update
        areasEnter.merge(areas)
            .on('mouseover', function(event, d) {
                d3.select(this).style('opacity', 1);
                
                // Find closest data point
                const [mouseX] = d3.pointer(event, this);
                const year = Math.round(xScale.invert(mouseX));
                const dataPoint = filteredCumData.find(p => p.year === year);
                
                if (dataPoint) {
                    const html = `
                        <strong>${d.key}</strong><br/>
                        Year: ${year}<br/>
                        Cumulative Deaths: ${formatNumber(dataPoint[d.key])}
                    `;
                    showTooltip(tooltip, html, event);
                }
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).style('opacity', 0.7);
                hideTooltip(tooltip);
            })
            .transition()
            .duration(750)
            .attr('d', area);
    }
    
    // Initial draw
    draw(warData);
    
    // Return API
    return {
        update: draw
    };
}
