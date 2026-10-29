import { daysLeft } from "./expiry.ts";
import { timeAgo } from "./format.ts";
import type { Row } from "./sections.ts";

/** The icon names a tag can use. */
export type TagIcon = "pin" | "search" | "clock" | "check" | "close";

/** What state the item is in, in words, with the matching colour. Colour is never the only cue. */
export function tagOf({ state, kind }: Row): { text: string; tone: string; icon: TagIcon } {
  switch (state) {
    case "open":
      return kind === "found" ? { text: "Found", tone: "found", icon: "pin" } : { text: "Lost", tone: "lost", icon: "search" };
    case "expired":
      return { text: "Expired", tone: "muted", icon: "clock" };
    case "claimed":
      return { text: "Claimed", tone: "claimed", icon: "check" };
    case "picked-up":
      return { text: "Picked up", tone: "claimed", icon: "check" };
    case "closed":
      return { text: kind === "lost" ? "Got it back" : "Closed", tone: "muted", icon: "check" };
    case "removed":
      return { text: "Removed", tone: "muted", icon: "close" };
  }
}

/** The time phrase that fits the section the row is in. */
export function whenOf({ source, time }: Row): string {
  if (source.type === "claim") return source.claim.collectedAt ? `picked up ${timeAgo(time)}` : `claimed ${timeAgo(time)}`;
  if (source.type === "returned") return `claimed ${timeAgo(time)}`;
  return timeAgo(time);
}

/** For my open reports, how long they stay up; null for everything else. */
export function expiryOf({ source, state }: Row): string | null {
  if (source.type !== "mine" || state !== "open") return null;
  const left = daysLeft(source.report.expiresAt);
  return left <= 1 ? "Expires today" : `${left} days left`;
}

/** Who the item is from, or null when that is me or unknown. */
export function personOf({ source, person }: Row): string | null {
  if (person === null) return null;
  return source.type === "claim" ? `found by ${person}` : person;
}
