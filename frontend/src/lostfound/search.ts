import { categoryLabel } from "./categories.ts";
import { type Row, rowsFor, SECTIONS, type Section } from "./sections.ts";
import type { Lists } from "./types.ts";

/**
 * The search box: one query, matched against what a person would recognize on a row. That is its description, its
 * category, its buildings (number and nickname, so "32" and "stata" both work), its spot, and the person named on it.
 * Every word typed must match the start of a word on the row, so "pink bott" finds "Pink Hydro Flask… Bottle" but
 * "pen" doesn't find "open". The lists are already loaded, so searching happens in the browser as you type.
 */

/** Text in a comparable form: lower case, accents dropped, and anything but letters and digits turned into spaces. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * The words of a query, in comparable form. A trailing "s" on a longer word is dropped, so "bottles" finds "bottle"
 * and "keys" still finds "keys".
 */
export function terms(query: string): string[] {
  return normalize(query)
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => (word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word));
}

/** Everything a row can be found by, in comparable form, with a space at each end so every word has a space before it. */
function searchable(row: Row): string {
  const parts = [row.description, categoryLabel(row.category), ...row.places.map((place) => place.name), row.spot ?? "", row.person ?? ""];
  return ` ${normalize(parts.join(" "))} `;
}

/** Whether a row matches a query. An empty query matches everything. */
export function matches(row: Row, query: string): boolean {
  const words = terms(query);
  if (words.length === 0) return true;
  const text = searchable(row);
  return words.every((word) => text.includes(` ${word}`));
}

/** The rows that match a query, in the order given. */
export function search(rows: Row[], query: string): Row[] {
  return rows.filter((row) => matches(row, query));
}

/**
 * While searching, the other sections that have matches and how many, in sidebar order, for "Also matching" and for a
 * section with no matches. The map is left out, because its items are the same as Found and Lost.
 */
export function matchesElsewhere(lists: Lists, me: string | null, query: string, here: Section): { id: Section; label: string; count: number }[] {
  if (terms(query).length === 0) return [];
  return SECTIONS.filter((entry) => entry.id !== here && entry.id !== "map")
    .map((entry) => ({ id: entry.id, label: entry.label, count: search(rowsFor(entry.id, lists, me), query).length }))
    .filter((entry) => entry.count > 0);
}

/**
 * A piece of text cut into parts, with the parts that match a query word marked, for highlighting the matches on a row.
 * A match starts at the beginning of a word, as in `matches`. With no query, the whole text is one unmarked part.
 */
export function marks(text: string, query: string): { text: string; match: boolean }[] {
  const words = terms(query);
  if (words.length === 0 || text === "") return [{ text, match: false }];
  const pattern = new RegExp(`(?<![a-z0-9])(${words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts: { text: string; match: boolean }[] = [];
  let last = 0;
  for (const found of text.matchAll(pattern)) {
    const start = found.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start), match: false });
    parts.push({ text: found[0], match: true });
    last = start + found[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), match: false });
  return parts.length ? parts : [{ text, match: false }];
}
