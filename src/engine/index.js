import {
  allowedRoadExceptions,
  getDestinationRiskProfile,
  getRestrictedRoadRules
} from "./restrictions/restrictionData";
import { canPass, hasException } from "./restrictions/restrictionEvaluator";
import { buildPathCoordinates, getGraphNodeId, getRouteStrategy } from "./routing/graph";
import { getGraphWindow } from "./routing/graphProvider";
import { baseEdgeCost } from "./routing/costFunctions";
import { computeShortestLegalPath } from "./routing/pathfinding";
import { validateRoute } from "./validation/routeValidator";
import { buildTurnInstructions } from "./navigation/turnInstructionGenerator";

function buildFallbackRoute(destinationLabel, destinationRisk) {
  const avoidRoads = destinationRisk?.roads || getRestrictedRoadRules().map((item) => item.road);
  const routeRoads = ["Allowed highways", "Local road connectors", destinationLabel];
  const allowedExceptions = allowedRoadExceptions.map((item) => item.road);
  const validation = validateRoute({ routeRoads, avoidRoads, allowedExceptions });

  return {
    status: "fallback",
    title: "Fallback legal route shell",
    summary:
      "No corridor graph is loaded for this trip yet. The engine falls back to a legal-road shell instead of inventing a fake detailed route.",
    routeRoads,
    avoidRoads,
    allowedExceptions,
    maneuvers: [],
    coordinates: [],
    miles: null,
    validation
  };
}

export function computeLegalRoute({
  originLabel,
  destinationLabel,
  originCoordinate,
  destinationCoordinate,
  vehicleProfileId = "commercial_mini_van_default"
}) {
  const strategy = getRouteStrategy(originLabel, destinationLabel);
  const destinationRisk = getDestinationRiskProfile(destinationLabel);
  const graph = getGraphWindow();
  const startNodeId = getGraphNodeId(originLabel, originCoordinate);
  const goalNodeId = getGraphNodeId(destinationLabel, destinationCoordinate);

  if (!startNodeId || !goalNodeId || !strategy) {
    return buildFallbackRoute(destinationLabel, destinationRisk);
  }

  const allowedExceptions = strategy.allowedParkways;
  const avoidRoads = strategy.avoidRoads;

  const path = computeShortestLegalPath({
    graph,
    startNodeId,
    goalNodeId,
    isEdgeAllowed: (segment) => {
      if (avoidRoads.includes(segment.road)) {
        return false;
      }

      if (!canPass({ roadName: segment.road })) {
        return false;
      }

      if (segment.isParkway && !hasException(segment.road)) {
        return false;
      }

      return true;
    },
    edgeCost: baseEdgeCost
  });

  if (!path) {
    return {
      status: "blocked",
      title: "No legal route found",
      summary:
        "The current graph window could not produce a legal path without entering restricted parkways.",
      routeRoads: [],
      avoidRoads,
      allowedExceptions,
      maneuvers: [],
      coordinates: [],
      miles: null,
      validation: {
        passed: false,
        violations: [
          {
            type: "no_legal_path",
            vehicleProfileId
          }
        ]
      }
    };
  }

  const routeRoads = path.segments.map((segment) => segment.road);
  const maneuvers = buildTurnInstructions(path.segments);
  const coordinates = buildPathCoordinates(path.nodeIds, path.segments, graph.nodes);
  const validation = validateRoute({ routeRoads, avoidRoads, allowedExceptions });

  return {
    status: validation.passed ? "ok" : "invalid",
    title: "Computed legal route",
    summary:
      "This route is calculated inside the routing engine with restricted parkways removed before pathfinding.",
    routeRoads,
    avoidRoads,
    allowedExceptions,
    maneuvers,
    coordinates,
    routeSegments: path.segments,
    miles: Math.round(path.miles * 10) / 10,
    validation
  };
}
