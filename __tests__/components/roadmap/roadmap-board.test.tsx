import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import {
  RoadmapBoard,
  groupItemsByStatus,
  BOARD_COLUMNS,
  findColumnStatusFromOverId,
} from "@/components/roadmap/roadmap-board";
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
        started: "2026-02-01",
        depends: ["r_abc12"],
      },
      {
        id: "r_ghi56",
        status: "in-progress",
        name: "Feature Gamma",
        description: "An active feature",
        started: "2026-03-01",
      },
      {
        id: "r_jkl78",
        status: "done",
        name: "Feature Delta",
        description: "A completed feature",
        started: "2026-01-15",
        completed: "2026-02-28",
      },
    ],
  },
  {
    title: "Extra Features",
    slug: "extra",
    items: [
      {
        id: "r_mno90",
        status: "planned",
        name: "Feature Epsilon",
        description: "Another planned feature",
        depends: ["r_def34", "r_jkl78"],
      },
    ],
  },
];

const testItemNames: Record<string, string> = {
  r_abc12: "Feature Alpha",
  r_def34: "Feature Beta",
  r_ghi56: "Feature Gamma",
  r_jkl78: "Feature Delta",
  r_mno90: "Feature Epsilon",
};

const testSessionRefs: Record<string, string> = {
  r_jkl78: "/project/my-project/session?highlight=r_jkl78",
};

// Empty categories for testing empty columns
const emptyCoreOnly: RoadmapCategory[] = [
  {
    title: "Core Features",
    slug: "core",
    items: [
      {
        id: "r_abc12",
        status: "idea",
        name: "Solo Idea",
        description: "The only item, in Ideas column",
      },
    ],
  },
];

describe("groupItemsByStatus", () => {
  it("flattens items from all categories and groups by status", () => {
    const grouped = groupItemsByStatus(testCategories);
    expect(grouped["idea"]).toHaveLength(1);
    expect(grouped["planned"]).toHaveLength(2); // Beta + Epsilon
    expect(grouped["in-progress"]).toHaveLength(1);
    expect(grouped["done"]).toHaveLength(1);
  });

  it("includes all 4 status keys even when empty", () => {
    const grouped = groupItemsByStatus(emptyCoreOnly);
    expect(grouped["idea"]).toHaveLength(1);
    expect(grouped["planned"]).toHaveLength(0);
    expect(grouped["in-progress"]).toHaveLength(0);
    expect(grouped["done"]).toHaveLength(0);
  });

  it("annotates each item with categorySlug and categoryTitle", () => {
    const grouped = groupItemsByStatus(testCategories);
    const ideaItem = grouped["idea"][0];
    expect(ideaItem.categorySlug).toBe("core");
    expect(ideaItem.categoryTitle).toBe("Core Features");
    const epsilonItem = grouped["planned"].find((i) => i.id === "r_mno90");
    expect(epsilonItem?.categorySlug).toBe("extra");
    expect(epsilonItem?.categoryTitle).toBe("Extra Features");
  });
});

describe("BOARD_COLUMNS", () => {
  it("defines 4 columns in order: idea, planned, in-progress, done", () => {
    expect(BOARD_COLUMNS).toHaveLength(4);
    expect(BOARD_COLUMNS[0]).toEqual({ status: "idea", label: "Ideas" });
    expect(BOARD_COLUMNS[1]).toEqual({ status: "planned", label: "Planned" });
    expect(BOARD_COLUMNS[2]).toEqual({
      status: "in-progress",
      label: "Active",
    });
    expect(BOARD_COLUMNS[3]).toEqual({ status: "done", label: "Done" });
  });
});

describe("RoadmapBoard", () => {
  afterEach(() => {
    cleanup();
  });

  // RBRD-01: board with Ideas/Planned/Active/Done columns
  it("renders four columns: Ideas, Planned, Active, Done", () => {
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={{}}
        itemNames={testItemNames}
      />,
    );
    expect(screen.getByText("Ideas")).toBeInTheDocument();
    expect(screen.getByText("Planned")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("groups items by status into correct columns", () => {
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={{}}
        itemNames={testItemNames}
      />,
    );
    // All 5 items should appear
    expect(screen.getByText("Feature Alpha")).toBeInTheDocument();
    expect(screen.getByText("Feature Beta")).toBeInTheDocument();
    expect(screen.getByText("Feature Gamma")).toBeInTheDocument();
    expect(screen.getByText("Feature Delta")).toBeInTheDocument();
    expect(screen.getByText("Feature Epsilon")).toBeInTheDocument();
  });

  it("renders empty columns with placeholder text", () => {
    render(
      <RoadmapBoard
        categories={emptyCoreOnly}
        sessionRefs={{}}
        itemNames={{ r_abc12: "Solo Idea" }}
      />,
    );
    // Only the Ideas column has items; Planned, Active, Done should show placeholder
    const placeholders = screen.getAllByText("No items");
    expect(placeholders).toHaveLength(3);
  });

  // RBRD-02: card shows name, description, category badge, deps
  it("card displays feature name", () => {
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={{}}
        itemNames={testItemNames}
      />,
    );
    expect(screen.getByText("Feature Alpha")).toBeInTheDocument();
    expect(screen.getByText("Feature Beta")).toBeInTheDocument();
  });

  it("card displays description", () => {
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={{}}
        itemNames={testItemNames}
      />,
    );
    expect(screen.getByText("An idea for a feature")).toBeInTheDocument();
    expect(screen.getByText("A planned feature")).toBeInTheDocument();
  });

  it("card displays category badge", () => {
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={{}}
        itemNames={testItemNames}
      />,
    );
    // CategoryBadge renders the category title. "Core Features" appears in multiple cards.
    const coreBadges = screen.getAllByText("Core Features");
    expect(coreBadges.length).toBeGreaterThanOrEqual(4); // 4 items in core category
    const extraBadges = screen.getAllByText("Extra Features");
    expect(extraBadges.length).toBeGreaterThanOrEqual(1); // 1 item in extra category
  });

  it("card displays dependency indicators", () => {
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={{}}
        itemNames={testItemNames}
      />,
    );
    // Feature Beta depends on 1 item, Feature Epsilon depends on 2 items.
    // DependencyBadge renders the count inside a tooltip trigger with data-slot.
    // Column count badges also render numbers, so filter by data-slot.
    const allTooltipTriggers = screen
      .getAllByText(/^[0-9]+$/)
      .filter((el) => el.getAttribute("data-slot") === "tooltip-trigger");
    expect(allTooltipTriggers).toHaveLength(2); // Beta (1 dep) + Epsilon (2 deps)

    const depCounts = allTooltipTriggers
      .map((el) => el.textContent?.trim())
      .sort();
    expect(depCounts).toContain("1");
    expect(depCounts).toContain("2");
  });

  // RBRD-03: cards show started/completed dates
  it("card shows started date when present", () => {
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={{}}
        itemNames={testItemNames}
      />,
    );
    expect(screen.getByText(/2026-02-01/)).toBeInTheDocument();
    expect(screen.getByText(/2026-03-01/)).toBeInTheDocument();
  });

  it("card shows completed date when present", () => {
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={{}}
        itemNames={testItemNames}
      />,
    );
    expect(screen.getByText(/2026-02-28/)).toBeInTheDocument();
  });

  it("card omits dates when not present", () => {
    render(
      <RoadmapBoard
        categories={emptyCoreOnly}
        sessionRefs={{}}
        itemNames={{ r_abc12: "Solo Idea" }}
      />,
    );
    // Solo Idea has no started/completed dates, so no date text should appear
    expect(screen.queryByText(/Started:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Completed:/)).not.toBeInTheDocument();
  });

  // RBRD-04: session link when referenced
  it("card shows session link when sessionRefs has matching item ID", () => {
    render(
      <RoadmapBoard
        categories={testCategories}
        sessionRefs={testSessionRefs}
        itemNames={testItemNames}
      />,
    );
    const sessionLink = screen.getByTestId("session-link");
    expect(sessionLink).toBeInTheDocument();
    expect(sessionLink).toHaveAttribute(
      "href",
      "/project/my-project/session?highlight=r_jkl78",
    );
  });

  it("card omits session link when no matching ref", () => {
    render(
      <RoadmapBoard
        categories={emptyCoreOnly}
        sessionRefs={{}} // no session refs
        itemNames={{ r_abc12: "Solo Idea" }}
      />,
    );
    expect(screen.queryByTestId("session-link")).not.toBeInTheDocument();
  });

  // Bug fix: empty columns must have adequate drop target area
  it("empty columns have min-h-[120px] for drop target area", () => {
    render(
      <RoadmapBoard
        categories={emptyCoreOnly}
        sessionRefs={{}}
        itemNames={{ r_abc12: "Solo Idea" }}
        onDragStatusChange={vi.fn()}
      />,
    );
    // With only one item in "idea" column, the other 3 columns are empty.
    // Each droppable column should have min-h-[120px] class on the content area.
    const droppablePlanned = screen.getByTestId("droppable-column-planned");
    const contentArea = droppablePlanned.querySelector("[class*='min-h-']");
    expect(contentArea).not.toBeNull();
    expect(contentArea!.className).toContain("min-h-[120px]");
  });
});
