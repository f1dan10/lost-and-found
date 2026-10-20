import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Thanking.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Registering/Registering.ts";
import type { Report } from "../Reporting/Reporting.ts";
import { AlreadyThanked, InvalidNote, ThankingConcept } from "./Thanking.ts";

class Thanking extends ThankingConcept<User, Report> {}

export const thanking = registerConcept({
  class: Thanking,
  spec,
  refusals: { INVALID_NOTE: InvalidNote, ALREADY_THANKED: AlreadyThanked },
  floors: {
    mongo: ({ database, clock }: { database: Db; clock?: () => Date }, name: string) => new Thanking(database, name, clock),
  },
});
