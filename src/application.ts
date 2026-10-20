import { assemble, type LogSink, type OperationalObserver } from "@mit-sdg/sync-engine/assembly";
import type { Db } from "mongodb";
import type { Mailer } from "./concepts/Notifying/mailer.ts";
import { composition as addressing } from "./compositions/addressing.ts";
import { composition as reports } from "./compositions/reports.ts";
import { composition as matching } from "./compositions/matching.ts";
import { composition as claims } from "./compositions/claims.ts";
import { composition as notifications } from "./compositions/notifications.ts";
import { composition as owning } from "./compositions/owning.ts";
import { composition as thanks } from "./compositions/thanks.ts";
import { composition as access } from "./compositions/access.ts";
import { composition as accounts } from "./compositions/reusable/accounts.ts";
import { composition as passwords } from "./compositions/reusable/passwords.ts";
import { applicationConceptSet } from "./concepts.ts";

/**
 * Builds Lost&Found on a database and a mailer; the HTTP server, the tests, and `sync-engine check` all use it.
 * Tests may pass a `clock` so reports can expire and claims can age without waiting; Reporting and Claiming read it.
 */
export function assembleLostFound(
  resources: { database: Db; mailer: Mailer; clock?: () => Date },
  options: { observers?: OperationalObserver[]; logSink?: LogSink } = {},
) {
  return assemble({
    conceptSet: applicationConceptSet,
    instances: applicationConceptSet.implementations("mongo", resources),
    ...options,
    composition: { reusable: { accounts, passwords }, access, addressing, reports, matching, claims, notifications, owning, thanks },
  });
}
