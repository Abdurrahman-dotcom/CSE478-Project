// Main Application Entry Point

let visualizations = {};

// Initialize the application
async function init() {
    console.log('Initializing War Data Story...');
    
    // Load data
    await loadData();
    
    // Get data statistics
    const stats = getDataStats();
    console.log('Data Statistics:', stats);
    
    // Initialize all visualizations
    visualizations.timeline = initTimeline();
    visualizations.timelineZoom = initTimelineZoom();
    visualizations.map = initMap();
    visualizations.areaChart = initAreaChart();
    visualizations.sankey = initSankey();
    visualizations.barChart = initBarChart();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up smooth scrolling
    setupSmoothScrolling();
    
    console.log('Application initialized successfully!');
}

// Setup event listeners
function setupEventListeners() {
    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetFilters();
        });
    }
    
    // Conflict type filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => 
                b.classList.remove('active')
            );
            this.classList.add('active');
            setConflictTypeFilter(this.dataset.type);
        });
    });
    
    // Scale toggle for timeline
    const scaleToggle = document.getElementById('scale-toggle');
    if (scaleToggle) {
        scaleToggle.addEventListener('change', function() {
            if (visualizations.timeline && visualizations.timeline.toggleScale) {
                visualizations.timeline.toggleScale(this.checked);
            }
        });
    }
    
    // Zoom period buttons
    document.querySelectorAll('#zoom-controls .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('#zoom-controls .filter-btn').forEach(b => 
                b.classList.remove('active')
            );
            this.classList.add('active');
            
            const period = this.dataset.period;
            if (visualizations.timeline && visualizations.timeline.zoomToPeriod) {
                visualizations.timeline.zoomToPeriod(period);
            }
        });
    });
    
    // Time slider
    const timeSlider = document.getElementById('time-slider');
    if (timeSlider) {
        timeSlider.addEventListener('input', function() {
            const endYear = parseInt(this.value);
            const startYear = 700;
            document.getElementById('time-display').textContent = 
                `${startYear} - ${endYear}`;
            setTimeRangeFilter(startYear, endYear);
        });
    }
    
    // Register filter listeners for each visualization
    registerFilterListener((data, state) => {
        console.log('Filter changed:', state);
        
        if (visualizations.timeline && visualizations.timeline.update) {
            visualizations.timeline.update(data, state);
        }
        if (visualizations.map && visualizations.map.update) {
            visualizations.map.update(data, state);
        }
        if (visualizations.areaChart && visualizations.areaChart.update) {
            visualizations.areaChart.update(data, state);
        }
        if (visualizations.sankey && visualizations.sankey.update) {
            visualizations.sankey.update(data, state);
        }
        if (visualizations.barChart && visualizations.barChart.update) {
            visualizations.barChart.update(data, state);
        }
    });
}

// Setup smooth scrolling for navigation
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Update active nav link on scroll
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Create tooltip
function createTooltip() {
    let tooltip = d3.select('.tooltip');
    
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
    }
    
    return tooltip;
}

// Show tooltip
function showTooltip(tooltip, html, event) {
    tooltip
        .style('opacity', 1)
        .html(html)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
}

// Hide tooltip
function hideTooltip(tooltip) {
    tooltip.style('opacity', 0);
}

// Get color for conflict type
function getConflictTypeColor(type) {
    const colors = {
        'Interstate': '#e74c3c',
        'Civil War': '#f39c12',
        'Colonial': '#9b59b6'
    };
    return colors[type] || '#95a5a6';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
