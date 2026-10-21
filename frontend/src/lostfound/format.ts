import type { IconName } from "../reusable/ui/Icon.vue";
import { CATEGORIES } from "./categories.ts";

export { CATEGORIES, categoryLabel } from "./categories.ts";

// Every category's icon must be one the Icon component draws.
CATEGORIES satisfies readonly { icon: IconName }[];

/** The icon shown for a report that has no photo. */
export function categoryIcon(category: string): IconName {
  return CATEGORIES.find((entry) => entry.value === category)?.icon ?? "other";
}

/** How long ago something happened, such as "5 min ago", and the date once it is more than a month old. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: sameYear ? undefined : "numeric" });
}
