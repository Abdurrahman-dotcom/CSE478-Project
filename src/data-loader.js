// Data Loader Module
// Handles loading and preprocessing of war data

let warData = [];
let filteredData = [];

// Load the data
async function loadData() {
    try {
        const response = await fetch('data/wars_data.json');
        warData = await response.json();
        
        // Sort by start year
        warData.sort((a, b) => a.start_year - b.start_year);
        
        // Initialize filtered data
        filteredData = [...warData];
        
        console.log('Data loaded successfully:', warData.length, 'conflicts');
        return warData;
    } catch (error) {
        console.error('Error loading data:', error);
        return [];
    }
}

// Calculate statistics
function getDataStats() {
    return {
        totalConflicts: warData.length,
        totalDeaths: warData.reduce((sum, d) => sum + d.total_deaths, 0),
        totalMilitaryDeaths: warData.reduce((sum, d) => sum + d.military_deaths, 0),
        totalCivilianDeaths: warData.reduce((sum, d) => sum + d.civilian_deaths, 0),
        dateRange: {
            min: d3.min(warData, d => d.start_year),
            max: d3.max(warData, d => d.end_year)
        },
        conflictTypes: [...new Set(warData.map(d => d.conflict_type))],
        regions: [...new Set(warData.map(d => d.geographic_region))]
    };
}

// Get data by conflict type
function getDataByType(type) {
    if (type === 'all') return warData;
    return warData.filter(d => d.conflict_type === type);
}

// Get data by region
function getDataByRegion(region) {
    if (region === 'all') return warData;
    return warData.filter(d => d.geographic_region === region);
}

// Get data by time period
function getDataByTimePeriod(startYear, endYear) {
    return warData.filter(d => 
        d.start_year <= endYear && d.end_year >= startYear
    );
}

// Get top N deadliest conflicts
function getDeadliestConflicts(n = 10) {
    return [...warData]
        .sort((a, b) => b.total_deaths - a.total_deaths)
        .slice(0, n);
}

// Prepare data for Sankey diagram
function prepareSankeyData() {
    // Group by conflict type
    const typeGroups = d3.group(warData, d => d.conflict_type);
    
    const nodes = [];
    const links = [];
    let nodeIndex = 0;
    
    // Create nodes for conflict types
    const typeNodes = {};
    typeGroups.forEach((conflicts, type) => {
        typeNodes[type] = nodeIndex;
        nodes.push({ name: type, type: 'conflict' });
        nodeIndex++;
    });
    
    // Create nodes for casualty types
    const militaryNode = nodeIndex++;
    const civilianNode = nodeIndex++;
    nodes.push({ name: 'Military Deaths', type: 'casualty' });
    nodes.push({ name: 'Civilian Deaths', type: 'casualty' });
    
    // Create links
    typeGroups.forEach((conflicts, type) => {
        const militaryDeaths = conflicts.reduce((sum, d) => sum + d.military_deaths, 0);
        const civilianDeaths = conflicts.reduce((sum, d) => sum + d.civilian_deaths, 0);
        
        links.push({
            source: typeNodes[type],
            target: militaryNode,
            value: militaryDeaths
        });
        
        links.push({
            source: typeNodes[type],
            target: civilianNode,
            value: civilianDeaths
        });
    });
    
    return { nodes, links };
}

// Prepare cumulative data for area chart
function prepareCumulativeData() {
    const years = d3.range(
        d3.min(warData, d => d.start_year),
        d3.max(warData, d => d.end_year) + 1
    );
    
    const cumulativeData = years.map(year => {
        const activeConflicts = warData.filter(d => 
            d.start_year <= year && d.end_year >= year
        );
        
        const byType = d3.rollup(
            activeConflicts,
            v => d3.sum(v, d => {
                const duration = d.end_year - d.start_year + 1;
                return d.total_deaths / duration;
            }),
            d => d.conflict_type
        );
        
        return {
            year,
            Interstate: byType.get('Interstate') || 0,
            'Civil War': byType.get('Civil War') || 0,
            Colonial: byType.get('Colonial') || 0
        };
    });
    
    // Calculate cumulative sums
    let cumInterstate = 0, cumCivil = 0, cumColonial = 0;
    
    return cumulativeData.map(d => {
        cumInterstate += d.Interstate;
        cumCivil += d['Civil War'];
        cumColonial += d.Colonial;
        
        return {
            year: d.year,
            Interstate: cumInterstate,
            'Civil War': cumCivil,
            Colonial: cumColonial,
            total: cumInterstate + cumCivil + cumColonial
        };
    });
}

// Format numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Format year range
function formatYearRange(start, end) {
    if (start === end) return start.toString();
    return `${start} - ${end}`;
}
