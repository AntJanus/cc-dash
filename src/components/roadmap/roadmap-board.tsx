"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import type { RoadmapCategory, RoadmapItem } from "@/lib/schemas/roadmap";
import { RoadmapColumn } from "./roadmap-column";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { CategoryBadge } from "@/components/shared/category-badge";

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

/**
 * Resolves a @dnd-kit overId to the status of the target column.
 * - If overId starts with "column-", extracts the status suffix
 * - If overId matches a card ID, finds which column contains that card
 * - Returns null if no match found
 */
export function findColumnStatusFromOverId(
  overId: string | number,
  grouped: Record<string, BoardItem[]>,
): string | null {
  const id = String(overId);

  // Check if it's a column ID (e.g., "column-done" -> "done")
  if (id.startsWith("column-")) {
    const status = id.slice("column-".length);
    // Verify this is a valid status key
    if (status in grouped) {
      return status;
    }
    return null;
  }

  // Search for card ID across all columns
  for (const [status, items] of Object.entries(grouped)) {
    if (items.some((item) => item.id === id)) {
      return status;
    }
  }

  return null;
}

interface RoadmapBoardProps {
  categories: RoadmapCategory[];
  sessionRefs: Record<string, string>;
  itemNames: Record<string, string>;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onDragStatusChange?: (itemId: string, newStatus: string) => void;
  onUpdateItem?: (
    itemId: string,
    updates: {
      name?: string;
      description?: string;
      status?: string;
      categorySlug?: string;
      depends?: string[];
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
 * When onDragStatusChange is provided, wraps in DndContext for drag-and-drop.
 */
export function RoadmapBoard({
  categories,
  sessionRefs,
  itemNames,
  selectedIds,
  onToggleSelect,
  onDragStatusChange,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
}: RoadmapBoardProps) {
  const grouped = groupItemsByStatus(categories);
  const [activeItem, setActiveItem] = useState<BoardItem | null>(null);

  // Build flat list of all items for the dependency picker
  const allItems = useMemo(() => {
    const items: Array<{ id: string; name: string }> = [];
    for (const columnItems of Object.values(grouped)) {
      for (const item of columnItems) {
        items.push({ id: item.id, name: item.name });
      }
    }
    return items;
  }, [grouped]);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  const handleDragStart = useMemo(
    () => (event: DragStartEvent) => {
      const { active } = event;
      // Find the item being dragged across all columns
      for (const items of Object.values(grouped)) {
        const found = items.find((item) => item.id === active.id);
        if (found) {
          setActiveItem(found);
          return;
        }
      }
    },
    [grouped],
  );

  const handleDragEnd = useMemo(
    () => (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveItem(null);

      if (!over || !onDragStatusChange) return;

      const targetStatus = findColumnStatusFromOverId(over.id, grouped);
      if (!targetStatus) return;

      // Find the source status
      const sourceStatus = findColumnStatusFromOverId(active.id, grouped);
      if (sourceStatus && sourceStatus !== targetStatus) {
        onDragStatusChange(String(active.id), targetStatus);
      }
    },
    [grouped, onDragStatusChange],
  );

  const columns = BOARD_COLUMNS.map((col) => (
    <RoadmapColumn
      key={col.status}
      label={col.label}
      status={col.status}
      items={grouped[col.status] ?? []}
      sessionRefs={sessionRefs}
      itemNames={itemNames}
      allItems={allItems}
      selectedIds={selectedIds}
      onToggleSelect={onToggleSelect}
      onUpdateItem={onUpdateItem}
      onDeleteItem={onDeleteItem}
      onAddItem={onAddItem}
      enableDnd={Boolean(onDragStatusChange)}
    />
  ));

  if (onDragStatusChange) {
    return (
      <div data-testid="roadmap-board" data-dnd-active="true">
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {columns}
          </div>
          <div data-testid="drag-overlay-container">
            <DragOverlay>
              {activeItem ? (
                <Card
                  size="sm"
                  className="w-64 rotate-1 opacity-90 shadow-lg shadow-primary/10"
                >
                  <CardHeader>
                    <CardTitle>{activeItem.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {activeItem.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CategoryBadge
                      slug={activeItem.categorySlug}
                      title={activeItem.categoryTitle}
                    />
                  </CardContent>
                </Card>
              ) : null}
            </DragOverlay>
          </div>
        </DndContext>
      </div>
    );
  }

  return (
    <div
      data-testid="roadmap-board"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {columns}
    </div>
  );
}
