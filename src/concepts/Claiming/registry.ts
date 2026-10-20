import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Claiming.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Registering/Registering.ts";
import type { Report } from "../Reporting/Reporting.ts";
import { AlreadyClaimed, ClaimingConcept } from "./Claiming.ts";

class Claiming extends ClaimingConcept<User, Report> {}

export const claiming = registerConcept({
  class: Claiming,
  spec,
  refusals: { ALREADY_CLAIMED: AlreadyClaimed },
  floors: {
    mongo: ({ database, clock }: { database: Db; clock?: () => Date }, name: string) => new Claiming(database, name, clock),
  },
});
