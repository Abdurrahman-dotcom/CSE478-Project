// Map Visualization
// Interactive world map showing geographic distribution of conflicts

function initMap() {
    const container = d3.select('#map-viz');
    const width = container.node().getBoundingClientRect().width;
    const height = 600;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // Create projection
    const projection = d3.geoMercator()
        .center([0, 40])
        .scale(width / 6.5)
        .translate([width / 2, height / 2]);
    
    const path = d3.geoPath().projection(projection);
    
    // Create map group
    const mapGroup = svg.append('g').attr('class', 'map-group');
    const conflictsGroup = svg.append('g').attr('class', 'conflicts-group');
    
    // Draw world map using Natural Earth 110m data
    // For now, we'll draw a more detailed simplified world map
    const worldGeoJSON = {
        "type": "FeatureCollection",
        "features": [
            // This is a simplified representation - for production, use actual GeoJSON from naturalearthdata.com
            // Each feature represents a simplified country/region boundary
        ]
    };
    
    // Load and draw world map from external source or use simplified version
    // Using a public GeoJSON CDN for world countries
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then(response => response.json())
        .then(worldData => {
            const countries = topojson.feature(worldData, worldData.objects.countries);
            
            mapGroup.selectAll('.country')
                .data(countries.features)
                .enter()
                .append('path')
                .attr('class', 'country')
                .attr('d', path)
                .attr('fill', '#e8f4f8')
                .attr('stroke', '#b0c4de')
                .attr('stroke-width', 0.5)
                .style('opacity', 0.8);
        })
        .catch(error => {
            console.warn('Could not load world map, using simplified version');
            // Fallback: Draw simplified continents if CDN fails
            drawSimplifiedMap();
        });
    
    // Fallback function for simplified map
    function drawSimplifiedMap() {
        const continents = [
            // North America
            { name: 'North America', d: 'M150,100 Q180,80 220,90 L280,120 Q300,150 280,200 L260,250 Q240,280 220,260 L180,220 Q160,180 150,140 Z' },
            // South America
            { name: 'South America', d: 'M220,280 Q240,300 250,350 L260,400 Q250,450 230,440 L210,420 Q200,380 210,340 Z' },
            // Europe
            { name: 'Europe', d: 'M480,120 Q520,100 560,120 L600,140 Q590,170 570,180 L540,170 Q500,160 480,140 Z' },
            // Africa
            { name: 'Africa', d: 'M480,200 Q520,180 560,200 L590,240 Q600,280 590,320 L570,360 Q540,380 510,370 L480,340 Q470,300 480,260 Z' },
            // Asia
            { name: 'Asia', d: 'M600,100 Q680,80 760,100 L840,140 Q880,180 860,240 L820,280 Q780,260 740,250 L680,230 Q640,200 620,160 Z' },
            // Oceania
            { name: 'Oceania', d: 'M800,340 Q840,330 880,350 L920,380 Q910,410 880,420 L840,410 Q810,390 800,360 Z' }
        ];
        
        mapGroup.selectAll('.continent')
            .data(continents)
            .enter()
            .append('path')
            .attr('class', 'continent')
            .attr('d', d => d.d)
            .attr('fill', '#e8f4f8')
            .attr('stroke', '#b0c4de')
            .attr('stroke-width', 1.5)
            .style('opacity', 0.8);
    }
    
    // Create size scale for circles
    const sizeScale = d3.scaleSqrt()
        .range([3, 40]);
    
    // Create tooltip
    const tooltip = createTooltip();
    
    // Create legend
    createLegend();
    
    function createLegend() {
        const legend = d3.select('#map-legend');
        legend.html(''); // Clear existing
        
        const legendData = [
            { type: 'Interstate', color: getConflictTypeColor('Interstate') },
            { type: 'Civil War', color: getConflictTypeColor('Civil War') },
            { type: 'Colonial', color: getConflictTypeColor('Colonial') }
        ];
        
        legendData.forEach(item => {
            const div = legend.append('div')
                .attr('class', 'legend-item');
            
            div.append('div')
                .attr('class', 'legend-color')
                .style('background-color', item.color);
            
            div.append('span')
                .text(item.type);
        });
        
        // Add size legend
        legend.append('div')
            .attr('class', 'legend-item')
            .style('margin-top', '10px')
            .html('<small><em>Circle size represents death toll</em></small>');
    }
    
    // Draw function
    function draw(data) {
        // Update size scale
        const maxDeaths = d3.max(data, d => d.total_deaths) || 1000000;
        sizeScale.domain([0, maxDeaths]);
        
        // Apply force simulation to prevent overlapping circles
        const simulation = d3.forceSimulation(data)
            .force('x', d3.forceX(d => projection([d.longitude, d.latitude])[0]).strength(0.8))
            .force('y', d3.forceY(d => projection([d.longitude, d.latitude])[1]).strength(0.8))
            .force('collide', d3.forceCollide(d => sizeScale(d.total_deaths) + 2))
            .stop();
        
        // Run simulation for a fixed number of ticks
        for (let i = 0; i < 120; i++) simulation.tick();
        
        // Bind data
        const circles = conflictsGroup.selectAll('.conflict-circle')
            .data(data, d => d.conflict_name);
        
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
            .attr('cx', d => d.x || projection([d.longitude, d.latitude])[0])
            .attr('cy', d => d.y || projection([d.longitude, d.latitude])[1])
            .attr('r', 0)
            .attr('fill', d => getConflictTypeColor(d.conflict_type))
            .style('cursor', 'pointer')
            .style('opacity', 0.5)
            .style('stroke', 'white')
            .style('stroke-width', 1.5);
        
        // Enter + Update
        circlesEnter.merge(circles)
            .on('mouseover', function(event, d) {
                // Bring to front
                d3.select(this).raise();
                
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('opacity', 1)
                    .style('stroke', '#2c3e50')
                    .style('stroke-width', 2);
                
                const html = `
                    <strong>${d.conflict_name}</strong><br/>
                    Years: ${formatYearRange(d.start_year, d.end_year)}<br/>
                    Type: ${d.conflict_type}<br/>
                    Region: ${d.geographic_region}<br/>
                    Total Deaths: ${formatNumber(d.total_deaths)}
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
                    .transition()
                    .duration(200)
                    .style('opacity', 0.5)
                    .style('stroke', 'white')
                    .style('stroke-width', 1.5);
                hideTooltip(tooltip);
            })
            .on('click', function(event, d) {
                setConflictFilter(d.conflict_name);
            })
            .transition()
            .duration(750)
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', d => sizeScale(d.total_deaths))
            .style('opacity', 0.5);
    }
    
    // Initial draw
    draw(warData);
    
    // Return API
    return {
        update: draw
    };
}
