const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days until a report expires, rounded up; 0 or less once it has expired. */
export function daysLeft(expiresAt: string, now: number = Date.now()): number {
  return Math.ceil((new Date(expiresAt).getTime() - now) / DAY_MS);
}

/** "Expires in 3 days", "Expires today", or "Expired", for the owner's card. */
export function expiryLabel(expiresAt: string, now: number = Date.now()): string {
  const days = daysLeft(expiresAt, now);
  if (days <= 0) return "Expired";
  if (days === 1) return "Expires within a day";
  return `Expires in ${days} days`;
}
