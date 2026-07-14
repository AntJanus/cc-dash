/**
 * Seasonal state computation for the almanac views.
 *
 * Classifies a project into one of four seasons from data the dashboard
 * already has — no schema changes. Deliberate signals (a finished roadmap,
 * a shelved portfolio entry) outrank incidental file mtime, so a completed
 * project stays "harvested" even if something touched it yesterday.
 */

import type { ProjectStatus } from "@/lib/schemas/portfolio";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Touched within this many days — matches the dashboard's stale threshold. */
export const HOT_DAYS = 7;

/**
 * Touched within this many days. Deliberately wider than the recommendation
 * engine's 14-day warm window: the almanac's "Coming Up" page wants a month of
 * runway, so a project idle for three weeks is still due round again rather
 * than dormant. Set by .planning/v3.0-almanac/PLAN.md Phase 0.
 */
export const WARM_DAYS = 30;

/** Completion at or above this percent means the roadmap is fully harvested. */
const HARVEST_PERCENT = 100;

/**
 * Where a project sits in the portfolio's growing year.
 *
 * - **in-season**: worked recently, the crop is standing
 * - **warming-up**: quiet but not cold, due to come round again
 * - **dormant**: shelved, never started, or long untouched
 * - **harvested**: every roadmap item is done
 */
export type SeasonalState =
  | "in-season"
  | "warming-up"
  | "dormant"
  | "harvested";

export interface SeasonalInput {
  /** Most recent activity timestamp (ISO string), or null if never touched. */
  lastActivity: string | null;
  /** Roadmap completion, 0-100. See getCompletionPercent in get-projects. */
  completionPercent: number;
  /** Portfolio status from .cc-dash/portfolio.json. */
  portfolioStatus: ProjectStatus;
}

export interface SeasonalOptions {
  /** Clock override for tests. Defaults to the current time. */
  now?: Date;
}

/**
 * Derive a project's seasonal state.
 *
 * Precedence is completion, then portfolio status, then recency:
 *
 * 1. `completionPercent >= 100` -> `harvested`
 * 2. `portfolioStatus === "inactive"` -> `dormant`
 * 3. no `lastActivity` -> `dormant`
 * 4. touched within {@link HOT_DAYS} -> `in-season`
 * 5. touched within {@link WARM_DAYS} -> `warming-up`
 * 6. otherwise -> `dormant`
 *
 * `active` and `maintenance` projects both band by recency; only `inactive`
 * forces dormancy. A future-dated timestamp reads as in-season.
 */
export function getSeasonalState(
  input: SeasonalInput,
  options: SeasonalOptions = {},
): SeasonalState {
  if (input.completionPercent >= HARVEST_PERCENT) {
    return "harvested";
  }

  if (input.portfolioStatus === "inactive") {
    return "dormant";
  }

  if (input.lastActivity === null) {
    return "dormant";
  }

  const now = options.now ?? new Date();
  const ageDays =
    (now.getTime() - new Date(input.lastActivity).getTime()) / MS_PER_DAY;

  if (ageDays <= HOT_DAYS) {
    return "in-season";
  }

  if (ageDays <= WARM_DAYS) {
    return "warming-up";
  }

  return "dormant";
}
