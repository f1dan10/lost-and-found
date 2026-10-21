import type { Db } from "mongodb";
import { LocatingConcept, PlaceExists } from "../concepts/Locating/Locating.ts";

/**
 * The places people can choose: every MIT building in OpenStreetMap with an MIT building number (© OpenStreetMap
 * contributors, ODbL), except plant and service structures nobody visits. Each position is the centre of the
 * building's footprint. Names are the building number and, when it has one, its common name; the 24 names the
 * earlier seeds used are kept exactly, because the seed finds an existing place by its name.
 */
export const PLACES = [
  { name: "Building 1", latitude: 42.35813, longitude: -71.09223 },
  { name: "Building 2", latitude: 42.3588, longitude: -71.09023 },
  { name: "Building 3", latitude: 42.35897, longitude: -71.09239 },
  { name: "Building 4", latitude: 42.3594, longitude: -71.09117 },
  { name: "Building 5", latitude: 42.35871, longitude: -71.09292 },
  { name: "Building 6", latitude: 42.35957, longitude: -71.09044 },
  { name: "Building 6C", latitude: 42.35968, longitude: -71.09083 },
  { name: "Building 7", latitude: 42.35932, longitude: -71.09314 },
  { name: "Building 8", latitude: 42.36002, longitude: -71.09088 },
  { name: "Building 9 (Samuel Tak Lee Building)", latitude: 42.35977, longitude: -71.09359 },
  { name: "Building 10", latitude: 42.35969, longitude: -71.09199 },
  { name: "Building 11 (Homberg Building)", latitude: 42.35953, longitude: -71.09277 },
  { name: "Building 13", latitude: 42.35995, longitude: -71.09256 },
  { name: "Building 14 (Hayden Library)", latitude: 42.35918, longitude: -71.08941 },
  { name: "Building 16", latitude: 42.36042, longitude: -71.09057 },
  { name: "Building 17 (Wright Brothers Wind Tunnel)", latitude: 42.3602, longitude: -71.09355 },
  { name: "Building 18 (Dreyfus Building)", latitude: 42.36009, longitude: -71.08983 },
  { name: "Building 24", latitude: 42.36071, longitude: -71.09202 },
  { name: "Building 26", latitude: 42.3609, longitude: -71.09109 },
  { name: "Building 31 (Sloan Labs)", latitude: 42.36038, longitude: -71.09308 },
  { name: "Building 32 (Stata)", latitude: 42.36154, longitude: -71.09066 },
  { name: "Building 33 (Guggenheim Lab)", latitude: 42.36014, longitude: -71.09378 },
  { name: "Building 34", latitude: 42.36115, longitude: -71.09193 },
  { name: "Building 35 (Sloan Lab)", latitude: 42.36039, longitude: -71.09404 },
  { name: "Building 36", latitude: 42.36144, longitude: -71.09164 },
  { name: "Building 37 (McNair Building)", latitude: 42.3607, longitude: -71.09327 },
  { name: "Building 38", latitude: 42.36109, longitude: -71.09234 },
  { name: "Building 39 (Brown Building)", latitude: 42.36086, longitude: -71.09273 },
  { name: "Building 41", latitude: 42.36077, longitude: -71.09417 },
  { name: "Building 45 (Schwarzman Building)", latitude: 42.36168, longitude: -71.09239 },
  { name: "Building 46", latitude: 42.36223, longitude: -71.09153 },
  { name: "Building 48 (Parsons Lab)", latitude: 42.36243, longitude: -71.09066 },
  { name: "Building 50 (Walker)", latitude: 42.35937, longitude: -71.0883 },
  { name: "Building 51 (Wood Sailing Pavilion)", latitude: 42.35853, longitude: -71.08773 },
  { name: "Building 54 (Green Building)", latitude: 42.36032, longitude: -71.08934 },
  { name: "Building 55", latitude: 42.36044, longitude: -71.0894 },
  { name: "Building 56", latitude: 42.36071, longitude: -71.08985 },
  { name: "Building 57 (Alumni Pool)", latitude: 42.36116, longitude: -71.09016 },
  { name: "Building 62", latitude: 42.36022, longitude: -71.08868 },
  { name: "Building 64", latitude: 42.36041, longitude: -71.08814 },
  { name: "Building 66", latitude: 42.36089, longitude: -71.08893 },
  { name: "Building 68 (Koch Biology Building)", latitude: 42.36164, longitude: -71.08864 },
  { name: "Building 76 (Koch)", latitude: 42.3623, longitude: -71.08924 },
  { name: "E1 (Gray House)", latitude: 42.35964, longitude: -71.08696 },
  { name: "E2 (70 Amherst)", latitude: 42.35993, longitude: -71.08693 },
  { name: "E14 (Media Lab)", latitude: 42.36046, longitude: -71.08732 },
  { name: "E17 (Mudd Building)", latitude: 42.36149, longitude: -71.0879 },
  { name: "E18 (Ford Building)", latitude: 42.36181, longitude: -71.08782 },
  { name: "E19", latitude: 42.36215, longitude: -71.08796 },
  { name: "E28", latitude: 42.36212, longitude: -71.08667 },
  { name: "E37", latitude: 42.36191, longitude: -71.0855 },
  { name: "E38", latitude: 42.362, longitude: -71.08566 },
  { name: "E40 (Muckley Building)", latitude: 42.36116, longitude: -71.08485 },
  { name: "E48", latitude: 42.36206, longitude: -71.08473 },
  { name: "E51 (Tang Center)", latitude: 42.36058, longitude: -71.08454 },
  { name: "E52 (Morris & Sophie Chang Building)", latitude: 42.36072, longitude: -71.08365 },
  { name: "E53 (Hermann Building)", latitude: 42.36119, longitude: -71.08358 },
  { name: "E60 (Arthur D. Little Building)", latitude: 42.36118, longitude: -71.08217 },
  { name: "E70 (One Broadway)", latitude: 42.36276, longitude: -71.08352 },
  { name: "N4 (Albany Garage)", latitude: 42.36203, longitude: -71.09278 },
  { name: "N9 (Superconducting Test Facility)", latitude: 42.36096, longitude: -71.09521 },
  { name: "N10 (High Voltage Research Lab)", latitude: 42.36087, longitude: -71.09545 },
  { name: "N51", latitude: 42.36227, longitude: -71.09766 },
  { name: "N52", latitude: 42.36226, longitude: -71.09718 },
  { name: "NE47 (500 Technology Square)", latitude: 42.36339, longitude: -71.09258 },
  { name: "NE49", latitude: 42.36346, longitude: -71.09317 },
  { name: "NW10 (Edgerton House)", latitude: 42.36032, longitude: -71.09814 },
  { name: "NW12 (Nuclear Reactor Lab)", latitude: 42.36007, longitude: -71.09684 },
  { name: "NW13", latitude: 42.35988, longitude: -71.09736 },
  { name: "NW14 (Bitter Magnet Lab)", latitude: 42.35963, longitude: -71.09791 },
  { name: "NW16", latitude: 42.36005, longitude: -71.09873 },
  { name: "NW17", latitude: 42.35986, longitude: -71.09914 },
  { name: "NW21 (Plasma Science & Fusion Center)", latitude: 42.35909, longitude: -71.09917 },
  { name: "NW22", latitude: 42.35972, longitude: -71.09956 },
  { name: "NW23", latitude: 42.35956, longitude: -71.09989 },
  { name: "NW30 (The Warehouse)", latitude: 42.35865, longitude: -71.09996 },
  { name: "NW32", latitude: 42.35859, longitude: -71.10052 },
  { name: "NW35 (Ashdown House)", latitude: 42.35877, longitude: -71.10139 },
  { name: "NW61 (Random Hall)", latitude: 42.36186, longitude: -71.09828 },
  { name: "NW86 (Sidney Pacific)", latitude: 42.35975, longitude: -71.1022 },
  { name: "NW98", latitude: 42.35956, longitude: -71.10472 },
  { name: "W1 (Maseeh Hall)", latitude: 42.35763, longitude: -71.09345 },
  { name: "W2", latitude: 42.35725, longitude: -71.09381 },
  { name: "W4 (McCormick Hall)", latitude: 42.35719, longitude: -71.09441 },
  { name: "W5 (Green Hall)", latitude: 42.35693, longitude: -71.09511 },
  { name: "W7 (Baker House)", latitude: 42.35665, longitude: -71.09579 },
  { name: "W8 (Resch Boathouse)", latitude: 42.35532, longitude: -71.09682 },
  { name: "W11 (Religious Activities Center)", latitude: 42.35827, longitude: -71.09354 },
  { name: "W15 (MIT Chapel)", latitude: 42.35833, longitude: -71.09408 },
  { name: "W16 (Kresge)", latitude: 42.35818, longitude: -71.09507 },
  { name: "W18 (Linde Music Building)", latitude: 42.35769, longitude: -71.09583 },
  { name: "W20 (Student Center)", latitude: 42.35905, longitude: -71.09477 },
  { name: "W31 (du Pont Athletic Gymnasium)", latitude: 42.35964, longitude: -71.09519 },
  { name: "W32 (du Pont Athletic Center)", latitude: 42.35937, longitude: -71.09513 },
  { name: "W33 (Rockwell Cage)", latitude: 42.3592, longitude: -71.09598 },
  { name: "W34 (Johnson Athletic Center)", latitude: 42.35864, longitude: -71.09654 },
  { name: "W35 (Zesiger Center)", latitude: 42.35872, longitude: -71.09576 },
  { name: "W41 (Metropolitan Storage Warehouse)", latitude: 42.35982, longitude: -71.09605 },
  { name: "W46 (New Vassar)", latitude: 42.35887, longitude: -71.09814 },
  { name: "W51 (Burton Conner House)", latitude: 42.35595, longitude: -71.0981 },
  { name: "W53 (Carr Indoor Tennis)", latitude: 42.35693, longitude: -71.09781 },
  { name: "W59 (Heinz Building)", latitude: 42.35811, longitude: -71.09954 },
  { name: "W61 (MacGregor House)", latitude: 42.35549, longitude: -71.09953 },
  { name: "W70 (New House)", latitude: 42.35517, longitude: -71.10054 },
  { name: "W71 (Next House)", latitude: 42.35472, longitude: -71.10183 },
  { name: "W79 (Simmons Hall)", latitude: 42.35711, longitude: -71.10152 },
  { name: "W84 (Tang Hall)", latitude: 42.35435, longitude: -71.10348 },
  { name: "W85 (Westgate)", latitude: 42.355, longitude: -71.10326 },
  { name: "W87 (Grad Junction)", latitude: 42.35647, longitude: -71.10282 },
  { name: "W88 (Grad Junction)", latitude: 42.35571, longitude: -71.10435 },
  { name: "W91", latitude: 42.35435, longitude: -71.10438 },
  { name: "W92 (Information Technology)", latitude: 42.35495, longitude: -71.1046 },
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
