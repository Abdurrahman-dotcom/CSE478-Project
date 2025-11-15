// Timeline Visualization
// Interactive timeline showing conflicts over time with proportional bars

function initTimeline() {
    const container = d3.select('#timeline-viz');
    const margin = { top: 40, right: 60, bottom: 80, left: 80 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    let useLogScale = false;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const xScale = d3.scaleLinear()
        .domain([1200, 2030])
        .range([0, width]);
    
    let yScale = d3.scaleLinear()
        .range([height, 0]);
    
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
        .text('Total Deaths');
    
    // Create tooltip
    const tooltip = createTooltip();
    
    // Draw function
    function draw(data) {
        // Update y scale based on data and scale type
        const maxDeaths = d3.max(data, d => d.total_deaths);
        
        if (useLogScale) {
            yScale = d3.scaleLog()
                .domain([1000, maxDeaths || 1000000])
                .range([height, 0])
                .clamp(true);
        } else {
            yScale = d3.scaleLinear()
                .domain([0, maxDeaths || 1000000])
                .range([height, 0]);
        }
        
        yAxis.scale(yScale);
        yAxisGroup.transition().duration(750).call(yAxis);
        xAxisGroup.call(xAxis);
        
        // Bind data
        const bars = svg.selectAll('.conflict-bar')
            .data(data, d => d.conflict_name);
        
        // Exit
        bars.exit()
            .transition()
            .duration(500)
            .attr('height', 0)
            .attr('y', height)
            .style('opacity', 0)
            .remove();
        
        // Enter + Update
        const barsEnter = bars.enter()
            .append('rect')
            .attr('class', 'conflict-bar conflict-element')
            .attr('data-conflict', d => d.conflict_name)
            .attr('x', d => xScale(d.start_year))
            .attr('y', height)
            .attr('height', 0)
            .attr('fill', d => getConflictTypeColor(d.conflict_type))
            .style('cursor', 'pointer')
            .style('opacity', 0.8);
        
        barsEnter.merge(bars)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .style('opacity', 1)
                    .style('stroke', '#2c3e50')
                    .style('stroke-width', 2);
                
                const html = `
                    <strong>${d.conflict_name}</strong><br/>
                    Years: ${formatYearRange(d.start_year, d.end_year)}<br/>
                    Type: ${d.conflict_type}<br/>
                    Total Deaths: ${formatNumber(d.total_deaths)}<br/>
                    Military: ${formatNumber(d.military_deaths)}<br/>
                    Civilian: ${formatNumber(d.civilian_deaths)}
                `;
                showTooltip(tooltip, html, event);
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .style('opacity', 0.8)
                    .style('stroke', 'none');
                hideTooltip(tooltip);
            })
            .on('click', function(event, d) {
                setConflictFilter(d.conflict_name);
            })
            .transition()
            .duration(750)
            .attr('x', d => xScale(d.start_year))
            .attr('width', d => Math.max(2, xScale(d.end_year) - xScale(d.start_year)))
            .attr('y', d => yScale(d.total_deaths))
            .attr('height', d => height - yScale(d.total_deaths))
            .style('opacity', 0.8);
    }
    
    // Initial draw
    draw(warData);
    
    // Return API
    return {
        update: draw,
        toggleScale: function(useLog) {
            useLogScale = useLog;
            draw(getFilteredData());
        }
    };
}
