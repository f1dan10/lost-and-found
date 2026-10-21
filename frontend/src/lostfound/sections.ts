import { daysLeft } from "./expiry.ts";
import type { Card, ClaimedCard, Lists, MyClaim, MyReport, ReportId } from "./types.ts";

/**
 * The places in the app, as the sidebar lists them. "Section" rather than "place", because a place is a building.
 * Campus sections show everyone's items; Yours sections show the signed-in person's, grouped by what happens next.
 */
export type Section = "found" | "lost" | "map" | "returned" | "waiting" | "reports" | "claims" | "history";

export const SECTIONS: readonly { id: Section; label: string; title: string; group: "campus" | "yours" }[] = [
  { id: "found", label: "Found", title: "Found around campus", group: "campus" },
  { id: "lost", label: "Lost", title: "Lost around campus", group: "campus" },
  { id: "map", label: "Map", title: "Where things are", group: "campus" },
  { id: "returned", label: "Returned", title: "Back with their owners", group: "campus" },
  { id: "waiting", label: "Waiting on you", title: "Waiting on you", group: "yours" },
  { id: "reports", label: "Your reports", title: "Your reports", group: "yours" },
  { id: "claims", label: "Your claims", title: "Your claims", group: "yours" },
  { id: "history", label: "History", title: "History", group: "yours" },
];

/** A report's state as a row shows it. */
export type RowState = "open" | "expired" | "claimed" | "picked-up" | "closed" | "removed";

/** Where a row came from, so the detail panel can offer the right actions. */
export type Source =
  | { type: "card"; card: Card }
  | { type: "returned"; claim: ClaimedCard }
  | { type: "mine"; report: MyReport }
  | { type: "claim"; claim: MyClaim };

/** One line in a section's list: the same fields whatever the item is, plus where it came from. */
export interface Row {
  /** Unique within a section, for Vue's `key`. */
  key: string;
  report: ReportId;
  kind: "found" | "lost";
  state: RowState;
  category: string;
  description: string;
  places: { place: string; name: string }[];
  spot: string | null;
  photo: string | null;
  /** Who reported it, or for my claims who found it; null when the screen shouldn't name anyone. */
  person: string | null;
  /** The time that matters in this section: filed, claimed, or picked up. */
  time: string;
  /** The heading the row sits under in sections that group their rows, such as "To pick up". */
  group: string | null;
  source: Source;
}

/** The last days of a report's life, when Waiting on you reminds its owner to renew it. */
export const EXPIRING_DAYS = 3;

const fromCard = (card: Card, kind: "found" | "lost", group: string | null = null): Row => ({
  key: `${group ?? kind}:${card.report}`,
  report: card.report,
  kind,
  state: "open",
  category: card.category,
  description: card.description,
  places: card.places,
  spot: card.spot,
  photo: card.photo,
  person: card.username,
  time: card.filedAt,
  group,
  source: { type: "card", card },
});

const fromMine = (report: MyReport, state: RowState, group: string | null, time = report.filedAt): Row => ({
  key: `${group ?? state}:${report.report}`,
  report: report.report,
  kind: report.kind === "FOUND" ? "found" : "lost",
  state,
  category: report.category,
  description: report.description,
  places: report.places,
  spot: report.spot,
  photo: report.photo,
  person: null,
  time,
  group,
  source: { type: "mine", report },
});

const fromClaim = (claim: MyClaim, group: string | null): Row => ({
  key: `${group ?? "claim"}:${claim.report}`,
  report: claim.report,
  kind: "found",
  state: claim.collectedAt ? "picked-up" : "claimed",
  category: claim.category,
  description: claim.description,
  places: claim.places,
  spot: claim.spot,
  photo: claim.photo,
  person: claim.foundBy,
  time: claim.collectedAt ?? claim.claimedAt,
  group,
  source: { type: "claim", claim },
});

const fromReturned = (claim: ClaimedCard): Row => ({
  key: `returned:${claim.report}`,
  report: claim.report,
  kind: "found",
  state: "claimed",
  category: claim.category,
  description: claim.description,
  places: claim.places,
  spot: claim.spot,
  photo: claim.photo,
  person: null,
  time: claim.claimedAt,
  group: null,
  source: { type: "returned", claim },
});

const newestFirst = (a: Row, b: Row) => new Date(b.time).getTime() - new Date(a.time).getTime();

/** What happened to one of my closed reports. */
function closedState(report: MyReport): RowState {
  if (report.status === "WITHDRAWN") return "removed";
  if (report.collectedAt) return "picked-up";
  if (report.claimedBy) return "claimed";
  return "closed";
}

/**
 * The rows of a section, from what the page has loaded, in the order they are shown. `me` is the signed-in username,
 * which tells my open reports from everyone else's. Every section is computed here, so the sidebar counts, the list,
 * and the search all agree.
 */
export function rowsFor(section: Section, lists: Lists, me: string | null, now: number = Date.now()): Row[] {
  const { reports, claims, myClaims, mine, notifications } = lists;
  switch (section) {
    case "found":
      return reports.found.map((card) => fromCard(card, "found"));
    case "lost":
      return reports.lost.map((card) => fromCard(card, "lost"));
    case "map":
      return [...reports.found.map((card) => fromCard(card, "found")), ...reports.lost.map((card) => fromCard(card, "lost"))];
    case "returned":
      return claims.map(fromReturned);
    case "waiting": {
      const pickUp = myClaims.filter((claim) => !claim.collectedAt).map((claim) => fromClaim(claim, "To pick up"));
      // An unread notice about someone else's open found item is a possible match; each item is listed once.
      const noticed = new Set(notifications.map((notice) => notice.subject));
      const matches = reports.found
        .filter((card) => noticed.has(card.report) && card.username !== me)
        .map((card) => fromCard(card, "found", "Possible matches"));
      const expiring = mine
        .filter((report) => report.status === "OPEN")
        .filter((report) => {
          const left = daysLeft(report.expiresAt, now);
          return left > 0 && left <= EXPIRING_DAYS;
        })
        .map((report) => fromMine(report, "open", "Expiring soon"));
      return [...pickUp, ...matches, ...expiring];
    }
    case "reports": {
      const open = mine.filter((report) => report.status === "OPEN");
      return [
        ...open.filter((report) => daysLeft(report.expiresAt, now) > 0).map((report) => fromMine(report, "open", "Open")),
        ...open.filter((report) => daysLeft(report.expiresAt, now) <= 0).map((report) => fromMine(report, "expired", "Expired")),
      ];
    }
    case "claims":
      return myClaims.filter((claim) => !claim.collectedAt).map((claim) => fromClaim(claim, null));
    case "history":
      return [
        ...myClaims.filter((claim) => claim.collectedAt).map((claim) => fromClaim(claim, null)),
        // A picked-up report is placed by when it was picked up; others by when they were filed.
        ...mine
          .filter((report) => report.status !== "OPEN")
          .map((report) => fromMine(report, closedState(report), null, report.collectedAt ?? report.filedAt)),
      ].sort(newestFirst);
  }
}

/** How many rows a section has, for the sidebar. The map has no count of its own. */
export function countFor(section: Section, lists: Lists, me: string | null, now: number = Date.now()): number | null {
  return section === "map" ? null : rowsFor(section, lists, me, now).length;
}

/**
 * The section a report lives in now, for opening a notice about it: an open item in Found or Lost, my claim in
 * Waiting on you or History, my own report in Your reports or History, someone else's claimed item in Returned.
 * Null when it is in none of them.
 */
export function sectionOf(report: ReportId, lists: Lists, me: string | null, now: number = Date.now()): Section | null {
  const order: Section[] = ["found", "lost", "waiting", "reports", "claims", "history", "returned"];
  return order.find((section) => rowsFor(section, lists, me, now).some((row) => row.report === report)) ?? null;
}
