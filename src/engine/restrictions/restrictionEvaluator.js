import {
  getRestrictedRoadRules,
  isAllowedParkwayException
} from "./restrictionData";

export function hasException(roadName) {
  return isAllowedParkwayException(roadName);
}

export function canPass({ roadName }) {
  if (!roadName) {
    return true;
  }

  if (hasException(roadName)) {
    return true;
  }

  return !getRestrictedRoadRules().some((rule) => rule.road === roadName);
}
