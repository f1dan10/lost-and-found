import { describe, expect, test } from "bun:test";
import { marks, matches, normalize, search, terms } from "../../frontend/src/lostfound/search.ts";
import type { Row } from "../../frontend/src/lostfound/sections.ts";

/** A row as a section would give it; only the fields the search reads matter. */
const row = (description: string, fields: Partial<Row> = {}): Row =>
  ({
    key: description,
    report: description,
    kind: "found",
    state: "open",
    category: "BOTTLE",
    description,
    places: [{ place: "b2", name: "Building 2" }],
    spot: null,
    photo: null,
    person: "tom",
    time: "2026-10-20T12:00:00.000Z",
    group: null,
    source: { type: "card", card: {} },
    ...fields,
  }) as unknown as Row;

const flask = row("Pink Hydro Flask with a cat sticker", { spot: "By the lobby bench" });
const airpods = row("White AirPods case, scratched lid", {
  category: "ELECTRONICS",
  places: [{ place: "b32", name: "Building 32 (Stata)" }],
  spot: "R&D Commons",
  person: "sam",
});
const keys = row("MIT ID on a red lanyard", { category: "KEYS_ID", places: [{ place: "b10", name: "Building 10" }], person: null });
const jacket = row("Black North Face jacket", {
  kind: "lost",
  category: "CLOTHING",
  places: [
    { place: "b34", name: "Building 34" },
    { place: "w20", name: "W20 (Student Center)" },
  ],
  person: "sam",
});
const all = [flask, airpods, keys, jacket];
const found = (query: string) => search(all, query).map((match) => match.description);

describe("Search", () => {
  test("an empty or blank query matches everything", () => {
    expect(found("")).toHaveLength(4);
    expect(found("   ")).toHaveLength(4);
  });

  test("it finds words in the description, ignoring case and punctuation", () => {
    expect(found("pink")).toEqual([flask.description]);
    expect(found("AIRPODS")).toEqual([airpods.description]);
    expect(found("lid.")).toEqual([airpods.description]);
  });

  test("every word must match, in any order", () => {
    expect(found("pink flask")).toEqual([flask.description]);
    expect(found("flask pink")).toEqual([flask.description]);
    expect(found("pink jacket")).toEqual([]);
  });

  test("a word matches from its start, so a partial word works but a word inside another doesn't", () => {
    expect(found("stick")).toEqual([flask.description]);
    expect(found("ticker")).toEqual([]);
  });

  test("it finds a building by number or by nickname, and a spot", () => {
    expect(found("32")).toEqual([airpods.description]);
    expect(found("stata")).toEqual([airpods.description]);
    expect(found("student center")).toEqual([jacket.description]);
    expect(found("w20")).toEqual([jacket.description]);
    expect(found("lobby")).toEqual([flask.description]);
    expect(found("r&d")).toEqual([airpods.description]);
  });

  test("it finds a category by its label, and a plural finds the singular", () => {
    expect(found("electronics")).toEqual([airpods.description]);
    expect(found("bottles")).toEqual([flask.description]);
    expect(found("keys")).toEqual([keys.description]);
  });

  test("it finds the person named on a row, and never one the row leaves out", () => {
    expect(found("sam")).toEqual([airpods.description, jacket.description]);
    expect(found("tom")).toEqual([flask.description]);
  });

  test("a word that appears nowhere matches nothing", () => {
    expect(found("umbrella")).toEqual([]);
    expect(matches(flask, "umbrella")).toBe(false);
  });

  test("queries are reduced to comparable words", () => {
    expect(normalize("  Café — Building 32 (Stata)! ")).toBe("cafe building 32 stata");
    expect(terms("Pink  BOTTLES, keys")).toEqual(["pink", "bottle", "key"]);
  });

  test("marks cut text into matched and unmatched parts, matching from the start of words", () => {
    expect(marks("Pink Hydro Flask", "pink flask")).toEqual([
      { text: "Pink", match: true },
      { text: " Hydro ", match: false },
      { text: "Flask", match: true },
    ]);
    expect(marks("Building 32 (Stata)", "stat")).toEqual([
      { text: "Building 32 (", match: false },
      { text: "Stat", match: true },
      { text: "a)", match: false },
    ]);
    expect(marks("Pink Hydro Flask", "")).toEqual([{ text: "Pink Hydro Flask", match: false }]);
    expect(marks("Pink Hydro Flask", "ink")).toEqual([{ text: "Pink Hydro Flask", match: false }]);
  });

  test("a query with regular-expression characters is treated as plain text", () => {
    expect(() => marks("R&D Commons (2nd floor)", "(2nd")).not.toThrow();
    expect(found("(2nd")).toEqual([]);
  });
});
