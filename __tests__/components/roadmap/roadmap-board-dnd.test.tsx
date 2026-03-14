import { describe, it } from "vitest";

describe("RoadmapBoard DnD", () => {
  it.todo("renders DndContext when onDragStatusChange provided");
  it.todo("does not render DndContext when onDragStatusChange is undefined");
  it.todo("renders DragOverlay component");
  it.todo("cards have drag handles or sortable attributes");
});

describe("findColumnStatusFromOverId", () => {
  it.todo("returns status for column-{status} IDs");
  it.todo("returns status for card ID by finding which column it belongs to");
  it.todo("returns null for unknown IDs");
});

describe("RoadmapColumn with DnD", () => {
  it.todo("wraps items in SortableContext");
  it.todo("uses useDroppable for empty column support");
  it.todo("shows drop indicator when isOver");
});
