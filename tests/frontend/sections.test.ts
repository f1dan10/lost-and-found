import { describe, expect, test } from "bun:test";
import { matchesElsewhere } from "../../frontend/src/lostfound/search.ts";
import { countFor, rowsFor, sectionOf } from "../../frontend/src/lostfound/sections.ts";
import type { Card, ClaimedCard, Lists, MyClaim, MyReport, Notification } from "../../frontend/src/lostfound/types.ts";

/** Noon on Oct 20; every time below is counted from it. */
const NOW = Date.UTC(2026, 9, 20, 12, 0);
const DAY = 24 * 60 * 60 * 1000;
const at = (days: number) => new Date(NOW + days * DAY).toISOString();
const b2 = [{ place: "b2", name: "Building 2" }];

const card = (report: string, username: string, filedDays = -1): Card =>
  ({ report, category: "BOTTLE", description: report, filedAt: at(filedDays), expiresAt: at(filedDays + 14), reporter: username, username, spot: null, photo: null, places: b2 }) as unknown as Card;

const myReport = (report: string, fields: Partial<Record<keyof MyReport, unknown>> = {}): MyReport =>
  ({ report, kind: "LOST", category: "BOTTLE", description: report, filedAt: at(-1), expiresAt: at(13), status: "OPEN", claimedBy: null, collectedAt: null, thankedAt: null, thanksNote: null, spot: null, photo: null, places: b2, ...fields }) as unknown as MyReport;

const myClaim = (report: string, fields: Partial<Record<keyof MyClaim, unknown>> = {}): MyClaim =>
  ({ report, claimedAt: at(-2), collectedAt: null, category: "BOTTLE", description: report, foundBy: "tom", thankedAt: null, thanksNote: null, spot: "by the bench", photo: null, places: b2, ...fields }) as unknown as MyClaim;

const returned = (report: string): ClaimedCard =>
  ({ report, claimedAt: at(-1), category: "BAG", description: report, spot: null, photo: null, places: b2 }) as unknown as ClaimedCard;

const notice = (subject: string): Notification =>
  ({ notification: `n-${subject}`, message: "An item matching your lost report was found.", subject, sentAt: at(0), category: "BOTTLE", description: subject, claimedBy: null }) as unknown as Notification;

/** Tamar's view: two open found items (one matched), her own found item, a lost item, two claims, and her reports. */
function tamarsLists(): Lists {
  return {
    reports: {
      found: [card("flask", "tom"), card("charger", "sam"), card("my-umbrella", "tamar")],
      lost: [card("my-calculator", "tamar"), card("jacket", "sam")],
    },
    claims: [returned("backpack"), returned("flask-old")],
    myClaims: [myClaim("keys"), myClaim("airpods", { claimedAt: at(-10), collectedAt: at(-9) })],
    mine: [
      myReport("my-calculator", { expiresAt: at(2) }),
      myReport("my-scarf", { expiresAt: at(9) }),
      myReport("my-gloves", { expiresAt: at(-1) }),
      myReport("my-bottle", { status: "RESOLVED", filedAt: at(-5) }),
      myReport("my-hat", { status: "WITHDRAWN", filedAt: at(-3) }),
      myReport("my-found-mug", { kind: "FOUND", status: "RESOLVED", claimedBy: "sam", collectedAt: at(-4), filedAt: at(-6), thankedAt: at(-4), thanksNote: "thanks!" }),
    ],
    notifications: [notice("flask"), notice("my-umbrella")],
  };
}

const reports = (rows: { report: string }[]) => rows.map((row) => row.report);

describe("Sections", () => {
  test("Found, Lost and Map show the open items, with their kind and who reported them", () => {
    const lists = tamarsLists();
    const found = rowsFor("found", lists, "tamar", NOW);
    expect(reports(found)).toEqual(["flask", "charger", "my-umbrella"]);
    expect(found[0]).toMatchObject({ kind: "found", state: "open", person: "tom", group: null, source: { type: "card" } });
    expect(rowsFor("lost", lists, "tamar", NOW).every((row) => row.kind === "lost")).toBe(true);
    expect(reports(rowsFor("map", lists, "tamar", NOW))).toEqual(["flask", "charger", "my-umbrella", "my-calculator", "jacket"]);
  });

  test("Waiting on you has pickups, then matches on someone else's item, then my reports with 3 days or fewer left", () => {
    const waiting = rowsFor("waiting", tamarsLists(), "tamar", NOW);
    expect(waiting.map((row) => [row.group, row.report])).toEqual([
      ["To pick up", "keys"],
      ["Possible matches", "flask"],
      ["Expiring soon", "my-calculator"],
    ]);
    // A notice about my own found item, a picked-up claim, a report with 9 days left, and an expired one stay out.
    expect(reports(waiting)).not.toContain("my-umbrella");
    expect(reports(waiting)).not.toContain("airpods");
    expect(reports(waiting)).not.toContain("my-scarf");
    expect(reports(waiting)).not.toContain("my-gloves");
  });

  test("Your reports groups my open reports into Open and Expired, and leaves closed ones for History", () => {
    const rows = rowsFor("reports", tamarsLists(), "tamar", NOW);
    expect(rows.map((row) => [row.group, row.report, row.state])).toEqual([
      ["Open", "my-calculator", "open"],
      ["Open", "my-scarf", "open"],
      ["Expired", "my-gloves", "expired"],
    ]);
  });

  test("Your claims shows only claims not yet picked up, naming the finder", () => {
    const rows = rowsFor("claims", tamarsLists(), "tamar", NOW);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ report: "keys", state: "claimed", person: "tom", spot: "by the bench", source: { type: "claim" } });
  });

  test("History has picked-up claims and closed reports, newest first, each with what happened", () => {
    const rows = rowsFor("history", tamarsLists(), "tamar", NOW);
    expect(rows.map((row): string[] => [row.report, row.state])).toEqual([
      ["my-hat", "removed"],
      ["my-found-mug", "picked-up"],
      ["my-bottle", "closed"],
      ["airpods", "picked-up"],
    ]);
  });

  test("Returned never names who claimed an item", () => {
    const rows = rowsFor("returned", tamarsLists(), "tamar", NOW);
    expect(reports(rows)).toEqual(["backpack", "flask-old"]);
    expect(rows.every((row) => row.person === null && row.state === "claimed")).toBe(true);
  });

  test("100 claims, 98 of them picked up: Your claims and Waiting on you show 2, History holds the 98", () => {
    const lists = tamarsLists();
    lists.myClaims = Array.from({ length: 100 }, (_, i) => myClaim(`claim-${i}`, i < 98 ? { collectedAt: at(-1 - i) } : {}));
    expect(countFor("claims", lists, "tamar", NOW)).toBe(2);
    expect(rowsFor("waiting", lists, "tamar", NOW).filter((row) => row.group === "To pick up")).toHaveLength(2);
    expect(rowsFor("history", lists, "tamar", NOW).filter((row) => row.source.type === "claim")).toHaveLength(98);
  });

  test("every section but the map has a count for the sidebar", () => {
    const lists = tamarsLists();
    expect(countFor("map", lists, "tamar", NOW)).toBeNull();
    expect(countFor("found", lists, "tamar", NOW)).toBe(3);
    expect(countFor("waiting", lists, "tamar", NOW)).toBe(3);
    expect(countFor("history", lists, "tamar", NOW)).toBe(4);
  });

  test("a notice opens the section its report lives in now, or none", () => {
    const lists = tamarsLists();
    expect(sectionOf("flask" as never, lists, "tamar", NOW)).toBe("found");
    expect(sectionOf("jacket" as never, lists, "tamar", NOW)).toBe("lost");
    expect(sectionOf("keys" as never, lists, "tamar", NOW)).toBe("waiting");
    expect(sectionOf("my-gloves" as never, lists, "tamar", NOW)).toBe("reports");
    expect(sectionOf("my-found-mug" as never, lists, "tamar", NOW)).toBe("history");
    expect(sectionOf("backpack" as never, lists, "tamar", NOW)).toBe("returned");
    expect(sectionOf("nothing" as never, lists, "tamar", NOW)).toBeNull();
  });

  test("while searching, matches elsewhere lists the other sections with matches, never the map or the current one", () => {
    const lists = tamarsLists();
    // Every sample report is in Building 2, so "building 2" matches in every section that has rows.
    const elsewhere = matchesElsewhere(lists, "tamar", "building 2", "found");
    expect(elsewhere.map((entry) => entry.id)).toEqual(["lost", "returned", "waiting", "reports", "claims", "history"]);
    expect(elsewhere.find((entry) => entry.id === "history")).toEqual({ id: "history", label: "History", count: 4 });
    expect(matchesElsewhere(lists, "tamar", "jacket", "found")).toEqual([{ id: "lost", label: "Lost", count: 1 }]);
    expect(matchesElsewhere(lists, "tamar", "", "found")).toEqual([]);
    expect(matchesElsewhere(lists, "tamar", "umbrella-that-is-nowhere", "found")).toEqual([]);
  });
});
