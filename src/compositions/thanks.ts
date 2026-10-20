import { type EndpointValidator, endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { no, reaction, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { claimed } from "./access.ts";

const { Sessioning, Thanking, Reporting, Notifying } = concepts;

/** The report is text, and the note is text or null; Thanking checks the note's length. */
const thanksInput: EndpointValidator = (value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return { ok: false, detail: "expected an object" };
  const { session, note, ...text } = value as Record<string, unknown>;
  if (session !== null && typeof session !== "string") return { ok: false, detail: "expected text fields" };
  if (note !== null && note !== undefined && typeof note !== "string") return { ok: false, detail: "expected a note as text" };
  if (!Object.values(text).every((field) => typeof field === "string")) return { ok: false, detail: "expected text fields" };
  return { ok: true };
};

/** Only the person who claimed an item can thank for it, once; a second thanks is refused by Thanking with ALREADY_THANKED. */
const SendThanks = endpoint(
  "/thanks/send",
  ({ session, report, note, user }) =>
    receive({ session, report, note })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(claimed({ user, report }))
          .then(Thanking.thank({ thanker: user, item: report, note }).responds({ item: report }))
          .then(respond({ report }))
          .named("thanked"),
        where(no(claimed({ user, report })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: thanksInput }, input: { required: ["session", "report"], defaults: { note: null } } },
);

const NotifyFinderOfThanks = reaction(({ report, reporter }) =>
  when(Thanking.thank({ item: report }).responds({ item: report }))
    .where(Reporting._getReport({ report }).is({ reporter }))
    .then(Notifying.notify({ recipient: reporter, message: "The owner of an item you found thanked you.", subject: report })),
);

export const composition = {
  sending: { SendThanks, NotifyFinderOfThanks },
};
