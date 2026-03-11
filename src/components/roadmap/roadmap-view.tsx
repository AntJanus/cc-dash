"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RoadmapBoard } from "./roadmap-board";
import { RoadmapList } from "./roadmap-list";
import type { RoadmapFile } from "@/lib/schemas/roadmap";

interface RoadmapViewProps {
  roadmap: RoadmapFile;
  sessionRefs: Record<string, string>;
}

/**
 * Client Component that manages the board/list view toggle.
 * Computes a flat itemNames lookup for DependencyBadge tooltips.
 */
export function RoadmapView({ roadmap, sessionRefs }: RoadmapViewProps) {
  // Build flat item ID -> name lookup across all categories
  const itemNames: Record<string, string> = {};
  for (const category of roadmap.categories) {
    for (const item of category.items) {
      itemNames[item.id] = item.name;
    }
  }

  return (
    <Tabs defaultValue="board">
      <TabsList>
        <TabsTrigger value="board">Board</TabsTrigger>
        <TabsTrigger value="list">List</TabsTrigger>
      </TabsList>
      <TabsContent value="board">
        <RoadmapBoard
          categories={roadmap.categories}
          sessionRefs={sessionRefs}
          itemNames={itemNames}
        />
      </TabsContent>
      <TabsContent value="list">
        <RoadmapList
          categories={roadmap.categories}
          sessionRefs={sessionRefs}
          itemNames={itemNames}
        />
      </TabsContent>
    </Tabs>
  );
}
