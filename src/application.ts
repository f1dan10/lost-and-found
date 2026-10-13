import { assemble, type LogSink, type OperationalObserver } from "@mit-sdg/sync-engine/assembly";
import type { Db } from "mongodb";
import type { Mailer } from "./concepts/Notifying/mailer.ts";
import { composition as addressing } from "./compositions/addressing.ts";
import { composition as reports } from "./compositions/reports.ts";
import { composition as access } from "./compositions/access.ts";
import { composition as accounts } from "./compositions/reusable/accounts.ts";
import { composition as passwords } from "./compositions/reusable/passwords.ts";
import { applicationConceptSet } from "./concepts.ts";

/** Builds Lost&Found on a database and a mailer; the HTTP server, the tests, and `sync-engine check` all use it. */
export function assembleLostFound(
  resources: { database: Db; mailer: Mailer },
  options: { observers?: OperationalObserver[]; logSink?: LogSink } = {},
) {
  return assemble({
    conceptSet: applicationConceptSet,
    instances: applicationConceptSet.implementations("mongo", resources),
    ...options,
    composition: { reusable: { accounts, passwords }, access, addressing, reports },
  });
}
