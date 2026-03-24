import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { RoadmapList } from "@/components/roadmap/roadmap-list";
import type { RoadmapCategory } from "@/lib/schemas/roadmap";

const testCategories: RoadmapCategory[] = [
  {
    title: "Core Features",
    slug: "core",
    items: [
      {
        id: "r_abc12",
        status: "planned",
        name: "Feature A",
        description: "First feature",
        started: "2026-02-01",
      },
      {
        id: "r_def34",
        status: "done",
        name: "Feature B",
        description: "Second feature",
        completed: "2026-02-15",
        depends: ["r_abc12"],
      },
    ],
  },
  {
    title: "Extra Features",
    slug: "extra",
    items: [
      {
        id: "r_ghi56",
        status: "in-progress",
        name: "Feature C",
        description: "Third feature",
        started: "2026-03-01",
        depends: ["r_abc12", "r_def34"],
      },
    ],
  },
];

const testItemNames: Record<string, string> = {
  r_abc12: "Feature A",
  r_def34: "Feature B",
  r_ghi56: "Feature C",
};

const defaultSessionRefs: Record<string, string> = {};

describe("RoadmapList", () => {
  afterEach(() => {
    cleanup();
  });

  // RLST-01: list grouped by category
  it("groups items by category with section headings", () => {
    render(
      <RoadmapList
        categories={testCategories}
        sessionRefs={defaultSessionRefs}
        itemNames={testItemNames}
      />,
    );
    // Check for h3 headings specifically (text also appears in filter options)
    const headings = screen.getAllByRole("heading", { level: 3 });
    const headingTexts = headings.map((h) => h.textContent);
    expect(headingTexts).toContain("Core Features");
    expect(headingTexts).toContain("Extra Features");
  });

  it("renders items as table rows within each category", () => {
    render(
      <RoadmapList
        categories={testCategories}
        sessionRefs={defaultSessionRefs}
        itemNames={testItemNames}
      />,
    );
    // All three items should appear
    expect(screen.getByText("Feature A")).toBeInTheDocument();
    expect(screen.getByText("Feature B")).toBeInTheDocument();
    expect(screen.getByText("Feature C")).toBeInTheDocument();
  });

  // RLST-02: shows name, status, started, dependencies
  it("displays feature name in each row", () => {
    render(
      <RoadmapList
        categories={testCategories}
        sessionRefs={defaultSessionRefs}
        itemNames={testItemNames}
      />,
    );
    expect(screen.getByText("Feature A")).toBeInTheDocument();
    expect(screen.getByText("Feature B")).toBeInTheDocument();
    expect(screen.getByText("Feature C")).toBeInTheDocument();
  });

  it("displays status badge in each row", () => {
    render(
      <RoadmapList
        categories={testCategories}
        sessionRefs={defaultSessionRefs}
        itemNames={testItemNames}
      />,
    );
    // RoadmapStatusBadge renders: planned->Planned, done->Done, in-progress->Active
    expect(screen.getByText("Planned")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("displays started date in each row", () => {
    render(
      <RoadmapList
        categories={testCategories}
        sessionRefs={defaultSessionRefs}
        itemNames={testItemNames}
      />,
    );
    expect(screen.getByText("2026-02-01")).toBeInTheDocument();
    expect(screen.getByText("2026-03-01")).toBeInTheDocument();
  });

  it("displays dependency indicators in each row", () => {
    render(
      <RoadmapList
        categories={testCategories}
        sessionRefs={defaultSessionRefs}
        itemNames={testItemNames}
      />,
    );
    // Feature B depends on 1 item, Feature C depends on 2 items
    // DependencyBadge renders the count
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  // RLST-03: filter by category
  it("shows all categories by default", () => {
    render(
      <RoadmapList
        categories={testCategories}
        sessionRefs={defaultSessionRefs}
        itemNames={testItemNames}
      />,
    );
    // Check headings specifically
    const headings = screen.getAllByRole("heading", { level: 3 });
    const headingTexts = headings.map((h) => h.textContent);
    expect(headingTexts).toContain("Core Features");
    expect(headingTexts).toContain("Extra Features");
    // Items should all be visible
    expect(screen.getByText("Feature A")).toBeInTheDocument();
    expect(screen.getByText("Feature C")).toBeInTheDocument();
  });

  it("filters to single category when selected", () => {
    render(
      <RoadmapList
        categories={testCategories}
        sessionRefs={defaultSessionRefs}
        itemNames={testItemNames}
      />,
    );
    // Use the native select element
    const select = screen.getByTestId("category-filter");
    fireEvent.change(select, { target: { value: "extra" } });

    // Extra Features should be visible, Core Features should not
    expect(screen.getByText("Feature C")).toBeInTheDocument();
    expect(screen.queryByText("Feature A")).not.toBeInTheDocument();
    expect(screen.queryByText("Feature B")).not.toBeInTheDocument();
  });

  it("shows all categories when 'All' filter selected", () => {
    render(
      <RoadmapList
        categories={testCategories}
        sessionRefs={defaultSessionRefs}
        itemNames={testItemNames}
      />,
    );
    const select = screen.getByTestId("category-filter");

    // First filter to "Extra Features"
    fireEvent.change(select, { target: { value: "extra" } });
    expect(screen.queryByText("Feature A")).not.toBeInTheDocument();

    // Now select "All"
    fireEvent.change(select, { target: { value: "all" } });
    expect(screen.getByText("Feature A")).toBeInTheDocument();
    expect(screen.getByText("Feature C")).toBeInTheDocument();
  });

  // RLST-04: Sort functionality
  describe("sorting", () => {
    const sortTestCategories: RoadmapCategory[] = [
      {
        title: "Test Category",
        slug: "test",
        items: [
          {
            id: "r_item1",
            status: "done",
            name: "Zebra Feature",
            description: "Last alphabetically",
            started: "2026-01-15",
          },
          {
            id: "r_item2",
            status: "idea",
            name: "Alpha Feature",
            description: "First alphabetically",
          },
          {
            id: "r_item3",
            status: "in-progress",
            name: "Beta Feature",
            description: "Middle alphabetically",
            started: "2026-01-01",
          },
        ],
      },
    ];

    it("shows sort dropdown with Manual as default", () => {
      render(
        <RoadmapList
          categories={sortTestCategories}
          sessionRefs={defaultSessionRefs}
          itemNames={{}}
        />,
      );
      const sortSelect = screen.getByTestId("sort-by");
      expect(sortSelect).toHaveValue("manual");
    });

    it("sorts by status (idea → planned → in-progress → done)", () => {
      render(
        <RoadmapList
          categories={sortTestCategories}
          sessionRefs={defaultSessionRefs}
          itemNames={{}}
        />,
      );
      const sortSelect = screen.getByTestId("sort-by");
      fireEvent.change(sortSelect, { target: { value: "status" } });

      // Get all table rows (excluding header)
      const rows = screen.getAllByRole("row").slice(1);
      const names = rows.map((row) => row.querySelector("td")?.textContent);

      // idea (Alpha) → in-progress (Beta) → done (Zebra)
      expect(names).toEqual(["Alpha Feature", "Beta Feature", "Zebra Feature"]);
    });

    it("sorts by name alphabetically", () => {
      render(
        <RoadmapList
          categories={sortTestCategories}
          sessionRefs={defaultSessionRefs}
          itemNames={{}}
        />,
      );
      const sortSelect = screen.getByTestId("sort-by");
      fireEvent.change(sortSelect, { target: { value: "name" } });

      const rows = screen.getAllByRole("row").slice(1);
      const names = rows.map((row) => row.querySelector("td")?.textContent);

      expect(names).toEqual(["Alpha Feature", "Beta Feature", "Zebra Feature"]);
    });

    it("sorts by started date (oldest first, null at end)", () => {
      render(
        <RoadmapList
          categories={sortTestCategories}
          sessionRefs={defaultSessionRefs}
          itemNames={{}}
        />,
      );
      const sortSelect = screen.getByTestId("sort-by");
      fireEvent.change(sortSelect, { target: { value: "started" } });

      const rows = screen.getAllByRole("row").slice(1);
      const names = rows.map((row) => row.querySelector("td")?.textContent);

      // 2026-01-01 (Beta) → 2026-01-15 (Zebra) → null (Alpha)
      expect(names).toEqual(["Beta Feature", "Zebra Feature", "Alpha Feature"]);
    });

    it("hides Order column when not in manual sort mode", () => {
      render(
        <RoadmapList
          categories={sortTestCategories}
          sessionRefs={defaultSessionRefs}
          itemNames={{}}
          onAddItem={() => {}}
          onUpdateItem={() => {}}
          onDeleteItem={() => {}}
          onReorderItems={() => {}}
        />,
      );

      // In manual mode, Order column should be visible
      expect(screen.getByText("Order")).toBeInTheDocument();

      // Switch to status sort
      const sortSelect = screen.getByTestId("sort-by");
      fireEvent.change(sortSelect, { target: { value: "status" } });

      // Order column should be hidden
      expect(screen.queryByText("Order")).not.toBeInTheDocument();
    });
  });
});
