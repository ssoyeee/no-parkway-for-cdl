import { isAllowedParkwayException } from "../restrictions/restrictionData";

export function validateRoute({ routeRoads, avoidRoads, allowedExceptions }) {
  const violations = [];
  const avoidSet = new Set(avoidRoads);
  const allowedSet = new Set(allowedExceptions);

  routeRoads.forEach((road) => {
    if (avoidSet.has(road)) {
      violations.push({
        type: "restricted_road_in_route",
        road
      });
    }

    if (road.includes("Parkway") && !allowedSet.has(road) && !isAllowedParkwayException(road)) {
      violations.push({
        type: "unauthorized_parkway_in_route",
        road
      });
    }
  });

  return {
    passed: violations.length === 0,
    violations
  };
}
