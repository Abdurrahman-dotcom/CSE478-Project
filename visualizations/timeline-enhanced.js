// Enhanced Timeline Visualization with Zoom
// Shows full history first, then allows zooming into 20th century

function initTimeline() {
    const container = d3.select('#timeline-viz');
    const margin = { top: 40, right: 60, bottom: 80, left: 80 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    let currentPeriod = 'all';
    let useLogScale = false;
    
    // Period definitions
    const periods = {
        'all': { start: 700, end: 2030, label: 'Full History' },
        '20th': { start: 1900, end: 2000, label: '20th Century' },
        'world-wars': { start: 1914, end: 1945, label: 'World Wars Era' },
        'cold-war': { start: 1945, end: 1991, label: 'Cold War Era' }
    };
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales
    let xScale = d3.scaleLinear()
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
    
    // Add grid lines
    const gridlines = svg.append('g')
        .attr('class', 'grid');
    
    // Add axis labels
    const xLabel = svg.append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text('Year');
    
    const yLabel = svg.append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text('Total Deaths');
    
    // Add period label
    const periodLabel = svg.append('text')
        .attr('class', 'period-label')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', '700')
        .style('fill', '#2c3e50');
    
    // Create tooltip
    const tooltip = createTooltip();
    
    // Draw function
    function draw(data, period = 'all') {
        currentPeriod = period;
        const periodInfo = periods[period];
        
        // Update period label
        periodLabel.text(periodInfo.label);
        
        // Filter data by period
        const filteredData = data.filter(d => 
            d.start_year <= periodInfo.end && d.end_year >= periodInfo.start
        );
        
        // Update x scale
        xScale.domain([periodInfo.start, periodInfo.end]);
        
        // Update y scale based on data and scale type
        const maxDeaths = d3.max(filteredData, d => d.total_deaths) || 1000000;
        
        if (useLogScale) {
            yScale = d3.scaleLog()
                .domain([1000, maxDeaths])
                .range([height, 0])
                .clamp(true);
        } else {
            yScale = d3.scaleLinear()
                .domain([0, maxDeaths])
                .range([height, 0]);
        }
        
        yAxis.scale(yScale);
        
        // Update axes with transition
        xAxisGroup.transition().duration(1000).call(xAxis);
        yAxisGroup.transition().duration(1000).call(yAxis);
        
        // Update grid lines
        gridlines.selectAll('line').remove();
        yScale.ticks(5).forEach(tick => {
            gridlines.append('line')
                .attr('x1', 0)
                .attr('x2', width)
                .attr('y1', yScale(tick))
                .attr('y2', yScale(tick))
                .attr('stroke', '#e0e0e0')
                .attr('stroke-dasharray', '2,2')
                .style('opacity', 0.5);
        });
        
        // Bind data
        const circles = svg.selectAll('.conflict-circle')
            .data(filteredData, d => d.conflict_name);
        
        // Exit
        circles.exit()
            .transition()
            .duration(500)
            .attr('r', 0)
            .style('opacity', 0)
            .remove();
        
        // Enter
        const circlesEnter = circles.enter()
            .append('circle')
            .attr('class', 'conflict-circle conflict-element')
            .attr('data-conflict', d => d.conflict_name)
            .attr('cx', d => xScale(d.start_year + (d.end_year - d.start_year) / 2))
            .attr('cy', height)
            .attr('r', 0)
            .attr('fill', d => getConflictTypeColor(d.conflict_type))
            .style('cursor', 'pointer')
            .style('opacity', 0.6)
            .style('stroke', 'white')
            .style('stroke-width', 1.5);
        
        // Enter + Update
        circlesEnter.merge(circles)
            .on('mouseover', function(event, d) {
                d3.select(this).raise();
                
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 1)
                    .style('stroke', '#2c3e50')
                    .style('stroke-width', 3)
                    .attr('r', d => Math.sqrt(d.total_deaths / 20000) * 1.3);
                
                const html = `
                    <strong>${d.conflict_name}</strong><br/>
                    Years: ${formatYearRange(d.start_year, d.end_year)}<br/>
                    Duration: ${d.end_year - d.start_year + 1} years<br/>
                    Type: ${d.conflict_type}<br/>
                    <hr style="margin: 5px 0; border: none; border-top: 1px solid rgba(255,255,255,0.3);">
                    Total Deaths: <strong>${formatNumber(d.total_deaths)}</strong><br/>
                    Military: ${formatNumber(d.military_deaths)}<br/>
                    Civilian: ${formatNumber(d.civilian_deaths)} 
                    (${((d.civilian_deaths / d.total_deaths) * 100).toFixed(0)}%)
                `;
                showTooltip(tooltip, html, event);
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 0.6)
                    .style('stroke', 'white')
                    .style('stroke-width', 1.5)
                    .attr('r', Math.sqrt(d.total_deaths / 20000));
                hideTooltip(tooltip);
            })
            .on('click', function(event, d) {
                setConflictFilter(d.conflict_name);
            })
            .transition()
            .duration(1000)
            .attr('cx', d => xScale(d.start_year + (d.end_year - d.start_year) / 2))
            .attr('cy', d => yScale(d.total_deaths))
            .attr('r', d => Math.sqrt(d.total_deaths / 20000))
            .style('opacity', 0.6);
    }
    
    // Initial draw
    draw(warData, 'all');
    
    // Return API
    return {
        update: function(data, state) {
            draw(data, currentPeriod);
        },
        toggleScale: function(useLog) {
            useLogScale = useLog;
            draw(getFilteredData(), currentPeriod);
        },
        zoomToPeriod: function(period) {
            draw(warData, period);
        }
    };
}

// Initialize zoomed timeline (for second timeline section)
function initTimelineZoom() {
    const container = d3.select('#timeline-zoom-viz');
    const margin = { top: 40, right: 60, bottom: 100, left: 80 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Focus on 1900-1980 initially
    const xScale = d3.scaleLinear()
        .domain([1900, 1980])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .range([height, 0]);
    
    // Create axes
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format('d'))
        .ticks(16);
    
    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d => formatNumber(d));
    
    // Add axis groups
    const xAxisGroup = svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`);
    
    const yAxisGroup = svg.append('g')
        .attr('class', 'y-axis');
    
    // Add labels
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height + 60)
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text('Year (Zoomed: 1900-1980)');
    
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -60)
        .style('font-size', '14px')
        .style('font-weight', '600')
        .text('Total Deaths');
    
    // Create tooltip
    const tooltip = createTooltip();
    
    // Draw function
    function draw(data) {
        // Filter to 20th century
        const filtered = data.filter(d => 
            d.start_year >= 1900 && d.start_year <= 1980
        );
        
        // Update y scale
        const maxDeaths = d3.max(filtered, d => d.total_deaths) || 1000000;
        yScale.domain([0, maxDeaths]);
        
        xAxisGroup.call(xAxis);
        yAxisGroup.call(yAxis);
        
        // Draw bars instead of circles for zoomed view
        const bars = svg.selectAll('.war-bar')
            .data(filtered, d => d.conflict_name);
        
        bars.exit()
            .transition()
            .duration(500)
            .attr('height', 0)
            .attr('y', height)
            .remove();
        
        const barsEnter = bars.enter()
            .append('rect')
            .attr('class', 'war-bar conflict-element')
            .attr('data-conflict', d => d.conflict_name)
            .attr('x', d => xScale(d.start_year))
            .attr('y', height)
            .attr('width', d => Math.max(2, xScale(d.end_year) - xScale(d.start_year)))
            .attr('height', 0)
            .attr('fill', d => getConflictTypeColor(d.conflict_type))
            .style('cursor', 'pointer')
            .style('opacity', 0.7);
        
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
                    Total Deaths: <strong>${formatNumber(d.total_deaths)}</strong><br/>
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
                    .style('opacity', 0.7)
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
            .attr('height', d => height - yScale(d.total_deaths));
    }
    
    draw(warData);
    
    return {
        update: draw
    };
}
