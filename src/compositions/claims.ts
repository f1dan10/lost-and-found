import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, no, reaction, when, whether, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { isOpenFound, owns } from "./access.ts";
import { textInput } from "./reusable/inputs.ts";

const { Sessioning, Claiming, Reporting, Notifying, Registering, Locating } = concepts;

/** How far back the Claimed tab looks. Older claims stay recorded in Claiming; they are only left out of the list. */
const RECENT_DAYS = 30;

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

// Listing

/**
 * What was claimed in the last 30 days, newest first, with where the item was. It says that an item was claimed,
 * never who claimed it: the claimant's name goes only to the finder and to the claimant.
 */
export const claimedCards = former(
  "the recently claimed items",
  ({}, { report, claimedAt, category, description, place, name, spot, photo }) =>
    each(Claiming._recent({ days: RECENT_DAYS }).is({ item: report, claimedAt }))
      .where(
        Reporting._getReport({ report }).is({ category, description }),
        whether(Locating._getSpot({ item: report }).is({ spot })),
        whether(Reporting._getPhoto({ report }).is({ photo })),
      )
      .form({
        report,
        claimedAt,
        category,
        description,
        spot,
        photo,
        places: each(Locating._getPlacesOf({ item: report }).is({ place, name })).form({ place, name }),
      }),
);

/**
 * Every item the user claimed, newest first and however long ago, with the building and spot to pick it up from
 * and the username of the person who found it.
 */
export const myClaims = former(
  "the claims of (user)",
  ({ user }, { report, claimedAt, category, description, reporter, foundBy, place, name, spot, photo }) =>
    each(Claiming._byClaimant({ claimant: user }).is({ item: report, claimedAt }))
      .where(
        Reporting._getReport({ report }).is({ category, description, reporter }),
        Registering._username({ user: reporter }).is({ username: foundBy }),
        whether(Locating._getSpot({ item: report }).is({ spot })),
        whether(Reporting._getPhoto({ report }).is({ photo })),
      )
      .form({
        report,
        claimedAt,
        category,
        description,
        foundBy,
        spot,
        photo,
        places: each(Locating._getPlacesOf({ item: report }).is({ place, name })).form({ place, name }),
      }),
);

const ListClaims = endpoint(
  "/claims/list",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(respond({ claims: claimedCards({}) })),
  { validators: { input: textInput } },
);

const ListMyClaims = endpoint(
  "/claims/mine",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(respond({ claims: myClaims({ user }) })),
  { validators: { input: textInput } },
);

export const composition = {
  claiming: { ClaimReport, ResolveOnClaim, NotifyFinderOfClaim },
  listing: { claimedCards, myClaims, ListClaims, ListMyClaims },
};
