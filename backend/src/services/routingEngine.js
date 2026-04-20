import { queryWhere, Collections } from '../db/firestore.js';

// Internal node mapping simulating the physical footprint of the Stadium
// The 'distance' reflects base transit time factoring traversing clear hallways (roughly measuring seconds)
const STATIC_STADIUM_GRAPH = {
  'GATE_A': [
    { target: 'CONCOURSE_NORTH', distance: 120 }, 
    { target: 'VIP_CORRIDOR', distance: 80, isVip: true }
  ],
  'GATE_B': [
    { target: 'CONCOURSE_SOUTH', distance: 100 }
  ],
  'CONCOURSE_NORTH': [
    { target: 'FOOD_COURT', distance: 50 }, 
    { target: 'SECTION_101', distance: 30 }, 
    { target: 'GATE_A', distance: 120 }
  ],
  'CONCOURSE_SOUTH': [
    { target: 'RESTROOM_B', distance: 40 }, 
    { target: 'SECTION_102', distance: 40 }, 
    { target: 'GATE_B', distance: 100 }
  ],
  'FOOD_COURT': [
    { target: 'CONCOURSE_NORTH', distance: 50 }, 
    { target: 'CENTER_HUB', distance: 60 }
  ],
  'RESTROOM_B': [
    { target: 'CONCOURSE_SOUTH', distance: 40 }, 
    { target: 'CENTER_HUB', distance: 70 }
  ],
  'CENTER_HUB': [
    { target: 'FOOD_COURT', distance: 60 }, 
    { target: 'RESTROOM_B', distance: 70 }, 
    { target: 'SECTION_101', distance: 80 }, 
    { target: 'SECTION_102', distance: 50 }
  ],
  'VIP_CORRIDOR': [
    { target: 'SECTION_101', distance: 40, isVip: true }, 
    { target: 'GATE_A', distance: 80, isVip: true }
  ],
  'SECTION_101': [
    { target: 'CONCOURSE_NORTH', distance: 30 }, 
    { target: 'VIP_CORRIDOR', distance: 40, isVip: true }, 
    { target: 'CENTER_HUB', distance: 80 }
  ],
  'SECTION_102': [
    { target: 'CONCOURSE_SOUTH', distance: 40 }, 
    { target: 'CENTER_HUB', distance: 50 }
  ]
};

export const calculateOptimalRoute = async (startNode, endNode, isVip) => {
  // If no physical nodes found explicitly drop bad requests
  if (!STATIC_STADIUM_GRAPH[startNode] || !STATIC_STADIUM_GRAPH[endNode]) {
    throw new Error('Invalid routing nodes requested.');
  }

  // 1. Resolve live stadium telemetry to inject physical friction
  const liveZones = await queryWhere(Collections.ZONES, 'venueId', 'ARENA_PRIME');
  const pressureMap = {};
  liveZones.forEach(z => {
    pressureMap[z.id] = z.pressureScore || 0;
  });

  // 2. Prepare Dijkstra Data Structures
  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(STATIC_STADIUM_GRAPH));

  Object.keys(STATIC_STADIUM_GRAPH).forEach(node => {
    distances[node] = Infinity;
    previous[node] = null;
  });
  distances[startNode] = 0;

  // 3. Graph Execution Loop
  while (unvisited.size > 0) {
    let currentNode = null;
    let minDistance = Infinity;

    // Search minimum distant boundary node
    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        currentNode = node;
      }
    }

    if (currentNode === null || currentNode === endNode) {
      break; 
    }

    unvisited.delete(currentNode);

    const connections = STATIC_STADIUM_GRAPH[currentNode] || [];
    
    for (const neighbor of connections) {
      if (!unvisited.has(neighbor.target)) continue;

      // Drop trajectory evaluation if node is restricted and user lacks tier mapping
      if (neighbor.isVip && !isVip) {
        continue;
      }

      // Check current crowd congestion across the target vector
      const targetPressure = pressureMap[neighbor.target] || 0;
      
      // Calculate friction modifiers
      let frictionMultiplier = 1.0;
      if (targetPressure > 90) frictionMultiplier = 4.0; // Block passage heavily
      else if (targetPressure > 70) frictionMultiplier = 2.5; 
      else if (targetPressure > 40) frictionMultiplier = 1.5;

      const dynamicTemporalWeight = neighbor.distance * frictionMultiplier;
      const totalCost = distances[currentNode] + dynamicTemporalWeight;

      if (totalCost < distances[neighbor.target]) {
        distances[neighbor.target] = totalCost;
        previous[neighbor.target] = currentNode;
      }
    }
  }

  // 4. Backtrack Trajectory Array
  const path = [];
  let tracer = endNode;
  while (tracer) {
    path.unshift(tracer);
    tracer = previous[tracer];
  }

  if (path.length === 1 && path[0] !== startNode) {
    throw new Error('No physically accessible route found connecting nodes.');
  }

  // 5. Final Package Output Generation
  const highPressureZones = path.filter(node => (pressureMap[node] || 0) > 60);

  // Time reflects exact physical route (roughly derived seconds / 60)
  const totalFrictionWeight = Math.round(distances[endNode]);
  const estimatedTimeMins = Math.ceil(totalFrictionWeight / 60);

  return {
    path,
    estimatedTime: estimatedTimeMins,
    highPressureZones
  };
};
