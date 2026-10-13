import { type EndpointValidator, endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, former, no, view, whether, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";
import { textInput } from "./reusable/inputs.ts";

const { Registering, Sessioning, Reporting, Locating } = concepts;

/** A report is filed in 1 to 12 places, and refused actions aren't undone, so the places are checked before anything is filed. */
const reportInput: EndpointValidator = (value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, detail: "expected an object" };
  }
  const { places, spot, photo, session, ...text } = value as Record<string, unknown>;
  if (!Array.isArray(places) || places.length < 1 || places.length > 12 || !places.every((p) => typeof p === "string")) {
    return { ok: false, detail: "expected 1 to 12 places" };
  }
  if (session !== null && typeof session !== "string") return { ok: false, detail: "expected text fields" };
  if (!Object.values(text).every((field) => typeof field === "string")) return { ok: false, detail: "expected text fields" };
  if (spot !== undefined && spot !== null && (typeof spot !== "string" || spot.length < 1 || spot.length > 100)) {
    return { ok: false, detail: "expected a spot of 1 to 100 characters" };
  }
  if (photo !== undefined && photo !== null && typeof photo !== "string") return { ok: false, detail: "expected a photo as text" };
  return { ok: true };
};

/** Holds when any of the places doesn't exist. */
export const hasUnknownPlace = view("(places) has an unknown place", ({ places }) =>
  where(Locating._unknown({ places })),
).holds();

const FileReport = endpoint(
  "/reports/file",
  ({ session, kind, category, description, places, photo, spot, user, report }) =>
    receive({ session, kind, category, description, places, photo, spot })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(
        where(no(hasUnknownPlace({ places })))
          .then(Reporting.file({ reporter: user, kind, category, description, photo }).responds({ report }))
          .then(Locating.locate({ item: report, places, spot }).responds({ item: report }))
          .then(respond({ report }))
          .named("filed"),
        where(hasUnknownPlace({ places }))
          .then(respond({ error: "UNKNOWN_PLACE" }))
          .named("unknown-place"),
      ),
  {
    validators: { input: reportInput },
    input: { required: ["session", "kind", "category", "description", "places"], defaults: { photo: null, spot: null } },
  },
);

// Listing

/**
 * The open reports of a kind, newest first, with who filed each and where it is. The spot and the photo are null
 * when a report has none. The photo is inlined for Alpha, where the frontend resizes it to about 400 px; a later
 * version may serve photos from their own endpoint.
 */
export const reportCards = former(
  "the open reports of (kind)",
  ({ kind }, { report, category, description, filedAt, reporter, username, place, name, spot, photo }) =>
    each(Reporting._getOpen({ kind }).is({ report }))
      .where(
        Reporting._getReport({ report }).is({ category, description, filedAt, reporter }),
        Registering._username({ user: reporter }).is({ username }),
        whether(Locating._getSpot({ item: report }).is({ spot })),
        whether(Reporting._getPhoto({ report }).is({ photo })),
      )
      .form({
        report,
        category,
        description,
        filedAt,
        reporter,
        username,
        spot,
        photo,
        places: each(Locating._getPlacesOf({ item: report }).is({ place, name })).form({ place, name }),
      }),
);

/** Every place a report can be in, by name. */
export const allPlaces = former(
  "every place",
  ({}, { place, name, latitude, longitude }) =>
    each(Locating._getPlaces({}).is({ place, name, latitude, longitude })).form({ place, name, latitude, longitude }),
);

const ListReports = endpoint(
  "/reports/list",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(respond({ found: reportCards({ kind: "FOUND" }), lost: reportCards({ kind: "LOST" }) })),
  { validators: { input: textInput } },
);

const ListPlaces = endpoint(
  "/places/list",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.use({ session }).responds({ subject: user }))
      .then(respond({ places: allPlaces({}) })),
  { validators: { input: textInput } },
);

export const composition = {
  filing: { hasUnknownPlace, FileReport },
  listing: { reportCards, allPlaces, ListReports, ListPlaces },
};
