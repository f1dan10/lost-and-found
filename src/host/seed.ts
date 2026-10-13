import type { Db } from "mongodb";
import { LocatingConcept, PlaceExists } from "../concepts/Locating/Locating.ts";

/**
 * The places people can choose. The coordinates are approximate and only need to be valid, because
 * Alpha has no real map.
 */
export const PLACES = [
  { name: "Building 1", latitude: 42.3592, longitude: -71.0921 },
  { name: "Building 2", latitude: 42.3594, longitude: -71.0924 },
  { name: "Building 3", latitude: 42.3596, longitude: -71.0928 },
  { name: "Building 4", latitude: 42.3598, longitude: -71.0931 },
  { name: "Building 6", latitude: 42.3600, longitude: -71.0925 },
  { name: "Building 7", latitude: 42.3593, longitude: -71.0935 },
  { name: "Building 8", latitude: 42.3601, longitude: -71.0922 },
  { name: "Building 10", latitude: 42.3598, longitude: -71.0919 },
  { name: "Building 13", latitude: 42.3604, longitude: -71.0928 },
  { name: "Building 16", latitude: 42.3606, longitude: -71.0916 },
  { name: "Building 26", latitude: 42.3612, longitude: -71.0905 },
  { name: "Building 32 (Stata)", latitude: 42.3620, longitude: -71.0901 },
  { name: "Building 34", latitude: 42.3609, longitude: -71.0944 },
  { name: "Building 36", latitude: 42.3614, longitude: -71.0910 },
  { name: "Building 46", latitude: 42.3626, longitude: -71.0912 },
  { name: "Building 56", latitude: 42.3629, longitude: -71.0890 },
  { name: "Building 66", latitude: 42.3623, longitude: -71.0885 },
  { name: "W20 (Student Center)", latitude: 42.3591, longitude: -71.0946 },
] as const;

/** Adds each place that isn't there yet, so running it again changes nothing. */
export async function seedPlaces(database: Db): Promise<void> {
  const locating = new LocatingConcept<string>(database, "Locating");
  for (const place of PLACES) {
    try {
      await locating.addPlace(place);
    } catch (error) {
      if (!(error instanceof PlaceExists)) throw error;
    }
  }
}
