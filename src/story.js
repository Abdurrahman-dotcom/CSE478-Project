// Story-driven visualization with scroll-based animations
// Implements the narrative: person → circle → many circles → timeline → zoom → split → drift

const storyViz = {
    width: window.innerWidth,
    height: window.innerHeight,
    svg: null,
    data: null,
    currentStep: 0,
    
    init() {
        // Setup SVG
        this.svg = d3.select('#main-viz')
            .attr('width', this.width)
            .attr('height', this.height);
        
        // Load data and start
        this.loadData();
        this.setupScrollObserver();
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.svg.attr('width', this.width).attr('height', this.height);
        });
    },
    
    async loadData() {
        try {
            console.log('Loading data...');
            const response = await fetch('data/wars_data.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.data = await response.json();
            console.log('Data loaded successfully:', this.data.length, 'conflicts');
            
            // Calculate military/civilian percentages for each war
            this.data.forEach(d => {
                d.military_pct = d.military_deaths / d.total_deaths;
                d.civilian_pct = d.civilian_deaths / d.total_deaths;
            });
            
            // Start with the person figure
            this.showPerson();
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load data. Please make sure you are running this from a web server (not file://)');
        }
    },
    
    setupScrollObserver() {
        const sections = document.querySelectorAll('.story-section');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    const step = parseInt(entry.target.dataset.step);
                    console.log('Scrolled to step:', step);
                    this.transitionToStep(step);
                }
            });
        }, {
            threshold: [0, 0.25, 0.5, 0.75, 1],
            rootMargin: '0px'
        });
        
        sections.forEach(section => observer.observe(section));
        
        // Explore button
        const exploreBtn = document.getElementById('explore-btn');
        if (exploreBtn) {
            exploreBtn.addEventListener('click', () => {
                window.location.href = 'explore.html';
            });
        }
    },
    
    transitionToStep(step) {
        // Allow re-triggering if scrolling back
        console.log(`Transitioning from step ${this.currentStep} to ${step}`);
        
        // Update debug indicator
        const indicator = document.getElementById('current-step');
        if (indicator) indicator.textContent = step;
        
        // Skip if same step unless going backwards
        if (step === this.currentStep && step > 0) return;
        
        this.currentStep = step;
        
        switch(step) {
            case 0: 
                this.showPerson(); 
                break;
            case 1: 
                this.showPerson(); 
                break;
            case 2: 
                this.personToCircle(); 
                break;
            case 3: 
                this.showManyCircles(); 
                break;
            case 4: 
                this.formTimeline(); 
                break;
            case 5: 
                this.zoomToModernEra(); 
                break;
            case 6: 
                this.breakApartCircles(); 
                break;
            case 7: 
                this.splitCircles(); 
                break;
            case 8: 
                this.beginDrift(); 
                break;
            case 9: 
                this.completeDrift(); 
                break;
            case 10: 
                this.emphasizeCivilians(); 
                break;
            case 11: 
                this.showConclusion(); 
                break;
        }
    },
    
    // STEP 0-1: Show person figure
    showPerson() {
        this.svg.selectAll('*').remove();
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        const personGroup = this.svg.append('g')
            .attr('class', 'person-figure')
            .attr('transform', `translate(${centerX}, ${centerY})`);
        
        // Simple person silhouette
        // Head
        personGroup.append('circle')
            .attr('cx', 0)
            .attr('cy', -60)
            .attr('r', 25)
            .attr('fill', '#2c3e50')
            .attr('opacity', 0)
            .transition()
            .duration(1000)
            .attr('opacity', 1);
        
        // Body
        personGroup.append('rect')
            .attr('x', -20)
            .attr('y', -30)
            .attr('width', 40)
            .attr('height', 70)
            .attr('rx', 5)
            .attr('fill', '#2c3e50')
            .attr('opacity', 0)
            .transition()
            .duration(1000)
            .delay(200)
            .attr('opacity', 1);
        
        // Arms
        personGroup.append('line')
            .attr('x1', -20)
            .attr('y1', -20)
            .attr('x2', -50)
            .attr('y2', 10)
            .attr('stroke', '#2c3e50')
            .attr('stroke-width', 8)
            .attr('stroke-linecap', 'round')
            .attr('opacity', 0)
            .transition()
            .duration(1000)
            .delay(400)
            .attr('opacity', 1);
        
        personGroup.append('line')
            .attr('x1', 20)
            .attr('y1', -20)
            .attr('x2', 50)
            .attr('y2', 10)
            .attr('stroke', '#2c3e50')
            .attr('stroke-width', 8)
            .attr('stroke-linecap', 'round')
            .attr('opacity', 0)
            .transition()
            .duration(1000)
            .delay(400)
            .attr('opacity', 1);
        
        // Legs
        personGroup.append('line')
            .attr('x1', -10)
            .attr('y1', 40)
            .attr('x2', -25)
            .attr('y2', 90)
            .attr('stroke', '#2c3e50')
            .attr('stroke-width', 8)
            .attr('stroke-linecap', 'round')
            .attr('opacity', 0)
            .transition()
            .duration(1000)
            .delay(600)
            .attr('opacity', 1);
        
        personGroup.append('line')
            .attr('x1', 10)
            .attr('y1', 40)
            .attr('x2', 25)
            .attr('y2', 90)
            .attr('stroke', '#2c3e50')
            .attr('stroke-width', 8)
            .attr('stroke-linecap', 'round')
            .attr('opacity', 0)
            .transition()
            .duration(1000)
            .delay(600)
            .attr('opacity', 1);
    },
    
    // STEP 2: Transform person into circle
    personToCircle() {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        // Fade out person
        this.svg.select('.person-figure')
            .transition()
            .duration(1000)
            .attr('opacity', 0)
            .remove();
        
        // Create single circle - very small to represent one life
        setTimeout(() => {
            this.svg.append('circle')
                .attr('class', 'single-circle')
                .attr('cx', centerX)
                .attr('cy', centerY)
                .attr('r', 0)
                .attr('fill', '#e74c3c')
                .attr('opacity', 0.9)
                .transition()
                .duration(1500)
                .attr('r', 4);
        }, 1000);
    },
    
    // STEP 3: Show many circles (all conflicts)
    showManyCircles() {
        if (!this.data) {
            console.log('Data not loaded yet');
            return;
        }
        
        console.log('Showing many circles, data length:', this.data.length);
        
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        // Remove everything first
        this.svg.selectAll('*').remove();
        
        // Scale for circle sizes
        const maxDeaths = d3.max(this.data, d => d.total_deaths);
        const radiusScale = d3.scaleSqrt()
            .domain([0, maxDeaths])
            .range([5, 80]);
        
        // Create unique color scale for each conflict
        const colorScale = d3.scaleOrdinal()
            .domain(this.data.map((d, i) => i))
            .range([
                '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
                '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b',
                '#27ae60', '#2980b9', '#8e44ad', '#f1c40f', '#d35400',
                '#95a5a6', '#c0392b', '#16a085', '#f39c12', '#9b59b6',
                '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'
            ]);
        
        // Initialize circles with positions for force simulation
        this.data.forEach((d, i) => {
            d.x = centerX + (Math.random() - 0.5) * 400;
            d.y = centerY + (Math.random() - 0.5) * 300;
            d.index = i;
        });
        
        // Create circles with unique colors
        const circles = this.svg.selectAll('.war-circle')
            .data(this.data)
            .enter()
            .append('circle')
            .attr('class', 'war-circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 0)
            .attr('fill', (d, i) => colorScale(i))
            .attr('opacity', 0)
            .attr('stroke', 'white')
            .attr('stroke-width', 2);
        
        // Animate appearance with stagger
        circles.transition()
            .duration(800)
            .delay((d, i) => i * 50)
            .attr('r', d => radiusScale(d.total_deaths))
            .attr('opacity', 0.75);
        
        // Apply force simulation to prevent overlaps
        const simulation = d3.forceSimulation(this.data)
            .force('charge', d3.forceManyBody().strength(5))
            .force('center', d3.forceCenter(centerX, centerY))
            .force('collision', d3.forceCollide().radius(d => radiusScale(d.total_deaths) + 3))
            .force('x', d3.forceX(centerX).strength(0.05))
            .force('y', d3.forceY(centerY).strength(0.05));
        
        simulation.on('tick', () => {
            circles
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        });
        
        // Stop simulation after settling
        setTimeout(() => simulation.stop(), 3000);
        
        // Add hover tooltips
        circles.on('mouseenter', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 1)
                .attr('stroke-width', 3);
            
            // Simple tooltip
            const tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0,0,0,0.8)')
                .style('color', 'white')
                .style('padding', '10px')
                .style('border-radius', '5px')
                .style('pointer-events', 'none')
                .style('left', event.pageX + 10 + 'px')
                .style('top', event.pageY + 10 + 'px')
                .html(`<strong>${d.conflict_name}</strong><br/>
                       ${d.start_year}-${d.end_year}<br/>
                       ${d.total_deaths.toLocaleString()} deaths`);
        })
        .on('mouseleave', function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 0.7)
                .attr('stroke-width', 2);
            
            d3.selectAll('.tooltip').remove();
        });
    },
    
    // STEP 4: Form timeline
    formTimeline() {
        if (!this.data) {
            console.log('Data not loaded for timeline');
            return;
        }
        
        console.log('Forming timeline');
        
        const margin = { top: 100, right: 100, bottom: 100, left: 100 };
        const width = this.width - margin.left - margin.right;
        const height = this.height - margin.top - margin.bottom;
        
        // Time scale
        const xScale = d3.scaleLinear()
            .domain([700, 2025])
            .range([margin.left, this.width - margin.right]);
        
        // Size scale
        const maxDeaths = d3.max(this.data, d => d.total_deaths);
        const radiusScale = d3.scaleSqrt()
            .domain([0, maxDeaths])
            .range([5, 60]);
        
        // Move circles to timeline positions
        this.svg.selectAll('.war-circle')
            .transition()
            .duration(2000)
            .ease(d3.easeCubicInOut)
            .attr('cx', d => xScale((d.start_year + d.end_year) / 2))
            .attr('cy', this.height / 2)
            .attr('r', d => radiusScale(d.total_deaths));
        
        // Add axis after transition
        setTimeout(() => {
            const xAxis = d3.axisBottom(xScale)
                .tickFormat(d3.format('d'))
                .ticks(10);
            
            this.svg.append('g')
                .attr('class', 'timeline-axis')
                .attr('transform', `translate(0, ${this.height / 2 + 150})`)
                .call(xAxis)
                .selectAll('text')
                .style('font-size', '14px')
                .style('fill', '#555');
        }, 2000);
    },
    
    // STEP 5: Zoom to modern era (1800-1970)
    zoomToModernEra() {
        console.log('Zooming to modern era');
        
        const margin = { top: 100, right: 100, bottom: 100, left: 100 };
        
        // New zoomed scale
        const xScale = d3.scaleLinear()
            .domain([1800, 1970])
            .range([margin.left, this.width - margin.right]);
        
        const maxDeaths = d3.max(this.data, d => d.total_deaths);
        const radiusScale = d3.scaleSqrt()
            .domain([0, maxDeaths])
            .range([8, 70]);
        
        // Filter and zoom
        this.svg.selectAll('.war-circle')
            .transition()
            .duration(2000)
            .ease(d3.easeCubicInOut)
            .attr('cx', d => {
                const year = (d.start_year + d.end_year) / 2;
                if (year < 1800 || year > 1970) {
                    return -100; // Move off screen
                }
                return xScale(year);
            })
            .attr('cy', this.height / 2)
            .attr('r', d => {
                const year = (d.start_year + d.end_year) / 2;
                if (year < 1800 || year > 1970) return 0;
                return radiusScale(d.total_deaths);
            })
            .attr('opacity', d => {
                const year = (d.start_year + d.end_year) / 2;
                return (year >= 1800 && year <= 1970) ? 0.7 : 0;
            });
        
        // Update axis
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d3.format('d'))
            .ticks(10);
        
        this.svg.select('.timeline-axis')
            .transition()
            .duration(2000)
            .call(xAxis);
    },
    
    // STEP 6: Break apart circles into individual deaths
    breakApartCircles() {
        console.log('Breaking apart circles into individual deaths');
        
        const margin = { top: 100, right: 100, bottom: 100, left: 100 };
        const xScale = d3.scaleLinear()
            .domain([1800, 1970])
            .range([margin.left, this.width - margin.right]);
        
        // Get filtered data (1800-1970)
        const filteredData = this.data.filter(d => {
            const year = (d.start_year + d.end_year) / 2;
            return year >= 1800 && year <= 1970;
        });
        
        // First, fade out and remove existing circles
        this.svg.selectAll('.war-circle')
            .transition()
            .duration(500)
            .attr('opacity', 0)
            .remove();
        
        // For each conflict, create many small circles
        const smallCircleRadius = 4; // Same as the initial "one death" circle
        const allSmallCircles = [];
        
        // Color scale matching the one used in showManyCircles
        const colorScale = d3.scaleOrdinal()
            .domain(this.data.map((d, i) => i))
            .range([
                '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
                '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b',
                '#27ae60', '#2980b9', '#8e44ad', '#f1c40f', '#d35400',
                '#95a5a6', '#c0392b', '#16a085', '#f39c12', '#9b59b6',
                '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'
            ]);
        
        filteredData.forEach(d => {
            const centerX = xScale((d.start_year + d.end_year) / 2);
            const centerY = this.height / 2;
            
            // Calculate how many small circles to create based on total deaths
            // Reduced significantly for better performance
            const numCircles = Math.max(10, Math.min(150, Math.floor(d.total_deaths / 200000)));
            
            const conflictIndex = this.data.indexOf(d);
            const color = colorScale(conflictIndex);
            
            // Calculate the vertical spread proportional to deaths (like the original circles)
            // Use the same scale as the original visualization
            const maxDeaths = d3.max(filteredData, d => d.total_deaths);
            const radiusScale = d3.scaleSqrt()
                .domain([0, maxDeaths])
                .range([20, 120]); // Increased range for better visibility
            
            const verticalSpread = radiusScale(d.total_deaths);
            
            // Create small circles spread vertically above and below the timeline
            for (let i = 0; i < numCircles; i++) {
                // Random vertical position (above and below timeline)
                const yOffset = (Math.random() - 0.5) * 2 * verticalSpread;
                // More horizontal spread to maintain circular cluster appearance
                const xJitter = (Math.random() - 0.5) * verticalSpread * 0.8;
                
                allSmallCircles.push({
                    originalData: d,
                    startX: centerX,
                    startY: centerY,
                    targetX: centerX + xJitter,
                    targetY: centerY + yOffset,
                    color: color,
                    index: i
                });
            }
        });
        
        console.log(`Creating ${allSmallCircles.length} small particles`);
        
        // Keep the timeline axis visible
        this.svg.select('.timeline-axis')
            .transition()
            .duration(500)
            .attr('opacity', 1);
        
        console.log(`Creating ${allSmallCircles.length} small particles`);
        
        // Create all small circles (delay start to let old circles fade)
        setTimeout(() => {
            const smallCircles = this.svg.selectAll('.death-particle')
                .data(allSmallCircles)
                .enter()
                .append('circle')
                .attr('class', 'death-particle')
                .attr('cx', d => d.startX)
                .attr('cy', d => d.startY)
                .attr('r', 0)
                .attr('fill', d => d.color)
                .attr('opacity', 0)
                .attr('stroke', 'rgba(255, 255, 255, 0.3)')
                .attr('stroke-width', 0.5);
            
            // Animate them exploding outward
            smallCircles.transition()
                .duration(2000)
                .delay((d, i) => (i % 50) * 10) // Stagger in waves
                .ease(d3.easeCubicOut)
                .attr('r', smallCircleRadius)
                .attr('cx', d => d.targetX)
                .attr('cy', d => d.targetY)
                .attr('opacity', 0.8);
        }, 500);
    },
    
    // STEP 7: Split circles into military (green) and civilian (yellow)
    splitCircles() {
        console.log('Splitting particles into military and civilian');
        
        const smallCircleRadius = 4;
        
        // Get all existing death particles
        const particles = this.svg.selectAll('.death-particle');
        
        // Transition particles to split into military (green) and civilian (yellow)
        particles.each(function(d) {
            const particle = d3.select(this);
            const originalData = d.originalData;
            
            // Calculate what percentage this conflict was military vs civilian
            const militaryPct = originalData.military_deaths / originalData.total_deaths;
            
            // Randomly assign this particle to military or civilian based on actual percentages
            const isMilitary = Math.random() < militaryPct;
            
            // Change color based on type
            particle
                .classed('death-particle', false)
                .classed(isMilitary ? 'military-particle' : 'civilian-particle', true)
                .transition()
                .duration(1000)
                .attr('fill', isMilitary ? '#27ae60' : '#f39c12')
                .attr('opacity', 0.75);
        });
    },
    
    // STEP 8: Rotate timeline to vertical and move military to right
    beginDrift() {
        console.log('Rotating timeline to vertical and moving military to right');
        
        // Remove horizontal axis
        this.svg.select('.timeline-axis')
            .transition()
            .duration(1000)
            .attr('opacity', 0)
            .remove();
        
        // Create vertical line in center
        this.svg.append('line')
            .attr('class', 'vertical-divider')
            .attr('x1', this.width / 2)
            .attr('y1', 100)
            .attr('x2', this.width / 2)
            .attr('y2', this.height - 100)
            .attr('stroke', '#555')
            .attr('stroke-width', 2)
            .attr('opacity', 0)
            .transition()
            .duration(1000)
            .attr('opacity', 0.5);
        
        // Cluster military particles densely on right side
        const militaryParticles = this.svg.selectAll('.military-particle').nodes();
        const militaryCount = militaryParticles.length;
        const militaryRadius = Math.sqrt(militaryCount) * 5;
        
        this.svg.selectAll('.military-particle')
            .transition()
            .duration(2000)
            .ease(d3.easeCubicInOut)
            .attr('cx', () => this.width * 0.75 + (Math.random() - 0.5) * militaryRadius * 1.5)
            .attr('cy', () => this.height / 2 + (Math.random() - 0.5) * militaryRadius * 1.5);
    },
    
    // STEP 9: Move civilian to left side
    completeDrift() {
        console.log('Moving civilian to left side');
        
        // Cluster civilian particles densely on left side
        const civilianParticles = this.svg.selectAll('.civilian-particle').nodes();
        const civilianCount = civilianParticles.length;
        const civilianRadius = Math.sqrt(civilianCount) * 5;
        
        this.svg.selectAll('.civilian-particle')
            .transition()
            .duration(2000)
            .ease(d3.easeCubicInOut)
            .attr('cx', () => this.width * 0.25 + (Math.random() - 0.5) * civilianRadius * 1.5)
            .attr('cy', () => this.height / 2 + (Math.random() - 0.5) * civilianRadius * 1.5);
    },
    
    // STEP 10: Emphasize civilians (make them pulse)
    emphasizeCivilians() {
        console.log('Emphasizing civilians with pulse');
        
        // Store pulse function reference so we can stop it later
        this.pulseActive = true;
        
        const pulse = () => {
            if (!this.pulseActive) return; // Stop if deactivated
            
            this.svg.selectAll('.civilian-particle')
                .transition()
                .duration(1000)
                .attr('opacity', 1)
                .transition()
                .duration(1000)
                .attr('opacity', 0.7)
                .on('end', () => {
                    if (this.pulseActive) pulse();
                });
        };
        
        pulse();
        
        // Fade military slightly
        this.svg.selectAll('.military-particle')
            .transition()
            .duration(1000)
            .attr('opacity', 0.3);
    },
    
    // STEP 11: Show conclusion
    showConclusion() {
        console.log('Showing conclusion');
        
        // Stop pulsing
        this.pulseActive = false;
        
        this.svg.selectAll('.civilian-particle')
            .interrupt()
            .transition()
            .duration(1000)
            .attr('opacity', 0.8);
        
        this.svg.selectAll('.military-particle')
            .transition()
            .duration(1000)
            .attr('opacity', 0.4);
    }
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    storyViz.init();
});
