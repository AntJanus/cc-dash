import type { RoadmapCategory } from "@/lib/schemas/roadmap";

export interface RoadmapBoardProps {
  categories: RoadmapCategory[];
  sessionRefs: Record<string, string>;
  itemNames: Record<string, string>;
}

/** Placeholder -- will be implemented in Plan 02 */
export function RoadmapBoard({
  categories,
  sessionRefs,
  itemNames,
}: RoadmapBoardProps) {
  return <div data-testid="roadmap-board">Board view coming soon</div>;
}
