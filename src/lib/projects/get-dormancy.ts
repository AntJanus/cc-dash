/**
 * Dormancy computation for the almanac views.
 *
 * A project may declare an intentional pause via `dormant_until` in its
 * portfolio entry (see PortfolioProjectSchema). While that date is still in
 * the future the project is deliberately resting: the dashboard suppresses its
 * stale badge and shows a "Returns in X days" label instead. Once the date has
 * passed the project is due round again and behaves normally.
 *
 * Pure and clock-injectable, matching getSeasonalState's `now` override so the
 * almanac surfaces can compute deterministically. No UI is wired here — that
 * lands with r_al003 and Phase 5.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface Dormancy {
  /** True while `dormant_until` is in the future — suppress the stale badge. */
  isDormant: boolean;
  /**
   * Whole days until the project returns, rounded up so a partial day still
   * reads as a day of waiting. `0` when not dormant.
   */
  daysUntilReturn: number;
}

export interface DormancyOptions {
  /** Clock override for tests. Defaults to the current time. */
  now?: Date;
}

/**
 * Derive whether a project is intentionally dormant and, if so, how many days
 * remain until it returns.
 *
 * A `dormant_until` of `null` (the schema default) is never dormant. The return
 * instant itself counts as elapsed — dormancy is strictly forward-looking.
 */
export function getDormancy(
  dormantUntil: string | null,
  options: DormancyOptions = {},
): Dormancy {
  if (dormantUntil === null) {
    return { isDormant: false, daysUntilReturn: 0 };
  }

  const now = options.now ?? new Date();
  const returnAt = new Date(`${dormantUntil}T00:00:00Z`).getTime();
  const remainingMs = returnAt - now.getTime();

  if (remainingMs <= 0) {
    return { isDormant: false, daysUntilReturn: 0 };
  }

  return {
    isDormant: true,
    daysUntilReturn: Math.ceil(remainingMs / MS_PER_DAY),
  };
}
