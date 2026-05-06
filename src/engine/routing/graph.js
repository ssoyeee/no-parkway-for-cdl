import { edgeGeometries } from "./edgeGeometries";

const trimmedEdgeGeometries = {
  edge_lf_to_46: edgeGeometries.edge_lf_to_46,
  edge_46_to_gsp: edgeGeometries.edge_46_to_gsp.slice(0, 455),
  edge_gsp_to_287: edgeGeometries.edge_gsp_to_287.slice(4),
  edge_287_to_9w: edgeGeometries.edge_287_to_9w,
  edge_9w_to_local: edgeGeometries.edge_9w_to_local,
  edge_local_to_peekskill: edgeGeometries.edge_local_to_peekskill,
  edge_gsp_to_palisades: edgeGeometries.edge_gsp_to_palisades.slice(4),
  edge_palisades_to_peekskill: edgeGeometries.edge_palisades_to_peekskill
};

const graphJoinCoordinates = {
  garden_state_north: trimmedEdgeGeometries.edge_46_to_gsp.at(-1),
  ny_thruway_link: trimmedEdgeGeometries.edge_gsp_to_287.at(-1),
  us9w_corridor: trimmedEdgeGeometries.edge_287_to_9w.at(-1),
  peekskill_local: trimmedEdgeGeometries.edge_9w_to_local.at(-1),
  peekskill: trimmedEdgeGeometries.edge_local_to_peekskill.at(-1),
  palisades_corridor: trimmedEdgeGeometries.edge_gsp_to_palisades.at(-1)
};

export const corridorRules = [
  {
    id: "little-ferry-to-peekskill",
    originTerms: ["little ferry", "bergen county"],
    destinationTerms: ["peekskill"],
    summary:
      "Use Garden State Parkway only where it helps, then exit to Route 17, I-287, US-9W, and legal local corridors before any restricted parkways.",
    allowedParkways: ["Garden State Parkway"],
    avoidRoads: [
      "Palisades Interstate Parkway",
      "Taconic State Parkway",
      "Saw Mill River Parkway",
      "Sprain Brook Parkway"
    ]
  }
];

export const routeNodeCoordinates = {
  little_ferry: { latitude: 40.8509, longitude: -74.0382, label: "Little Ferry, NJ" },
  route17_paramus: { latitude: 40.9558, longitude: -74.0726, label: "Route 17, Paramus, NJ" },
  garden_state_north: {
    latitude: graphJoinCoordinates.garden_state_north.latitude,
    longitude: graphJoinCoordinates.garden_state_north.longitude,
    label: "Garden State Parkway North"
  },
  ny_thruway_link: {
    latitude: graphJoinCoordinates.ny_thruway_link.latitude,
    longitude: graphJoinCoordinates.ny_thruway_link.longitude,
    label: "I-287 / New York Thruway"
  },
  us9w_corridor: {
    latitude: graphJoinCoordinates.us9w_corridor.latitude,
    longitude: graphJoinCoordinates.us9w_corridor.longitude,
    label: "US-9W Corridor"
  },
  peekskill_local: {
    latitude: graphJoinCoordinates.peekskill_local.latitude,
    longitude: graphJoinCoordinates.peekskill_local.longitude,
    label: "Peekskill Local Access"
  },
  peekskill: {
    latitude: graphJoinCoordinates.peekskill.latitude,
    longitude: graphJoinCoordinates.peekskill.longitude,
    label: "Peekskill, New York"
  },
  palisades_corridor: {
    latitude: graphJoinCoordinates.palisades_corridor.latitude,
    longitude: graphJoinCoordinates.palisades_corridor.longitude,
    label: "Palisades Interstate Parkway"
  }
};

export const routeGraphEdges = [
  {
    id: "edge_lf_to_46",
    from: "little_ferry",
    to: "route17_paramus",
    road: "Route 46 Connector",
    miles: 7,
    roadClass: "highway",
    isParkway: false,
    geometry: trimmedEdgeGeometries.edge_lf_to_46
  },
  {
    id: "edge_46_to_gsp",
    from: "route17_paramus",
    to: "garden_state_north",
    road: "Garden State Parkway",
    miles: 8,
    roadClass: "parkway",
    isParkway: true,
    geometry: trimmedEdgeGeometries.edge_46_to_gsp
  },
  {
    id: "edge_gsp_to_287",
    from: "garden_state_north",
    to: "ny_thruway_link",
    road: "I-287 / New York Thruway",
    miles: 13,
    roadClass: "interstate",
    isParkway: false,
    geometry: trimmedEdgeGeometries.edge_gsp_to_287
  },
  {
    id: "edge_287_to_9w",
    from: "ny_thruway_link",
    to: "us9w_corridor",
    road: "US-9W",
    miles: 10,
    roadClass: "highway",
    isParkway: false,
    geometry: trimmedEdgeGeometries.edge_287_to_9w
  },
  {
    id: "edge_9w_to_local",
    from: "us9w_corridor",
    to: "peekskill_local",
    road: "Local Connector",
    miles: 6,
    roadClass: "local",
    isParkway: false,
    geometry: trimmedEdgeGeometries.edge_9w_to_local
  },
  {
    id: "edge_local_to_peekskill",
    from: "peekskill_local",
    to: "peekskill",
    road: "City Streets",
    miles: 2,
    roadClass: "local",
    isParkway: false,
    geometry: trimmedEdgeGeometries.edge_local_to_peekskill
  },
  {
    id: "edge_gsp_to_palisades",
    from: "garden_state_north",
    to: "palisades_corridor",
    road: "Palisades Interstate Parkway",
    miles: 11,
    roadClass: "parkway",
    isParkway: true,
    geometry: trimmedEdgeGeometries.edge_gsp_to_palisades
  },
  {
    id: "edge_palisades_to_peekskill",
    from: "palisades_corridor",
    to: "peekskill",
    road: "Palisades Interstate Parkway",
    miles: 18,
    roadClass: "parkway",
    isParkway: true,
    geometry: trimmedEdgeGeometries.edge_palisades_to_peekskill
  }
];

const nodeAliases = {
  "little ferry": "little_ferry",
  "little ferry, nj": "little_ferry",
  "peekskill": "peekskill",
  "peekskill, new york": "peekskill"
};

function getDistanceScore(a, b) {
  const latDiff = a.latitude - b.latitude;
  const lngDiff = a.longitude - b.longitude;
  return latDiff * latDiff + lngDiff * lngDiff;
}

export function getRouteStrategy(originLabel, destinationLabel) {
  const origin = (originLabel || "").trim().toLowerCase();
  const destination = (destinationLabel || "").trim().toLowerCase();

  return (
    corridorRules.find((rule) => {
      const originMatch = rule.originTerms.some((term) => origin.includes(term));
      const destinationMatch = rule.destinationTerms.some((term) => destination.includes(term));
      return originMatch && destinationMatch;
    }) || null
  );
}

export function getGraphNodeId(label, coordinate) {
  const normalized = (label || "").trim().toLowerCase();

  if (nodeAliases[normalized]) {
    return nodeAliases[normalized];
  }

  const aliasEntry = Object.entries(nodeAliases).find(([alias]) => normalized.includes(alias));
  if (aliasEntry) {
    return aliasEntry[1];
  }

  if (coordinate) {
    const nearest = Object.entries(routeNodeCoordinates)
      .map(([nodeId, nodeCoordinate]) => ({
        nodeId,
        score: getDistanceScore(coordinate, nodeCoordinate)
      }))
      .sort((a, b) => a.score - b.score)[0];

    if (nearest) {
      return nearest.nodeId;
    }
  }

  return null;
}

export function loadGraphWindow() {
  return {
    nodes: routeNodeCoordinates,
    segments: routeGraphEdges
  };
}


function normalizeGeometryDirection(segment, startNodeId) {
  const geometry = segment.geometry || [];
  if (geometry.length < 2) {
    return [];
  }

  return segment.from === startNodeId ? geometry : [...geometry].reverse();
}

export function buildPathCoordinates(nodeIds = [], segments = [], nodes = {}) {
  if (!segments.length) {
    return nodeIds.map((nodeId) => nodes[nodeId]).filter(Boolean);
  }

  const coordinates = [];
  segments.forEach((segment, index) => {
    const startNodeId = nodeIds[index];
    const directedGeometry = normalizeGeometryDirection(segment, startNodeId);
    if (!directedGeometry.length) {
      const fallback = [nodes[segment.from], nodes[segment.to]].filter(Boolean);
      fallback.forEach((point, fallbackIndex) => {
        if (coordinates.length && fallbackIndex === 0) {
          return;
        }
        coordinates.push(point);
      });
      return;
    }

    directedGeometry.forEach((point, pointIndex) => {
      if (coordinates.length && pointIndex === 0) {
        return;
      }
      coordinates.push(point);
    });
  });

  return coordinates;
}
