export function getLocationPollingConfig({ navigating = false } = {}) {
  if (navigating) {
    return {
      timeIntervalMs: 1000,
      distanceIntervalM: 5
    };
  }

  return {
    timeIntervalMs: 2000,
    distanceIntervalM: 10
  };
}
