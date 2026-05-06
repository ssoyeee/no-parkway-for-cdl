import { computeLegalRoute } from "../engine";

export async function calculateSafeRoute({
  originLabel,
  destinationLabel,
  vehicleProfileId,
  preferences = {}
}) {
  return computeLegalRoute({
    originLabel,
    destinationLabel,
    vehicleProfileId,
    preferences
  });
}
