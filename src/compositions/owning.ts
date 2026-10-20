import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, no, whether, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { owns } from "./access.ts";
import { textInput } from "./reusable/inputs.ts";

const { Sessioning, Reporting, Locating, Claiming, Registering, Thanking } = concepts;

// Closing

/**
 * Only the person who filed a report may remove it. Removing withdraws the report rather than deleting it,
 * because claims and notices still point at it. A report that is already closed is refused by Reporting with NOT_OPEN.
 */
const WithdrawReport = endpoint(
  "/reports/withdraw",
  ({ session, report, user }) =>
    receive({ session, report })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(owns({ user, report }))
          .then(Reporting.withdraw({ report }).responds({ report }))
          .then(respond({ report }))
          .named("mine"),
        where(no(owns({ user, report })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

/** The owner closes their report because the item is back with its owner, such as "I got it back" on a lost report. */
const ResolveReport = endpoint(
  "/reports/resolve",
  ({ session, report, user }) =>
    receive({ session, report })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(owns({ user, report }))
          .then(Reporting.resolve({ report }).responds({ report }))
          .then(respond({ report }))
          .named("mine"),
        where(no(owns({ user, report })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

/** The owner says the item is still there, or still lost, which keeps the report open for two more weeks. */
const RenewReport = endpoint(
  "/reports/renew",
  ({ session, report, user }) =>
    receive({ session, report })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(owns({ user, report }))
          .then(Reporting.renew({ report }).responds({ report }))
          .then(respond({ report }))
          .named("mine"),
        where(no(owns({ user, report })))
          .then(respond({ error: "NOT_FOUND" }))
          .named("refused"),
      ),
  { validators: { input: textInput } },
);

// Listing

/**
 * Every report the user filed, newest first, open or closed, with its kind, status, and expiry so the screen can
 * offer the right actions, such as renewing one that has expired. The spot and the photo are null when a report has none. `claimedBy` is the username of whoever
 * claimed a found report, shown only here to the person who found it, and null while it is unclaimed. `thankedAt`
 * and `thanksNote` say when the claimant thanked them and what they wrote, and are null until then.
 */
export const myReports = former(
  "the reports of (user)",
  ({ user }, { report, kind, category, description, filedAt, expiresAt, status, place, name, spot, photo, claimant, claimedBy, thankedAt, thanksNote }) =>
    each(Reporting._getByReporter({ reporter: user }).is({ report }))
      .where(
        Reporting._getReport({ report }).is({ kind, category, description, filedAt, expiresAt, status }),
        whether(Locating._getSpot({ item: report }).is({ spot })),
        whether(Reporting._getPhoto({ report }).is({ photo })),
        whether(Claiming._getClaimant({ item: report }).is({ claimant })),
        whether(Registering._username({ user: claimant }).is({ username: claimedBy })),
        whether(Thanking._getThanks({ item: report }).is({ thankedAt })),
        whether(Thanking._getNote({ item: report }).is({ note: thanksNote })),
      )
      .form({
        report,
        kind,
        category,
        description,
        filedAt,
        expiresAt,
        status,
        claimedBy,
        thankedAt,
        thanksNote,
        spot,
        photo,
        places: each(Locating._getPlacesOf({ item: report }).is({ place, name })).form({ place, name }),
      }),
);

const ListMyReports = endpoint(
  "/reports/mine",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(respond({ reports: myReports({ user }) })),
  { validators: { input: textInput } },
);

export const composition = {
  closing: { WithdrawReport, ResolveReport, RenewReport },
  listing: { myReports, ListMyReports },
};
