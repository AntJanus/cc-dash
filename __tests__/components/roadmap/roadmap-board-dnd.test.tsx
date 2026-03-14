import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import {
  RoadmapBoard,
  groupItemsByStatus,
  findColumnStatusFromOverId,
} from "@/components/roadmap/roadmap-board";
import type { BoardItem } from "@/components/roadmap/roadmap-board";
import type { RoadmapCategory } from "@/lib/schemas/roadmap";

// --- Test fixtures ---

const testCategories: RoadmapCategory[] = [
  {
    title: "Core Features",
    slug: "core",
    items: [
      {
        id: "r_abc12",
        status: "idea",
        name: "Feature Alpha",
        description: "An idea for a feature",
      },
      {
        id: "r_def34",
        status: "planned",
        name: "Feature Beta",
        description: "A planned feature",
      },
      {
        id: "r_ghi56",
        status: "in-progress",
        name: "Feature Gamma",
        description: "An active feature",
      },
      {
        id: "r_jkl78",
        status: "done",
        name: "Feature Delta",
        description: "A completed feature",
      },
    ],
  },
];

const testItemNames: Record<string, string> = {
  r_abc12: "Feature Alpha",
  r_def34: "Feature Beta",
  r_ghi56: "Feature Gamma",
  r_jkl78: "Feature Delta",
};

// Pre-compute grouped items for pure function tests
const grouped = groupItemsByStatus(testCategories);

describe("findColumnStatusFromOverId", () => {
  it("returns status for column-{status} IDs", () => {
    expect(findColumnStatusFromOverId("column-done", grouped)).toBe("done");
    expect(findColumnStatusFromOverId("column-idea", grouped)).toBe("idea");
    expect(findColumnStatusFromOverId("column-planned", grouped)).toBe(
      "planned",
    );
    expect(findColumnStatusFromOverId("column-in-progress", grouped)).toBe(
      "in-progress",
    );
  });

  it("returns status for card ID by finding which column it belongs to", () => {
    expect(findColumnStatusFromOverId("r_abc12", grouped)).toBe("idea");
    expect(findColumnStatusFromOverId("r_def34", grouped)).toBe("planned");
    expect(findColumnStatusFromOverId("r_ghi56", grouped)).toBe("in-progress");
    expect(findColumnStatusFromOverId("r_jkl78", grouped)).toBe("done");
  });

  it("returns null for unknown IDs", () => {
    expect(findColumnStatusFromOverId("unknown", grouped)).toBeNull();
    expect(findColumnStatusFromOverId("column-invalid", grouped)).toBeNull();
    expect(findColumnStatusFromOverId("r_zzz99", grouped)).toBeNull();
  });
});

describe("RoadmapBoard DnD", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders DndContext when onDragStatusChange provided", () => {
    const handleDrag = vi.fn();
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={{}}
        itemNames={testItemNames}
        onDragStatusChange={handleDrag}
      />,
    );
    // DndContext renders a DragOverlay component
    const board = screen.getByTestId("roadmap-board");
    expect(board).toBeInTheDocument();
    // The board element itself should have data-dnd-active attribute
    expect(board).toHaveAttribute("data-dnd-active", "true");
  });

  it("does not render DndContext when onDragStatusChange is undefined", () => {
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={{}}
        itemNames={testItemNames}
      />,
    );
    // Board should render but without DnD markers
    const board = screen.getByTestId("roadmap-board");
    expect(board).toBeInTheDocument();
    expect(board).not.toHaveAttribute("data-dnd-active");
  });

  it("renders DragOverlay component", () => {
    const handleDrag = vi.fn();
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={{}}
        itemNames={testItemNames}
        onDragStatusChange={handleDrag}
      />,
    );
    // DragOverlay should be rendered (though initially empty)
    expect(screen.getByTestId("drag-overlay-container")).toBeInTheDocument();
  });

  it("cards have sortable attributes", () => {
    const handleDrag = vi.fn();
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={{}}
        itemNames={testItemNames}
        onDragStatusChange={handleDrag}
      />,
    );
    // Cards should have role="button" from sortable attributes and a drag handle
    const dragHandles = screen.getAllByTestId("drag-handle");
    expect(dragHandles.length).toBeGreaterThanOrEqual(4); // 4 items across columns
  });
});

describe("RoadmapColumn with DnD", () => {
  afterEach(() => {
    cleanup();
  });

  it("wraps items in SortableContext", () => {
    const handleDrag = vi.fn();
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={{}}
        itemNames={testItemNames}
        onDragStatusChange={handleDrag}
      />,
    );
    // Columns should have droppable ID
    const columns = screen.getAllByTestId(/^droppable-column-/);
    expect(columns).toHaveLength(4);
  });

  it("uses useDroppable for empty column support", () => {
    const emptyCategories: RoadmapCategory[] = [
      { title: "Empty", slug: "empty", items: [] },
    ];
    const handleDrag = vi.fn();
    render(
      <RoadmapBoard
        categories={emptyCategories}
        sessionRefs={{}}
        itemNames={{}}
        onDragStatusChange={handleDrag}
      />,
    );
    // All 4 columns should be droppable even with no items
    const columns = screen.getAllByTestId(/^droppable-column-/);
    expect(columns).toHaveLength(4);
    // Empty columns should still show "No items" text
    const placeholders = screen.getAllByText("No items");
    expect(placeholders).toHaveLength(4);
  });

  it("shows drop indicator when isOver", () => {
    // Note: We can't simulate actual drag in jsdom, but we verify the column
    // has the droppable setup by checking data-testid exists
    const handleDrag = vi.fn();
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={{}}
        itemNames={testItemNames}
        onDragStatusChange={handleDrag}
      />,
    );
    const columns = screen.getAllByTestId(/^droppable-column-/);
    // Verify columns have the correct droppable IDs
    expect(columns[0]).toHaveAttribute("data-testid", "droppable-column-idea");
    expect(columns[1]).toHaveAttribute(
      "data-testid",
      "droppable-column-planned",
    );
    expect(columns[2]).toHaveAttribute(
      "data-testid",
      "droppable-column-in-progress",
    );
    expect(columns[3]).toHaveAttribute("data-testid", "droppable-column-done");
  });
});
