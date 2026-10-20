import type { Db } from "mongodb";
import { LocatingConcept, PlaceExists } from "../concepts/Locating/Locating.ts";

/**
 * The places people can choose. Each position is the centre of the building's footprint in OpenStreetMap
 * (© OpenStreetMap contributors, ODbL), matched by its MIT building number.
 */
export const PLACES = [
  { name: "Building 1", latitude: 42.35813, longitude: -71.09223 },
  { name: "Building 2", latitude: 42.3588, longitude: -71.09023 },
  { name: "Building 3", latitude: 42.35897, longitude: -71.09239 },
  { name: "Building 4", latitude: 42.3594, longitude: -71.09117 },
  { name: "Building 6", latitude: 42.35957, longitude: -71.09044 },
  { name: "Building 7", latitude: 42.35932, longitude: -71.09314 },
  { name: "Building 8", latitude: 42.36002, longitude: -71.09088 },
  { name: "Building 10", latitude: 42.35969, longitude: -71.09199 },
  { name: "Building 13", latitude: 42.35995, longitude: -71.09256 },
  { name: "Building 14 (Hayden Library)", latitude: 42.35918, longitude: -71.08941 },
  { name: "Building 16", latitude: 42.36042, longitude: -71.09057 },
  { name: "Building 26", latitude: 42.3609, longitude: -71.09109 },
  { name: "Building 32 (Stata)", latitude: 42.36154, longitude: -71.09066 },
  { name: "Building 34", latitude: 42.36115, longitude: -71.09193 },
  { name: "Building 36", latitude: 42.36144, longitude: -71.09164 },
  { name: "Building 46", latitude: 42.36223, longitude: -71.09153 },
  { name: "Building 50 (Walker)", latitude: 42.35937, longitude: -71.0883 },
  { name: "Building 56", latitude: 42.36071, longitude: -71.08985 },
  { name: "Building 66", latitude: 42.36089, longitude: -71.08893 },
  { name: "Building 76 (Koch)", latitude: 42.3623, longitude: -71.08924 },
  { name: "E14 (Media Lab)", latitude: 42.36046, longitude: -71.08732 },
  { name: "W16 (Kresge)", latitude: 42.35818, longitude: -71.09507 },
  { name: "W20 (Student Center)", latitude: 42.35905, longitude: -71.09477 },
  { name: "W35 (Zesiger Center)", latitude: 42.35872, longitude: -71.09576 },
] as const;

/**
 * Adds each place that isn't there yet, and moves each one that is somewhere else, so running it again changes
 * nothing. The Alpha seeded approximate positions; this corrects them in a database that already has them.
 */
export async function seedPlaces(database: Db): Promise<void> {
  const locating = new LocatingConcept<string>(database, "Locating");
  const existing = new Map((await locating._getPlaces()).map((place) => [place.name, place]));
  for (const place of PLACES) {
    const found = existing.get(place.name);
    if (found === undefined) {
      try {
        await locating.addPlace(place);
      } catch (error) {
        if (!(error instanceof PlaceExists)) throw error;
      }
    } else if (found.latitude !== place.latitude || found.longitude !== place.longitude) {
      await locating.reposition({ place: found.place, latitude: place.latitude, longitude: place.longitude });
    }
  }
}
