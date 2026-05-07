/**
 * Score-and-shuffle recommendation engine for the /today "Up Next" lane.
 *
 * Scoring favours projects that are actionable right now and lightly
 * randomises picks within the top bucket so two consecutive page loads
 * surface a slightly different rotation. Projects already touched today
 * are pushed down because they are already visible elsewhere on the page.
 */

import type { ProjectCardData } from "@/lib/projects/get-projects";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const WARM_DAYS = 14;

export interface ScoreOptions {
  now?: Date;
  warmDays?: number;
}

export interface ProjectScore {
  score: number;
  whyTags: string[];
}

export interface RecommendedPick {
  project: ProjectCardData;
  score: number;
  whyTags: string[];
}

export interface PickOptions extends ScoreOptions {
  /** Number of top-scoring projects to consider before random selection. */
  bucketSize?: number;
  /** Final number of projects to return. */
  limit?: number;
  /** Deterministic random source for tests. Defaults to Math.random. */
  random?: () => number;
}

function isToday(timestamp: string | null, now: Date): boolean {
  if (!timestamp) return false;
  const then = new Date(timestamp);
  return (
    then.getFullYear() === now.getFullYear() &&
    then.getMonth() === now.getMonth() &&
    then.getDate() === now.getDate()
  );
}

function daysSince(timestamp: string | null, now: Date): number | null {
  if (!timestamp) return null;
  return (now.getTime() - new Date(timestamp).getTime()) / MS_PER_DAY;
}

/**
 * Score a single project for "should I work on this today?" intent.
 *
 * Scoring rubric:
 *  - +3 derived status === "active"
 *  - +2 has a nextAction
 *  - +1 portfolioStatus === "active"
 *  - +1 lastUpdated within `warmDays`
 *  - −2 lastUpdated falls on `now`'s calendar date (already in today's signal)
 *  - −3 status === "complete"
 *  - −3 portfolioStatus === "inactive"
 */
export function scoreProject(
  project: ProjectCardData,
  options: ScoreOptions = {},
): ProjectScore {
  const now = options.now ?? new Date();
  const warmDays = options.warmDays ?? WARM_DAYS;

  let score = 0;
  const whyTags: string[] = [];

  if (project.status === "active") {
    score += 3;
    whyTags.push("active");
  }

  if (project.nextAction) {
    score += 2;
    whyTags.push("actionable");
  }

  if (project.portfolioStatus === "active") {
    score += 1;
  }

  const ageDays = daysSince(project.lastUpdated, now);
  if (ageDays !== null && ageDays <= warmDays && ageDays >= 0) {
    score += 1;
    whyTags.push("warm");
  }

  if (isToday(project.lastUpdated, now)) {
    score -= 2;
  }

  if (project.status === "complete") {
    score -= 3;
  }

  if (project.portfolioStatus === "inactive") {
    score -= 3;
  }

  return { score, whyTags };
}

/**
 * Fisher-Yates in-place shuffle using an injected random source.
 * Returns the same array reference for fluent chaining.
 */
function shuffle<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * Pick a small set of recommended projects: score every input, drop
 * negative-score candidates, take the top `bucketSize`, shuffle within
 * that bucket, and return the first `limit`.
 */
export function pickRecommendedProjects(
  projects: ProjectCardData[],
  options: PickOptions = {},
): RecommendedPick[] {
  const {
    bucketSize = 4,
    limit = 2,
    random = Math.random,
    ...scoreOptions
  } = options;

  const scored = projects
    .map((project) => {
      const result = scoreProject(project, scoreOptions);
      return {
        project,
        score: result.score,
        whyTags: result.whyTags,
      } satisfies RecommendedPick;
    })
    .filter((pick) => pick.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return [];

  const bucket = scored.slice(0, bucketSize);
  shuffle(bucket, random);
  return bucket.slice(0, limit);
}
