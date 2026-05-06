export const DEFAULT_OFF_ROUTE_THRESHOLD_METERS = 50;

export function isOffRoute({ distanceFromRouteMeters, thresholdMeters = DEFAULT_OFF_ROUTE_THRESHOLD_METERS }) {
  return distanceFromRouteMeters > thresholdMeters;
}
