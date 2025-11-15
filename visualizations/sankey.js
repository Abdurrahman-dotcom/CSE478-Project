// Sankey Diagram Visualization
// Innovative visualization showing flow from conflict types to casualty types

function initSankey() {
    const container = d3.select('#sankey-viz');
    const margin = { top: 40, right: 200, bottom: 40, left: 200 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create sankey generator
    const sankey = d3.sankey()
        .nodeWidth(20)
        .nodePadding(40)
        .extent([[0, 0], [width, height]]);
    
    // Create tooltip
    const tooltip = createTooltip();
    
    // Draw function
    function draw(data) {
        // Clear previous
        svg.selectAll('*').remove();
        
        // Prepare sankey data from filtered conflicts
        const sankeyData = prepareSankeyDataFromFiltered(data);
        
        // Generate sankey layout
        const { nodes, links } = sankey(sankeyData);
        
        // Draw links
        const link = svg.append('g')
            .attr('class', 'links')
            .selectAll('path')
            .data(links)
            .enter()
            .append('path')
            .attr('d', d3.sankeyLinkHorizontal())
            .attr('stroke', d => {
                // Color by source (conflict type)
                const sourceType = d.source.name;
                return getConflictTypeColor(sourceType);
            })
            .attr('stroke-width', d => Math.max(1, d.width))
            .attr('fill', 'none')
            .style('opacity', 0.4)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).style('opacity', 0.7);
                
                const html = `
                    <strong>${d.source.name} → ${d.target.name}</strong><br/>
                    Deaths: ${formatNumber(d.value)}
                `;
                showTooltip(tooltip, html, event);
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).style('opacity', 0.4);
                hideTooltip(tooltip);
            });
        
        // Draw nodes
        const node = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('rect')
            .data(nodes)
            .enter()
            .append('g');
        
        node.append('rect')
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('height', d => d.y1 - d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('fill', d => {
                if (d.type === 'conflict') {
                    return getConflictTypeColor(d.name);
                } else {
                    return d.name.includes('Military') ? '#3498db' : '#e67e22';
                }
            })
            .style('stroke', '#2c3e50')
            .style('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).style('opacity', 0.8);
                
                const totalValue = d.value || 0;
                const html = `
                    <strong>${d.name}</strong><br/>
                    Total Deaths: ${formatNumber(totalValue)}
                `;
                showTooltip(tooltip, html, event);
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).style('opacity', 1);
                hideTooltip(tooltip);
            });
        
        // Add node labels
        node.append('text')
            .attr('x', d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
            .attr('y', d => (d.y1 + d.y0) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
            .style('font-size', '14px')
            .style('font-weight', '600')
            .text(d => d.name);
        
        // Add value labels
        node.append('text')
            .attr('x', d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
            .attr('y', d => (d.y1 + d.y0) / 2 + 18)
            .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
            .style('font-size', '11px')
            .style('fill', '#7f8c8d')
            .text(d => formatNumber(d.value || 0));
    }
    
    // Prepare sankey data from filtered conflicts
    function prepareSankeyDataFromFiltered(data) {
        const typeGroups = d3.group(data, d => d.conflict_type);
        
        const nodes = [];
        const links = [];
        let nodeIndex = 0;
        
        // Create nodes for conflict types (left side)
        const typeNodes = {};
        typeGroups.forEach((conflicts, type) => {
            typeNodes[type] = nodeIndex;
            nodes.push({ name: type, type: 'conflict' });
            nodeIndex++;
        });
        
        // Create nodes for casualty types (right side)
        const militaryNode = nodeIndex++;
        const civilianNode = nodeIndex++;
        nodes.push({ name: 'Military Deaths', type: 'casualty' });
        nodes.push({ name: 'Civilian Deaths', type: 'casualty' });
        
        // Create links from conflict types to casualty types
        typeGroups.forEach((conflicts, type) => {
            const militaryDeaths = d3.sum(conflicts, d => d.military_deaths);
            const civilianDeaths = d3.sum(conflicts, d => d.civilian_deaths);
            
            if (militaryDeaths > 0) {
                links.push({
                    source: typeNodes[type],
                    target: militaryNode,
                    value: militaryDeaths
                });
            }
            
            if (civilianDeaths > 0) {
                links.push({
                    source: typeNodes[type],
                    target: civilianNode,
                    value: civilianDeaths
                });
            }
        });
        
        return { nodes, links };
    }
    
    // Initial draw
    draw(warData);
    
    // Return API
    return {
        update: draw
    };
}
