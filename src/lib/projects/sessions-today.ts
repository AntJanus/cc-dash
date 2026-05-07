/**
 * Helpers for surfacing sessions touched on the current calendar date.
 *
 * Used by the /today page (empty-state fallback) and the
 * Today's Directions prompt-assembly action so both share the same
 * "is today" semantics.
 */

import type { ProjectCardData } from "@/lib/projects/get-projects";

function isSameLocalDay(timestamp: string, now: Date): boolean {
  const then = new Date(timestamp);
  return (
    then.getFullYear() === now.getFullYear() &&
    then.getMonth() === now.getMonth() &&
    then.getDate() === now.getDate()
  );
}

/**
 * Filter to projects with an active session whose lastUpdated falls on
 * `now`'s local calendar date. Local-tz boundaries are intentional —
 * "today" means the user's day, not a UTC slice.
 */
export function pickSessionsTouchedToday(
  projects: ProjectCardData[],
  now: Date,
): ProjectCardData[] {
  return projects.filter(
    (project) =>
      project.hasActiveSession &&
      project.lastUpdated !== null &&
      isSameLocalDay(project.lastUpdated, now),
  );
}
