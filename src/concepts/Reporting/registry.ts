import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Reporting.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Registering/Registering.ts";
import { InvalidReport, NotOpen, ReportNotFound, ReportingConcept } from "./Reporting.ts";

class Reporting extends ReportingConcept<User> {}

export const reporting = registerConcept({
  class: Reporting,
  spec,
  refusals: {
    INVALID_REPORT: InvalidReport,
    REPORT_NOT_FOUND: ReportNotFound,
    NOT_OPEN: NotOpen,
  },
  floors: { mongo: ({ database }: { database: Db }, name: string) => new Reporting(database, name) },
});
