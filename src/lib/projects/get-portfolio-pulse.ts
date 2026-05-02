import type { ProjectCardData } from "@/lib/projects/get-projects";
import { getCompletionPercent } from "@/lib/projects/get-projects";

export interface PulseLanes {
  upNext: ProjectCardData[];
  nearlyDone: ProjectCardData[];
  recentlyActive: ProjectCardData[];
  stalled: ProjectCardData[];
}

export interface PulseOptions {
  limit?: number;
  now?: Date;
  recentDays?: number;
  staleDays?: number;
  nearlyDonePercent?: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function lastUpdatedMs(p: ProjectCardData): number | null {
  return p.lastUpdated ? new Date(p.lastUpdated).getTime() : null;
}

function byMostRecent(a: ProjectCardData, b: ProjectCardData): number {
  const aMs = lastUpdatedMs(a);
  const bMs = lastUpdatedMs(b);
  if (aMs === null && bMs === null) return 0;
  if (aMs === null) return 1;
  if (bMs === null) return -1;
  return bMs - aMs;
}

export function getPortfolioPulse(
  projects: ProjectCardData[],
  options: PulseOptions = {},
): PulseLanes {
  const {
    limit = 6,
    now = new Date(),
    recentDays = 7,
    staleDays = 14,
    nearlyDonePercent = 80,
  } = options;

  const nowMs = now.getTime();
  const recentThreshold = recentDays * MS_PER_DAY;
  const staleThreshold = staleDays * MS_PER_DAY;

  const upNext = projects
    .filter((p) => p.nextAction !== null)
    .sort(byMostRecent)
    .slice(0, limit);

  const nearlyDone = projects
    .filter((p) => {
      if (p.portfolioStatus === "inactive") return false;
      if (p.totalCount === 0) return false;
      const pct = getCompletionPercent(p);
      return pct >= nearlyDonePercent && pct < 100;
    })
    .sort((a, b) => getCompletionPercent(b) - getCompletionPercent(a))
    .slice(0, limit);

  // Excludes 100%-complete: their last touch was the completion, not ongoing work.
  const recentlyActive = projects
    .filter((p) => {
      const ms = lastUpdatedMs(p);
      if (ms === null) return false;
      if (nowMs - ms > recentThreshold) return false;
      if (p.totalCount > 0 && p.doneCount === p.totalCount) return false;
      return true;
    })
    .sort(byMostRecent)
    .slice(0, limit);

  // null lastUpdated treated as oldest so projects with no activity surface here.
  const stalled = projects
    .filter((p) => {
      if (p.status === "complete") return false;
      if (p.portfolioStatus === "inactive") return false;
      const ms = lastUpdatedMs(p);
      if (ms === null) return true;
      return nowMs - ms >= staleThreshold;
    })
    .sort((a, b) => (lastUpdatedMs(a) ?? 0) - (lastUpdatedMs(b) ?? 0))
    .slice(0, limit);

  return { upNext, nearlyDone, recentlyActive, stalled };
}
