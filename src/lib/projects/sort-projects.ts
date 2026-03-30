/**
 * Sort utilities for the project dashboard home page.
 *
 * Provides a pure sortProjects function that handles all sort fields and
 * directions. Used by ProjectHome to apply client-side sorting after filtering.
 */

import type { ProjectCardData } from "./get-projects";

export type SortField = "name" | "progress" | "last_updated" | "status";
export type SortDirection = "asc" | "desc";

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

/** Status priority for sort: active > stalled > complete > inactive */
const STATUS_ORDER: Record<string, number> = {
  active: 0,
  stalled: 1,
  complete: 2,
  inactive: 3,
};

/**
 * Sort a projects array by the given field and direction.
 * Returns a new array — does not mutate the input.
 */
export function sortProjects(
  projects: ProjectCardData[],
  sort: SortState,
): ProjectCardData[] {
  const sorted = [...projects];

  sorted.sort((a, b) => {
    let cmp = 0;

    switch (sort.field) {
      case "name":
        cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        break;

      case "progress": {
        const aPercent = a.totalCount > 0 ? a.doneCount / a.totalCount : 0;
        const bPercent = b.totalCount > 0 ? b.doneCount / b.totalCount : 0;
        cmp = aPercent - bPercent;
        break;
      }

      case "last_updated": {
        // Null lastUpdated always sorts last regardless of direction
        if (!a.lastUpdated && !b.lastUpdated) {
          cmp = 0;
        } else if (!a.lastUpdated) {
          return 1;
        } else if (!b.lastUpdated) {
          return -1;
        } else {
          cmp =
            new Date(a.lastUpdated).getTime() -
            new Date(b.lastUpdated).getTime();
        }
        break;
      }

      case "status": {
        const aOrder = STATUS_ORDER[a.status] ?? 99;
        const bOrder = STATUS_ORDER[b.status] ?? 99;
        cmp = aOrder - bOrder;
        break;
      }
    }

    return sort.direction === "asc" ? cmp : -cmp;
  });

  return sorted;
}
