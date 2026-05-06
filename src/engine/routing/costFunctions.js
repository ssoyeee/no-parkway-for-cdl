export function baseEdgeCost(segment) {
  let cost = segment.miles;

  if (segment.roadClass === "local") {
    cost += 1.25;
  }

  if (segment.road === "Garden State Parkway") {
    cost -= 0.4;
  }

  return cost;
}
