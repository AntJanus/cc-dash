/**
 * Portfolio-level metrics computed from project cards and activity events.
 *
 * Pure functions — no file I/O. Accept pre-fetched data so tests
 * don't need to mock the filesystem.
 */

import type { ProjectCardData } from "@/lib/projects/get-projects";
import type { ActivityEvent } from "@/lib/activity/types";

/** Counts of projects by derived status. */
export interface StatusDistribution {
  active: number;
  stalled: number;
  complete: number;
  inactive: number;
}

/** Counts of roadmap items across all projects by status bucket. */
export interface ItemStatusCounts {
  done: number;
  inProgress: number;
  planned: number;
  total: number;
}

/** A single week bucket for velocity tracking. */
export interface VelocityBucket {
  /** ISO date string for the Monday of this week */
  weekStart: string;
  /** Human-readable label like "Mar 10 – Mar 16" */
  label: string;
  /** Number of items completed this week */
  count: number;
}

/** Progress distribution bucket. */
export interface ProgressBucket {
  /** Label like "0–25%" */
  label: string;
  /** Lower bound (inclusive) */
  min: number;
  /** Upper bound (exclusive, except 100 which is inclusive) */
  max: number;
  /** Number of projects in this bucket */
  count: number;
  /** Project slugs in this bucket */
  projects: string[];
}

/** A stale project entry with days-since-update. */
export interface StaleProject {
  slug: string;
  name: string;
  lastUpdated: string | null;
  daysSinceUpdate: number;
  status: ProjectCardData["status"];
}

/** A project ranked by recent activity. */
export interface ActiveProject {
  slug: string;
  name: string;
  recentCompletions: number;
  lastActivity: string;
}

/** Full portfolio metrics bundle. */
export interface PortfolioMetrics {
  statusDistribution: StatusDistribution;
  itemCounts: ItemStatusCounts;
  velocity: VelocityBucket[];
  progressDistribution: ProgressBucket[];
  staleProjects: StaleProject[];
  mostActive: ActiveProject[];
  overallCompletion: number;
  totalProjects: number;
}

/** Count projects by derived status. */
export function computeStatusDistribution(
  projects: ProjectCardData[],
): StatusDistribution {
  const dist: StatusDistribution = {
    active: 0,
    stalled: 0,
    complete: 0,
    inactive: 0,
  };
  for (const p of projects) {
    dist[p.status]++;
  }
  return dist;
}

/**
 * Aggregate roadmap item counts across all projects.
 * Needs the raw roadmap data, so we compute from done/total counts.
 */
export function computeItemCounts(
  projects: ProjectCardData[],
): ItemStatusCounts {
  let done = 0;
  let total = 0;
  for (const p of projects) {
    done += p.doneCount;
    total += p.totalCount;
  }
  // We don't have per-item status breakdown from ProjectCardData,
  // so inProgress is estimated as total - done - planned, but we
  // only have done and total. Report done vs remaining.
  return { done, inProgress: 0, planned: total - done, total };
}

/**
 * Compute items completed per week from activity events.
 * Returns the last `weekCount` weeks, most recent first.
 */
export function computeVelocity(
  events: ActivityEvent[],
  weekCount = 8,
  now = new Date(),
): VelocityBucket[] {
  const completions = events.filter(
    (e) =>
      e.type === "roadmap_item_completed" ||
      e.type === "session_work_completed",
  );

  const buckets: VelocityBucket[] = [];

  for (let i = 0; i < weekCount; i++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    // Set to end of day
    weekEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const count = completions.filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= weekStart.getTime() && t <= weekEnd.getTime();
    }).length;

    buckets.push({
      weekStart: weekStart.toISOString().slice(0, 10),
      label: formatWeekLabel(weekStart, weekEnd),
      count,
    });
  }

  // Return oldest-first for chart display (left-to-right timeline)
  return buckets.reverse();
}

function formatWeekLabel(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

/** Distribute projects into progress percentage buckets. */
export function computeProgressDistribution(
  projects: ProjectCardData[],
): ProgressBucket[] {
  const bucketDefs = [
    { label: "0–25%", min: 0, max: 25 },
    { label: "25–50%", min: 25, max: 50 },
    { label: "50–75%", min: 50, max: 75 },
    { label: "75–99%", min: 75, max: 100 },
    { label: "100%", min: 100, max: 101 },
  ];

  const buckets: ProgressBucket[] = bucketDefs.map((d) => ({
    ...d,
    count: 0,
    projects: [],
  }));

  for (const p of projects) {
    const pct = p.totalCount > 0 ? (p.doneCount / p.totalCount) * 100 : 0;

    // 100% goes to the "100%" bucket
    if (pct >= 100) {
      buckets[4].count++;
      buckets[4].projects.push(p.slug);
    } else if (pct >= 75) {
      buckets[3].count++;
      buckets[3].projects.push(p.slug);
    } else if (pct >= 50) {
      buckets[2].count++;
      buckets[2].projects.push(p.slug);
    } else if (pct >= 25) {
      buckets[1].count++;
      buckets[1].projects.push(p.slug);
    } else {
      buckets[0].count++;
      buckets[0].projects.push(p.slug);
    }
  }

  return buckets;
}

/**
 * Find projects that haven't been updated recently.
 * Sorted by staleness (most stale first).
 */
export function computeStaleProjects(
  projects: ProjectCardData[],
  thresholdDays = 7,
  now = new Date(),
): StaleProject[] {
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;

  return projects
    .map((p) => {
      const daysSinceUpdate = p.lastUpdated
        ? Math.floor(
            (now.getTime() - new Date(p.lastUpdated).getTime()) /
              (24 * 60 * 60 * 1000),
          )
        : Infinity;
      return {
        slug: p.slug,
        name: p.name,
        lastUpdated: p.lastUpdated,
        daysSinceUpdate: daysSinceUpdate === Infinity ? -1 : daysSinceUpdate,
        status: p.status,
      };
    })
    .filter((p) => {
      if (!p.lastUpdated) return true;
      return now.getTime() - new Date(p.lastUpdated).getTime() > thresholdMs;
    })
    .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);
}

/**
 * Rank projects by number of recent completions.
 * Returns top N projects sorted by completion count.
 */
export function computeMostActive(
  events: ActivityEvent[],
  limit = 5,
): ActiveProject[] {
  const completions = events.filter(
    (e) =>
      e.type === "roadmap_item_completed" ||
      e.type === "session_work_completed",
  );

  const byProject = new Map<
    string,
    { name: string; count: number; lastActivity: string }
  >();

  for (const e of completions) {
    const existing = byProject.get(e.projectSlug);
    if (existing) {
      existing.count++;
      if (e.timestamp > existing.lastActivity) {
        existing.lastActivity = e.timestamp;
      }
    } else {
      byProject.set(e.projectSlug, {
        name: e.projectName,
        count: 1,
        lastActivity: e.timestamp,
      });
    }
  }

  return Array.from(byProject.entries())
    .map(([slug, data]) => ({
      slug,
      name: data.name,
      recentCompletions: data.count,
      lastActivity: data.lastActivity,
    }))
    .sort((a, b) => b.recentCompletions - a.recentCompletions)
    .slice(0, limit);
}

/** Compute all portfolio metrics from pre-fetched data. */
export function computePortfolioMetrics(
  projects: ProjectCardData[],
  events: ActivityEvent[],
  now = new Date(),
): PortfolioMetrics {
  const totalDone = projects.reduce((sum, p) => sum + p.doneCount, 0);
  const totalItems = projects.reduce((sum, p) => sum + p.totalCount, 0);

  return {
    statusDistribution: computeStatusDistribution(projects),
    itemCounts: computeItemCounts(projects),
    velocity: computeVelocity(events, 8, now),
    progressDistribution: computeProgressDistribution(projects),
    staleProjects: computeStaleProjects(projects, 7, now),
    mostActive: computeMostActive(events),
    overallCompletion:
      totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0,
    totalProjects: projects.length,
  };
}
