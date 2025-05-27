// Graph algorithms implementation for wildlife patrol optimization

/**
 * Implementation of Kruskal's algorithm to find the Minimum Spanning Tree
 * @param {Object} graph - The graph with nodes and edges
 * @returns {Array} - The MST edges
 */
export function getMST(graph) {
  // Clone the edges array to avoid modifying the original
  const edges = [...graph.edges].sort((a, b) => a.weight - b.weight);
  const mst = [];
  
  // Initialize disjoint set for each node
  const parent = {};
  graph.nodes.forEach(node => {
    parent[node.id] = node.id;
  });
  
  // Find function for disjoint-set
  function find(i) {
    if (parent[i] !== i) {
      parent[i] = find(parent[i]);
    }
    return parent[i];
  }
  
  // Union function for disjoint-set
  function union(i, j) {
    parent[find(i)] = find(j);
  }
  
  // Process edges in order of increasing weight
  for (const edge of edges) {
    const sourceRoot = find(edge.source);
    const targetRoot = find(edge.target);
    
    // Check if adding this edge would create a cycle
    if (sourceRoot !== targetRoot) {
      mst.push(edge);
      union(sourceRoot, targetRoot);
      
      // If we have (n-1) edges, MST is complete
      if (mst.length === graph.nodes.length - 1) {
        break;
      }
    }
  }
  
  return mst;
}

/**
 * Implementation of Ford-Fulkerson algorithm for Maximum Flow
 * @param {Object} graph - The graph with nodes and edges
 * @param {string} sourceId - Source node ID
 * @param {string} sinkId - Sink node ID
 * @returns {Object} - Maximum flow result
 */
export function getMaxFlow(graph, sourceId, sinkId) {
  // Create a residual graph
  const residualGraph = createResidualGraph(graph);
  
  // Find augmenting path using BFS
  function findAugmentingPath() {
    const visited = {};
    const parent = {};
    
    // Initialize visited and parent arrays
    graph.nodes.forEach(node => {
      visited[node.id] = false;
      parent[node.id] = null;
    });
    
    // BFS queue
    const queue = [sourceId];
    visited[sourceId] = true;
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      // Check all neighbors of current node
      for (const [neighbor, capacity] of Object.entries(residualGraph[current])) {
        // If neighbor is not visited and has capacity
        if (!visited[neighbor] && capacity > 0) {
          parent[neighbor] = current;
          visited[neighbor] = true;
          queue.push(neighbor);
          
          // If we've reached the sink, we found a path
          if (neighbor === sinkId) {
            return parent;
          }
        }
      }
    }
    
    // No augmenting path found
    return null;
  }
  
  // Recalculate capacities along the path
  function augmentPath(parent) {
    let pathFlow = Infinity;
    let current = sinkId;
    
    // Find the minimum residual capacity along the path
    while (current !== sourceId) {
      const prev = parent[current];
      pathFlow = Math.min(pathFlow, residualGraph[prev][current]);
      current = prev;
    }
    
    // Update residual capacities
    current = sinkId;
    const path = [sinkId];
    
    while (current !== sourceId) {
      const prev = parent[current];
      residualGraph[prev][current] -= pathFlow;
      
      // Add reverse edge capacity (backflow)
      if (!residualGraph[current][prev]) {
        residualGraph[current][prev] = 0;
      }
      residualGraph[current][prev] += pathFlow;
      
      current = prev;
      path.unshift(current);
    }
    
    return { flow: pathFlow, path };
  }
  
  // Implement Ford-Fulkerson algorithm
  let totalFlow = 0;
  const flowPaths = [];
  
  // Continue finding augmenting paths until none exist
  let parent = findAugmentingPath();
  while (parent) {
    // Augment the path
    const { flow, path } = augmentPath(parent);
    totalFlow += flow;
    
    // Store this path and its flow
    flowPaths.push({
      route: path,
      flow,
      distance: calculatePathDistance(path, graph.edges)
    });
    
    // Find the next augmenting path
    parent = findAugmentingPath();
  }
  
  // Calculate the number of stations covered
  const stationsCovered = new Set();
  flowPaths.forEach(path => {
    path.route.forEach(stationId => {
      stationsCovered.add(stationId);
    });
  });
  
  return {
    maxFlow: totalFlow,
    paths: flowPaths,
    stationsCovered: stationsCovered.size
  };
}

/**
 * Implementation of Bellman-Ford algorithm for Shortest Paths
 * @param {Object} graph - The graph with nodes and edges
 * @param {string} sourceId - Source node ID
 * @returns {Object} - Shortest paths result
 */
export function getShortestPaths(graph, sourceId) {
  // Initialize distances and predecessors
  const distances = {};
  const predecessors = {};
  
  // Initialize distances to Infinity and predecessors to null
  graph.nodes.forEach(node => {
    distances[node.id] = Infinity;
    predecessors[node.id] = null;
  });
  
  // Distance to source is 0
  distances[sourceId] = 0;
  
  // Relax edges repeatedly
  for (let i = 0; i < graph.nodes.length - 1; i++) {
    for (const edge of graph.edges) {
      // Relax edge (source -> target)
      if (distances[edge.source] + edge.weight < distances[edge.target]) {
        distances[edge.target] = distances[edge.source] + edge.weight;
        predecessors[edge.target] = edge.source;
      }
      
      // For undirected graph, also relax (target -> source)
      if (distances[edge.target] + edge.weight < distances[edge.source]) {
        distances[edge.source] = distances[edge.target] + edge.weight;
        predecessors[edge.source] = edge.target;
      }
    }
  }
  
  // Check for negative weight cycles
  for (const edge of graph.edges) {
    if (distances[edge.source] + edge.weight < distances[edge.target] ||
        distances[edge.target] + edge.weight < distances[edge.source]) {
      console.warn("Graph contains negative weight cycle");
      break;
    }
  }
  
  return {
    distances,
    predecessors
  };
}

// Helper function to create a residual graph
function createResidualGraph(graph) {
  const residualGraph = {};
  
  // Initialize an empty adjacency list for each node
  graph.nodes.forEach(node => {
    residualGraph[node.id] = {};
  });
  
  // Add edges to residual graph
  graph.edges.forEach(edge => {
    // Forward edge with original capacity
    residualGraph[edge.source][edge.target] = edge.capacity || edge.weight;
    
    // Backward edge with 0 capacity (will be used for backflow)
    if (!residualGraph[edge.target][edge.source]) {
      residualGraph[edge.target][edge.source] = 0;
    }
  });
  
  return residualGraph;
}

// Helper function to calculate the distance of a path
function calculatePathDistance(path, edges) {
  let totalDistance = 0;
  
  // For each consecutive pair of nodes in the path
  for (let i = 0; i < path.length - 1; i++) {
    const source = path[i];
    const target = path[i + 1];
    
    // Find the corresponding edge
    const edge = edges.find(e => 
      (e.source === source && e.target === target) || 
      (e.source === target && e.target === source)
    );
    
    if (edge) {
      totalDistance += edge.weight;
    }
  }
  
  return totalDistance;
}