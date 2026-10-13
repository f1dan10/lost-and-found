import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Locating.md" with { type: "text" };
import type { Db } from "mongodb";
import type { Report } from "../Reporting/Reporting.ts";
import {
  AlreadyLocated,
  InvalidPlace,
  InvalidSpot,
  LocatingConcept,
  NoPlaces,
  PlaceExists,
  TooManyPlaces,
  UnknownPlace,
} from "./Locating.ts";

class Locating extends LocatingConcept<Report> {}

export const locating = registerConcept({
  class: Locating,
  spec,
  refusals: {
    INVALID_PLACE: InvalidPlace,
    PLACE_EXISTS: PlaceExists,
    NO_PLACES: NoPlaces,
    TOO_MANY_PLACES: TooManyPlaces,
    INVALID_SPOT: InvalidSpot,
    UNKNOWN_PLACE: UnknownPlace,
    ALREADY_LOCATED: AlreadyLocated,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new Locating(database, name) },
});
