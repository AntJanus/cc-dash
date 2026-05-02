/**
 * Heuristic order: roadmap in-progress → roadmap planned → first unchecked
 * session task. "idea"-status roadmap items are skipped (not actionable).
 */

import type { RoadmapFile } from "@/lib/schemas/roadmap";
import type { SessionFile } from "@/lib/schemas/session";

export type NextActionSource =
  | "roadmap-in-progress"
  | "roadmap-planned"
  | "session-task";

export interface NextAction {
  id: string;
  name: string;
  source: NextActionSource;
}

export function getNextAction(
  roadmap: RoadmapFile | null,
  session: SessionFile | null,
): NextAction | null {
  if (roadmap) {
    const items = roadmap.categories.flatMap((c) => c.items);

    const inProgress = items.find((i) => i.status === "in-progress");
    if (inProgress) {
      return {
        id: inProgress.id,
        name: inProgress.name,
        source: "roadmap-in-progress",
      };
    }

    const planned = items.find((i) => i.status === "planned");
    if (planned) {
      return {
        id: planned.id,
        name: planned.name,
        source: "roadmap-planned",
      };
    }
  }

  if (session) {
    const unchecked = session.tasks.find((t) => !t.checked);
    if (unchecked) {
      return {
        id: unchecked.id,
        name: unchecked.description,
        source: "session-task",
      };
    }
  }

  return null;
}
