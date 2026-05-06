function classifyManeuver(segment, index) {
  if (index === 0) {
    return "depart";
  }

  if (segment.road.includes("Connector")) {
    return "merge";
  }

  if (segment.road.includes("Garden State Parkway")) {
    return "continue";
  }

  if (segment.road.includes("I-287") || segment.road.includes("Thruway")) {
    return "merge";
  }

  if (segment.road.includes("US-9W")) {
    return "continue";
  }

  if (segment.road.includes("Local") || segment.road.includes("City Streets")) {
    return "turn";
  }

  return "continue";
}

function buildInstructionText(segment, maneuverType) {
  if (maneuverType === "depart") {
    return `Start on ${segment.road}`;
  }

  if (maneuverType === "merge") {
    return `Merge onto ${segment.road}`;
  }

  if (maneuverType === "turn") {
    return `Turn onto ${segment.road}`;
  }

  return `Continue on ${segment.road}`;
}

export function buildTurnInstructions(segments = []) {
  let cumulativeMiles = 0;

  return segments.map((segment, index) => {
    cumulativeMiles += segment.miles || 0;
    const maneuverType = classifyManeuver(segment, index);

    return {
      id: `${segment.id || segment.road}-${index}`,
      maneuverType,
      road: segment.road,
      distanceMiles: segment.miles || 0,
      cumulativeMiles: Math.round(cumulativeMiles * 10) / 10,
      instruction: buildInstructionText(segment, maneuverType)
    };
  });
}
