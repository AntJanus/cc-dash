import type { RoadmapCategory, RoadmapItem } from "@/lib/schemas/roadmap";
import { RoadmapColumn } from "./roadmap-column";

/** A roadmap item annotated with its parent category info for display */
export interface BoardItem extends RoadmapItem {
  categorySlug: string;
  categoryTitle: string;
}

/** Column definitions for the Kanban board, in display order */
export const BOARD_COLUMNS = [
  { status: "idea", label: "Ideas" },
  { status: "planned", label: "Planned" },
  { status: "in-progress", label: "Active" },
  { status: "done", label: "Done" },
] as const;

/**
 * Flattens all items from all categories, annotates each with its parent
 * category info, and groups them into a Record keyed by status.
 * All 4 status keys are always present (empty arrays for missing).
 */
export function groupItemsByStatus(
  categories: RoadmapCategory[],
): Record<string, BoardItem[]> {
  const grouped: Record<string, BoardItem[]> = {
    idea: [],
    planned: [],
    "in-progress": [],
    done: [],
  };

  for (const category of categories) {
    for (const item of category.items) {
      const boardItem: BoardItem = {
        ...item,
        categorySlug: category.slug,
        categoryTitle: category.title,
      };
      const bucket = grouped[item.status];
      if (bucket) {
        bucket.push(boardItem);
      }
    }
  }

  return grouped;
}

interface RoadmapBoardProps {
  categories: RoadmapCategory[];
  sessionRefs: Record<string, string>;
  itemNames: Record<string, string>;
  onUpdateItem?: (
    itemId: string,
    updates: {
      name?: string;
      description?: string;
      status?: string;
      categorySlug?: string;
    },
  ) => void;
  onDeleteItem?: (itemId: string) => void;
  onAddItem?: (
    categorySlug: string,
    input: { name: string; description: string; status: string },
  ) => void;
}

/**
 * Kanban board view for roadmap items.
 * Renders 4 status columns: Ideas, Planned, Active, Done.
 */
export function RoadmapBoard({
  categories,
  sessionRefs,
  itemNames,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
}: RoadmapBoardProps) {
  const grouped = groupItemsByStatus(categories);

  return (
    <div data-testid="roadmap-board" className="grid grid-cols-4 gap-4">
      {BOARD_COLUMNS.map((col) => (
        <RoadmapColumn
          key={col.status}
          label={col.label}
          status={col.status}
          items={grouped[col.status] ?? []}
          sessionRefs={sessionRefs}
          itemNames={itemNames}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onAddItem={onAddItem}
        />
      ))}
    </div>
  );
}
