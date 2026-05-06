export function computeShortestLegalPath({
  graph,
  startNodeId,
  goalNodeId,
  isEdgeAllowed,
  edgeCost
}) {
  if (!graph || !startNodeId || !goalNodeId) {
    return null;
  }

  const distances = { [startNodeId]: 0 };
  const previous = {};
  const visited = new Set();

  function getNeighbors(nodeId) {
    return graph.segments.flatMap((segment) => {
      if (segment.from === nodeId) {
        return [{ node: segment.to, segment }];
      }
      if (segment.to === nodeId) {
        return [{ node: segment.from, segment }];
      }
      return [];
    });
  }

  while (true) {
    let current = null;
    let bestDistance = Infinity;

    Object.keys(distances).forEach((nodeId) => {
      if (!visited.has(nodeId) && distances[nodeId] < bestDistance) {
        bestDistance = distances[nodeId];
        current = nodeId;
      }
    });

    if (!current) {
      break;
    }

    if (current === goalNodeId) {
      break;
    }

    visited.add(current);

    getNeighbors(current).forEach(({ node, segment }) => {
      if (!isEdgeAllowed(segment)) {
        return;
      }

      const nextDistance = distances[current] + edgeCost(segment);
      if (distances[node] === undefined || nextDistance < distances[node]) {
        distances[node] = nextDistance;
        previous[node] = { node: current, segment };
      }
    });
  }

  if (distances[goalNodeId] === undefined) {
    return null;
  }

  const nodeIds = [];
  const segments = [];
  let cursor = goalNodeId;

  while (cursor) {
    nodeIds.unshift(cursor);
    const previousStep = previous[cursor];
    if (!previousStep) {
      break;
    }
    segments.unshift(previousStep.segment);
    cursor = previousStep.node;
  }

  return {
    nodeIds,
    segments,
    miles: distances[goalNodeId]
  };
}
