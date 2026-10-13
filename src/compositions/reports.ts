import { type EndpointValidator, endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { no, view, where } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Sessioning, Reporting, Locating } = concepts;

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

export const composition = {
  filing: { hasUnknownPlace, FileReport },
};
