"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { BoardItem } from "./roadmap-board";
import { RoadmapCard } from "./roadmap-card";

interface RoadmapColumnProps {
  label: string;
  status: string;
  items: BoardItem[];
  sessionRefs: Record<string, string>;
  itemNames: Record<string, string>;
  allItems?: Array<{ id: string; name: string }>;
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
  enableDnd?: boolean;
}

/**
 * A single Kanban column rendering a list of roadmap cards.
 * Shows a header with label and count, and a placeholder when empty.
 * When enableDnd is true, uses useDroppable and SortableContext for DnD support.
 */
export function RoadmapColumn({
  label,
  status,
  items,
  sessionRefs,
  itemNames,
  allItems,
  onUpdateItem,
  onDeleteItem,
  enableDnd,
}: RoadmapColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    disabled: !enableDnd,
  });

  const content = (
    <div className={enableDnd ? "min-h-[120px]" : ""}>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No items
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <RoadmapCard
              key={item.id}
              item={item}
              sessionRefs={sessionRefs}
              itemNames={itemNames}
              allItems={allItems}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
              enableDnd={enableDnd}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      data-testid={enableDnd ? `droppable-column-${status}` : undefined}
      className={`flex flex-col gap-3 rounded-xl bg-muted/40 p-4 transition-shadow ${
        isOver ? "ring-2 ring-primary/30" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {items.length}
        </span>
      </div>
      {enableDnd ? (
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {content}
        </SortableContext>
      ) : (
        content
      )}
    </div>
  );
}
