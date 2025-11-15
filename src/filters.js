// Filter Management Module
// Handles cross-visualization filtering and interactions

const filterState = {
    selectedConflict: null,
    selectedType: 'all',
    selectedRegion: 'all',
    timeRange: [700, 2025]
};

const listeners = [];

// Register a listener for filter changes
function registerFilterListener(callback) {
    listeners.push(callback);
}

// Notify all listeners of filter changes
function notifyListeners() {
    filteredData = applyFilters();
    listeners.forEach(callback => callback(filteredData, filterState));
}

// Apply current filters to data
function applyFilters() {
    let data = [...warData];
    
    // Filter by conflict type
    if (filterState.selectedType !== 'all') {
        data = data.filter(d => d.conflict_type === filterState.selectedType);
    }
    
    // Filter by region
    if (filterState.selectedRegion !== 'all') {
        data = data.filter(d => d.geographic_region === filterState.selectedRegion);
    }
    
    // Filter by time range
    data = data.filter(d => 
        d.start_year <= filterState.timeRange[1] && 
        d.end_year >= filterState.timeRange[0]
    );
    
    // Filter by selected conflict
    if (filterState.selectedConflict) {
        data = data.filter(d => d.conflict_name === filterState.selectedConflict);
    }
    
    return data;
}

// Update filter: conflict type
function setConflictTypeFilter(type) {
    filterState.selectedType = type;
    filterState.selectedConflict = null; // Clear specific conflict selection
    notifyListeners();
}

// Update filter: region
function setRegionFilter(region) {
    filterState.selectedRegion = region;
    filterState.selectedConflict = null;
    notifyListeners();
}

// Update filter: time range
function setTimeRangeFilter(start, end) {
    filterState.timeRange = [start, end];
    filterState.selectedConflict = null;
    notifyListeners();
}

// Update filter: specific conflict
function setConflictFilter(conflictName) {
    if (filterState.selectedConflict === conflictName) {
        // Toggle off if clicking the same conflict
        filterState.selectedConflict = null;
    } else {
        filterState.selectedConflict = conflictName;
    }
    notifyListeners();
}

// Reset all filters
function resetFilters() {
    filterState.selectedConflict = null;
    filterState.selectedType = 'all';
    filterState.selectedRegion = 'all';
    filterState.timeRange = [700, 2025];
    
    // Update UI
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === 'all');
    });
    
    const slider = document.getElementById('time-slider');
    if (slider) {
        slider.value = 2025;
        document.getElementById('time-display').textContent = '700 - 2025';
    }
    
    notifyListeners();
}

// Get current filtered data
function getFilteredData() {
    return filteredData;
}

// Get current filter state
function getFilterState() {
    return { ...filterState };
}

// Highlight selected conflict across all visualizations
function highlightConflict(conflictName) {
    document.querySelectorAll('.conflict-element').forEach(el => {
        const isSelected = el.dataset.conflict === conflictName;
        el.classList.toggle('highlighted', isSelected);
        el.style.opacity = conflictName && !isSelected ? 0.3 : 1;
    });
}
