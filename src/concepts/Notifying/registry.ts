import { registerConcept } from "@mit-sdg/sync-engine/assembly";
import spec from "@design/concepts/Notifying.md" with { type: "text" };
import type { Db } from "mongodb";
import type { User } from "../Registering/Registering.ts";
import type { Report } from "../Reporting/Reporting.ts";
import type { Mailer } from "./mailer.ts";
import { InvalidAddress, NotificationNotFound, NotifyingConcept, UnknownRecipient } from "./Notifying.ts";

class Notifying extends NotifyingConcept<User, Report> {}

export const notifying = registerConcept({
  class: Notifying,
  spec,
  refusals: {
    INVALID_ADDRESS: InvalidAddress,
    UNKNOWN_RECIPIENT: UnknownRecipient,
    NOTIFICATION_NOT_FOUND: NotificationNotFound,
  },
  floors: {
    mongo: ({ database, mailer }: { database: Db; mailer: Mailer }, name: string) =>
      new Notifying(database, mailer, name),
  },
});
