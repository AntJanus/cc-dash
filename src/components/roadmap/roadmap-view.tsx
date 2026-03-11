"use client";

import type { RoadmapFile } from "@/lib/schemas/roadmap";

interface RoadmapViewProps {
  roadmap: RoadmapFile;
  sessionRefs: Record<string, string>;
}

/** Placeholder -- will be implemented in Task 2 */
export function RoadmapView({ roadmap, sessionRefs }: RoadmapViewProps) {
  return <div data-testid="roadmap-view">Roadmap View</div>;
}
