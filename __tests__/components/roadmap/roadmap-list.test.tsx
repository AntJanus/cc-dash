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
});
