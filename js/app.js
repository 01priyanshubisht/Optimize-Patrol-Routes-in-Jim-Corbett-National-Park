// Main Dashboard Application
import { stations, routes } from './data.js';
import { getMST, getMaxFlow, getShortestPaths } from './graph-algorithms.js';

// Global variables
let map;
let activeAlgorithm = 'mst';
let stationMarkers = [];
let routeLines = [];
let currentGraph = { nodes: [], edges: [] };

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initializeMap();
  populateStationDropdowns();
  setupEventListeners();
  buildGraphFromData();
  
  // Default calculation
  calculateRoute();
});

// Add this near the top with your other global variables
let currentMapStyle = 'satellite'; // Default to satellite
let baseLayers = {};

// Update your initializeMap function:
function initializeMap() {
  // Jim Corbett National Park coordinates (approximate center)
  const jimCorbettCoords = [29.5300, 78.7747];
  
  // Create map instance
  map = L.map('map').setView(jimCorbettCoords, 12);
  
  // Create base layers
  baseLayers.satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles © Esri — Source: Esri and others",
      maxZoom: 19,
    }
  );
  
  baseLayers.normal = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }
  );
  
  // Add default layer
  baseLayers.satellite.addTo(map);
  
  // Add stations to the map
  addStationsToMap();
  
  // Setup map toggle button
  setupMapToggle();
}

// Add this new function to handle map toggling
function setupMapToggle() {
  const toggleBtn = document.getElementById('map-toggle-btn');
  
  toggleBtn.addEventListener('click', () => {
    if (currentMapStyle === 'satellite') {
      // Switch to normal view
      map.removeLayer(baseLayers.satellite);
      baseLayers.normal.addTo(map);
      currentMapStyle = 'normal';
      toggleBtn.innerHTML = '<span class="map-toggle-icon">🛰️</span> Satellite View';
    } else {
      // Switch to satellite view
      map.removeLayer(baseLayers.normal);
      baseLayers.satellite.addTo(map);
      currentMapStyle = 'satellite';
      toggleBtn.innerHTML = '<span class="map-toggle-icon">🌍</span> Normal View';
    }
  });
}

// Add station markers to the map
function addStationsToMap() {
  // Clear existing markers
  stationMarkers.forEach(marker => map.removeLayer(marker));
  stationMarkers = [];
  
  // Custom icon for stations
  const stationIcon = L.divIcon({
    className: 'station-marker-icon',
    html: '<div class="station-marker-inner"></div>',
    iconSize: [20, 20]
  });
  
  // Add CSS for custom marker
  const style = document.createElement('style');
  style.textContent = `
    .station-marker-icon {
      background: transparent;
      border: none;
    }
    .station-marker-inner {
      width: 14px;
      height: 14px;
      background-color: var(--forest-green);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s ease;
    }
    .station-marker-icon:hover .station-marker-inner {
      transform: scale(1.2);
    }
  `;
  document.head.appendChild(style);
  

  stations.forEach(station => {
    const marker = L.marker([station.lat, station.lng], {
      icon: stationIcon,
      title: station.name
    }).addTo(map);
   
    marker.bindPopup(`
      <div class="station-popup">
        <h3>${station.name}</h3>
        <p><strong>Type:</strong> ${station.type}</p>
        <p><strong>Capacity:</strong> ${station.capacity} rangers</p>
        <p><strong>Resources:</strong> ${station.resources.join(', ')}</p>
        ${station.notes ? `<p><strong>Notes:</strong> ${station.notes}</p>` : ''}
      </div>
    `);
    
    stationMarkers.push(marker);
  });
}


function buildGraphFromData() {
 
  const nodes = stations.map(station => ({
    id: station.id,
    name: station.name,
    lat: station.lat,
    lng: station.lng
  }));
  
  
  const edges = routes.map(route => ({
    source: route.fromId,
    target: route.toId,
    weight: route.distance,
    capacity: route.capacity
  }));
  
  currentGraph = { nodes, edges };
}


function populateStationDropdowns() {
  const sourceSelect = document.getElementById('source-station');
  const sinkSelect = document.getElementById('sink-station');
  const startSelect = document.getElementById('start-station');

  sourceSelect.innerHTML = '';
  sinkSelect.innerHTML = '';
  startSelect.innerHTML = '';
  
  // Add station options
  stations.forEach(station => {
    const option = document.createElement('option');
    option.value = station.id;
    option.textContent = station.name;
    
    sourceSelect.appendChild(option.cloneNode(true));
    sinkSelect.appendChild(option.cloneNode(true));
    startSelect.appendChild(option.cloneNode(true));
  });
  
  // Set default values
  if (stations.length > 0) {
    sourceSelect.value = stations[0].id;
    sinkSelect.value = stations[stations.length - 1].id;
    startSelect.value = stations[0].id;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Toggle control panel
  const toggleButton = document.getElementById('toggle-panel');
  const controlPanel = document.querySelector('.control-panel');
  
  toggleButton.addEventListener('click', () => {
    controlPanel.classList.toggle('collapsed');
    toggleButton.querySelector('.toggle-icon').textContent = 
      controlPanel.classList.contains('collapsed') ? '→' : '←';
    
    // Update map size after panel toggle
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  });
  
  // Algorithm selection
  const algorithmRadios = document.querySelectorAll('input[name="algorithm"]');
  
  algorithmRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      activeAlgorithm = radio.value;
      showRelevantParameters();
    });
  });
  
  // Calculate route button
  const calculateButton = document.getElementById('calculate-route');
  calculateButton.addEventListener('click', calculateRoute);
}

// Show parameters relevant to the selected algorithm
function showRelevantParameters() {
  const mstParams = document.getElementById('mst-params');
  const maxFlowParams = document.getElementById('maxflow-params');
  const shortestPathParams = document.getElementById('shortestpath-params');
  
  mstParams.style.display = 'none';
  maxFlowParams.style.display = 'none';
  shortestPathParams.style.display = 'none';
  
  switch (activeAlgorithm) {
    case 'mst':
      mstParams.style.display = 'block';
      break;
    case 'maxflow':
      maxFlowParams.style.display = 'block';
      break;
    case 'shortestpath':
      shortestPathParams.style.display = 'block';
      break;
  }
}

// Calculate and visualize routes based on selected algorithm
function calculateRoute() {
  // Clear existing route lines
  clearRouteLines();
  
  let result;
  let totalDistance = 0;
  let stationsCovered = 0;
  
  switch (activeAlgorithm) {
    case 'mst':
      result = getMST(currentGraph);
      visualizeMST(result);
      totalDistance = result.reduce((sum, edge) => sum + edge.weight, 0);
      stationsCovered = stations.length;
      break;
      
    case 'maxflow':
      const sourceId = document.getElementById('source-station').value;
      const sinkId = document.getElementById('sink-station').value;
      result = getMaxFlow(currentGraph, sourceId, sinkId);
      visualizeMaxFlow(result);
      totalDistance = result.paths.reduce((sum, path) => sum + path.distance, 0);
      stationsCovered = result.stationsCovered;
      break;
      
    case 'shortestpath':
      const startId = document.getElementById('start-station').value;
      result = getShortestPaths(currentGraph, startId);
      visualizeShortestPaths(result);
      totalDistance = Object.values(result.distances).reduce((sum, distance) => sum + distance, 0);
      stationsCovered = Object.keys(result.distances).length;
      break;
  }
  
  // Update stats
  updateRouteStats(totalDistance, stationsCovered);
}

// Clear existing route lines
function clearRouteLines() {
  routeLines.forEach(line => map.removeLayer(line));
  routeLines = [];
}

// Visualize Minimum Spanning Tree
function visualizeMST(mstEdges) {
  mstEdges.forEach(edge => {
    const source = findStationById(edge.source);
    const target = findStationById(edge.target);
    
    if (source && target) {
      const line = L.polyline(
        [[source.lat, source.lng], [target.lat, target.lng]], 
        {
          color: 'var(--forest-green)',
          weight: 3,
          opacity: 0.8,
          // dashArray: '5, 5',
          className: 'animate-path'
        }
      ).addTo(map);
      
      line.bindTooltip(`Distance: ${edge.weight.toFixed(1)} km`);
      routeLines.push(line);
    }
  });
}

// Visualize Max Flow
function visualizeMaxFlow(maxFlowResult) {
  maxFlowResult.paths.forEach(path => {
    // For each path, draw lines between consecutive stations
    for (let i = 0; i < path.route.length - 1; i++) {
      const source = findStationById(path.route[i]);
      const target = findStationById(path.route[i + 1]);
      
      if (source && target) {
        const line = L.polyline(
          [[source.lat, source.lng], [target.lat, target.lng]], 
          {
            color: 'var(--water-blue)',
            weight: 4,
            opacity: 0.7,
            dashArray: '5, 5',
            className: 'animate-path'
          }
        ).addTo(map);
        
        line.bindTooltip(`Flow: ${path.flow} units`);
        routeLines.push(line);
      }
    }
  });
}

// Visualize Shortest Paths
function visualizeShortestPaths(shortestPathResult) {
  const startId = document.getElementById('start-station').value;
  const startStation = findStationById(startId);
  
  if (!startStation) return;
  
  Object.entries(shortestPathResult.predecessors).forEach(([endId, path]) => {
    if (endId === startId) return; // Skip the source node
    
    const endStation = findStationById(endId);
    
    if (endStation && path) {
      // Reconstruct the full path
      const fullPath = reconstructPath(shortestPathResult.predecessors, startId, endId);
      
      // Draw the path
      const pathCoordinates = fullPath.map(id => {
        const station = findStationById(id);
        return [station.lat, station.lng];
      });
      
      const line = L.polyline(pathCoordinates, {
        color: 'var(--sunny-yellow)',
        weight: 3,
        opacity: 0.9,
        className: 'animate-path'
      }).addTo(map);
      
      line.bindTooltip(`Distance: ${shortestPathResult.distances[endId].toFixed(1)} km`);
      routeLines.push(line);
    }
  });
}

// Reconstruct path from predecessors
function reconstructPath(predecessors, startId, endId) {
  const path = [endId];
  let current = endId;
  
  while (current !== startId) {
    current = predecessors[current];
    if (!current) break; // Handle disconnected graph
    path.unshift(current);
  }
  
  return path;
}

// Find station by ID
function findStationById(id) {
  return stations.find(station => station.id === id);
}

// Update route statistics display
function updateRouteStats(distance, stationsCoveredCount) {
  document.getElementById('total-distance').textContent = `${distance.toFixed(1)} km`;
  document.getElementById('stations-covered').textContent = `${stationsCoveredCount} / ${stations.length}`;
  
  // Calculate estimated time (assuming average speed of 15 km/h for forest patrol)
  const avgSpeed = 15; // km/h
  const hours = distance / avgSpeed;
  const hoursWhole = Math.floor(hours);
  const minutes = Math.round((hours - hoursWhole) * 60);
  
  let timeText = '';
  if (hoursWhole > 0) {
    timeText += `${hoursWhole} hour${hoursWhole > 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    timeText += `${hoursWhole > 0 ? ' ' : ''}${minutes} min`;
  }
  
  document.getElementById('estimated-time').textContent = timeText || '< 1 min';
}

// Add pulsing effect to source/destination when using directed algorithms
function highlightSpecialStations() {
  // Remove existing highlights
  document.querySelectorAll('.station-highlight').forEach(el => el.remove());
  
  if (activeAlgorithm === 'maxflow') {
    const sourceId = document.getElementById('source-station').value;
    const sinkId = document.getElementById('sink-station').value;
    highlightStation(sourceId, 'source-highlight');
    highlightStation(sinkId, 'sink-highlight');
  } else if (activeAlgorithm === 'shortestpath') {
    const startId = document.getElementById('start-station').value;
    highlightStation(startId, 'start-highlight');
  }
}

// Highlight a specific station
function highlightStation(stationId, className) {
  const station = findStationById(stationId);
  if (!station) return;
  
  // Find the corresponding marker
  const marker = stationMarkers.find(m => 
    m.getLatLng().lat === station.lat && 
    m.getLatLng().lng === station.lng
  );
  
  if (marker) {
    // Add a highlight effect
    const highlightEffect = L.circleMarker(
      [station.lat, station.lng],
      {
        radius: 15,
        color: className === 'source-highlight' ? 'var(--forest-green)' : 
               className === 'sink-highlight' ? 'var(--danger-red)' : 
               'var(--sunny-yellow)',
        fillColor: className === 'source-highlight' ? 'var(--forest-green)' : 
                  className === 'sink-highlight' ? 'var(--danger-red)' : 
                  'var(--sunny-yellow)',
        fillOpacity: 0.2,
        className: `station-highlight ${className}`
      }
    ).addTo(map);
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      .${className} {
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0% {
          opacity: 0.7;
          transform: scale(1);
        }
        50% {
          opacity: 0.3;
          transform: scale(1.5);
        }
        100% {
          opacity: 0.7;
          transform: scale(1);
        }
      }
    `;
    document.head.appendChild(style);
  }
}