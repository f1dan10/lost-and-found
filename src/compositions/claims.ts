import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { no, reaction, when, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { isOpenFound, owns } from "./access.ts";
import { textInput } from "./reusable/inputs.ts";

const { Sessioning, Claiming, Reporting, Notifying } = concepts;

/** Only another person's open found report can be claimed; a second claim is refused by Claiming with ALREADY_CLAIMED. */
const ClaimReport = endpoint(
  "/reports/claim",
  ({ session, report, user }) =>
    receive({ session, report })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(isOpenFound({ report }), no(owns({ user, report })))
          .then(Claiming.claim({ claimant: user, item: report }).responds({ item: report }))
          .then(respond({ report }))
          .named("claimed"),
        where(isOpenFound({ report }), owns({ user, report }))
          .then(respond({ error: "CLAIMING_OWN_REPORT" }))
          .named("own"),
        where(no(isOpenFound({ report })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

/** A claimed item is found no more, so its report is closed. */
const ResolveOnClaim = reaction(({ report }) =>
  when(Claiming.claim({ item: report }).responds({ item: report })).then(Reporting.resolve({ report })),
);

const NotifyFinderOfClaim = reaction(({ report, reporter }) =>
  when(Claiming.claim({ item: report }).responds({ item: report }))
    .where(Reporting._getReport({ report }).is({ reporter }))
    .then(Notifying.notify({ recipient: reporter, message: "Your found item was claimed.", subject: report })),
);

export const composition = {
  claiming: { ClaimReport, ResolveOnClaim, NotifyFinderOfClaim },
};
