// Bar Chart Visualization
// Ranked bar chart showing deadliest conflicts

function initBarChart() {
    const container = d3.select('#bar-viz');
    const margin = { top: 40, right: 60, bottom: 80, left: 250 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const xScale = d3.scaleLinear()
        .range([0, width]);
    
    const yScale = d3.scaleBand()
        .range([0, height])
        .padding(0.2);
    
    // Create axes
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d => formatNumber(d));
    
    const yAxis = d3.axisLeft(yScale);
    
    // Add axis groups
    const xAxisGroup = svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`);
    
    const yAxisGroup = svg.append('g')
        .attr('class', 'y-axis');
    
    // Add axis label
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .style('font-size', '14px')
        .text('Total Deaths');
    
    // Create tooltip
    const tooltip = createTooltip();
    
    // Draw function
    function draw(data) {
        // Get top 15 deadliest conflicts from filtered data
        const topConflicts = [...data]
            .sort((a, b) => b.total_deaths - a.total_deaths)
            .slice(0, 15);
        
        // Update scales
        xScale.domain([0, d3.max(topConflicts, d => d.total_deaths)]);
        yScale.domain(topConflicts.map(d => d.conflict_name));
        
        // Update axes
        xAxisGroup.transition().duration(750).call(xAxis);
        yAxisGroup.transition().duration(750).call(yAxis);
        
        // Bind data
        const bars = svg.selectAll('.ranking-bar')
            .data(topConflicts, d => d.conflict_name);
        
        // Exit
        bars.exit()
            .transition()
            .duration(500)
            .attr('width', 0)
            .style('opacity', 0)
            .remove();
        
        // Enter
        const barsEnter = bars.enter()
            .append('rect')
            .attr('class', 'ranking-bar conflict-element')
            .attr('data-conflict', d => d.conflict_name)
            .attr('x', 0)
            .attr('y', d => yScale(d.conflict_name))
            .attr('width', 0)
            .attr('height', yScale.bandwidth())
            .attr('fill', d => getConflictTypeColor(d.conflict_type))
            .style('cursor', 'pointer')
            .style('opacity', 0.8);
        
        // Enter + Update
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
                    Region: ${d.geographic_region}<br/>
                    Total Deaths: ${formatNumber(d.total_deaths)}<br/>
                    Military: ${formatNumber(d.military_deaths)}<br/>
                    Civilian: ${formatNumber(d.civilian_deaths)}<br/>
                    Civilian %: ${((d.civilian_deaths / d.total_deaths) * 100).toFixed(1)}%
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
            .attr('y', d => yScale(d.conflict_name))
            .attr('width', d => xScale(d.total_deaths))
            .attr('height', yScale.bandwidth())
            .style('opacity', 0.8);
        
        // Add death toll labels
        const labels = svg.selectAll('.bar-label')
            .data(topConflicts, d => d.conflict_name);
        
        labels.exit().remove();
        
        const labelsEnter = labels.enter()
            .append('text')
            .attr('class', 'bar-label')
            .attr('x', 0)
            .attr('y', d => yScale(d.conflict_name) + yScale.bandwidth() / 2)
            .style('opacity', 0);
        
        labelsEnter.merge(labels)
            .transition()
            .duration(750)
            .attr('x', d => xScale(d.total_deaths) + 5)
            .attr('y', d => yScale(d.conflict_name) + yScale.bandwidth() / 2)
            .attr('dy', '0.35em')
            .style('font-size', '11px')
            .style('fill', '#2c3e50')
            .style('opacity', 1)
            .text(d => formatNumber(d.total_deaths));
    }
    
    // Initial draw
    draw(warData);
    
    // Return API
    return {
        update: draw
    };
}
