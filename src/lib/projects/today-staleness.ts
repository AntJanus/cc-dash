/**
 * Staleness check for the directions file's `for_date` against "now".
 *
 * "Stale" means the directions describe a day that has already passed —
 * the user is looking at yesterday's (or older) plan and probably wants
 * to regenerate. A future `for_date` is treated as fresh: the user
 * generated ahead of time and the dashboard should not nag them.
 */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function localIsoDate(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Return true when `forDate` is older than `now`'s local calendar date,
 * or when `forDate` is malformed (better to nag than silently trust).
 */
export function isDirectionsStale(forDate: string, now: Date): boolean {
  if (!ISO_DATE_RE.test(forDate)) return true;
  const today = localIsoDate(now);
  return forDate < today;
}
