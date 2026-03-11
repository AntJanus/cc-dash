import type { BoardItem } from "./roadmap-board";
import { RoadmapCard } from "./roadmap-card";

interface RoadmapColumnProps {
  label: string;
  items: BoardItem[];
  sessionRefs: Record<string, string>;
  itemNames: Record<string, string>;
}

/**
 * A single Kanban column rendering a list of roadmap cards.
 * Shows a header with label and count, and a placeholder when empty.
 */
export function RoadmapColumn({
  label,
  items,
  sessionRefs,
  itemNames,
}: RoadmapColumnProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {items.length}
        </span>
      </div>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
