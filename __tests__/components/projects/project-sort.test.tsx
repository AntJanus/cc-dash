import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { ProjectSort } from "@/components/projects/project-sort";
import { sortProjects } from "@/lib/projects/sort-projects";
import type { SortState } from "@/lib/projects/sort-projects";
import type { ProjectCardData } from "@/lib/projects/get-projects";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProject(
  overrides: Partial<ProjectCardData> = {},
): ProjectCardData {
  return {
    slug: "test",
    name: "Test Project",
    description: "A test project",
    path: "/tmp/test",
    doneCount: 3,
    totalCount: 10,
    hasActiveSession: false,
    sessionStatusText: null,
    lastUpdated: "2026-03-20T10:00:00Z",
    isStale: false,
    status: "inactive",
    portfolioStatus: "active",
    portfolioOrder: undefined,
    canvasPosition: undefined,
    nextAction: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// sortProjects unit tests
// ---------------------------------------------------------------------------

describe("sortProjects", () => {
  const alpha = makeProject({
    slug: "alpha",
    name: "Alpha",
    doneCount: 2,
    totalCount: 10,
    lastUpdated: "2026-03-10T00:00:00Z",
    status: "stalled",
  });
  const bravo = makeProject({
    slug: "bravo",
    name: "Bravo",
    doneCount: 8,
    totalCount: 10,
    lastUpdated: "2026-03-20T00:00:00Z",
    status: "active",
  });
  const charlie = makeProject({
    slug: "charlie",
    name: "Charlie",
    doneCount: 5,
    totalCount: 10,
    lastUpdated: "2026-03-15T00:00:00Z",
    status: "complete",
  });
  const noDate = makeProject({
    slug: "no-date",
    name: "NoDate",
    doneCount: 0,
    totalCount: 5,
    lastUpdated: null,
    status: "inactive",
  });

  const projects = [alpha, bravo, charlie, noDate];

  describe("sort by name", () => {
    it("sorts A-Z (asc)", () => {
      const result = sortProjects(projects, {
        field: "name",
        direction: "asc",
      });
      const names = result.map((p) => p.name);
      expect(names).toEqual(["Alpha", "Bravo", "Charlie", "NoDate"]);
    });

    it("sorts Z-A (desc)", () => {
      const result = sortProjects(projects, {
        field: "name",
        direction: "desc",
      });
      const names = result.map((p) => p.name);
      expect(names).toEqual(["NoDate", "Charlie", "Bravo", "Alpha"]);
    });
  });

  describe("sort by progress", () => {
    it("sorts low to high (asc)", () => {
      const result = sortProjects(projects, {
        field: "progress",
        direction: "asc",
      });
      const slugs = result.map((p) => p.slug);
      // noDate: 0%, alpha: 20%, charlie: 50%, bravo: 80%
      expect(slugs).toEqual(["no-date", "alpha", "charlie", "bravo"]);
    });

    it("sorts high to low (desc)", () => {
      const result = sortProjects(projects, {
        field: "progress",
        direction: "desc",
      });
      const slugs = result.map((p) => p.slug);
      expect(slugs).toEqual(["bravo", "charlie", "alpha", "no-date"]);
    });
  });

  describe("sort by last_updated", () => {
    it("sorts newest first (desc)", () => {
      const result = sortProjects(projects, {
        field: "last_updated",
        direction: "desc",
      });
      const slugs = result.map((p) => p.slug);
      // bravo (Mar 20) > charlie (Mar 15) > alpha (Mar 10) > noDate (null, always last)
      expect(slugs).toEqual(["bravo", "charlie", "alpha", "no-date"]);
    });

    it("sorts oldest first (asc)", () => {
      const result = sortProjects(projects, {
        field: "last_updated",
        direction: "asc",
      });
      const slugs = result.map((p) => p.slug);
      // alpha (Mar 10) < charlie (Mar 15) < bravo (Mar 20), noDate always last
      expect(slugs).toEqual(["alpha", "charlie", "bravo", "no-date"]);
    });

    it("keeps null lastUpdated at the end regardless of direction", () => {
      const result_asc = sortProjects(projects, {
        field: "last_updated",
        direction: "asc",
      });
      const result_desc = sortProjects(projects, {
        field: "last_updated",
        direction: "desc",
      });
      expect(result_asc[result_asc.length - 1].slug).toBe("no-date");
      expect(result_desc[result_desc.length - 1].slug).toBe("no-date");
    });
  });

  describe("sort by status", () => {
    it("sorts active first (asc) — active > stalled > complete > inactive", () => {
      const result = sortProjects(projects, {
        field: "status",
        direction: "asc",
      });
      const statuses = result.map((p) => p.status);
      expect(statuses).toEqual(["active", "stalled", "complete", "inactive"]);
    });

    it("sorts inactive first (desc) — reversed order", () => {
      const result = sortProjects(projects, {
        field: "status",
        direction: "desc",
      });
      const statuses = result.map((p) => p.status);
      expect(statuses).toEqual(["inactive", "complete", "stalled", "active"]);
    });
  });

  describe("sort by priority", () => {
    it("sorts by portfolio order (asc), unranked last alphabetically", () => {
      const ranked1 = makeProject({
        slug: "ranked-1",
        name: "Zeta",
        portfolioOrder: 0,
      });
      const ranked2 = makeProject({
        slug: "ranked-2",
        name: "Yank",
        portfolioOrder: 1,
      });
      const unrankedA = makeProject({
        slug: "unranked-a",
        name: "Alpha",
        portfolioOrder: undefined,
      });
      const unrankedB = makeProject({
        slug: "unranked-b",
        name: "Beta",
        portfolioOrder: undefined,
      });

      const result = sortProjects([unrankedB, ranked2, unrankedA, ranked1], {
        field: "priority",
        direction: "asc",
      });
      expect(result.map((p) => p.slug)).toEqual([
        "ranked-1",
        "ranked-2",
        "unranked-a",
        "unranked-b",
      ]);
    });

    it("reverses ranked order in desc, unranked still last", () => {
      const ranked1 = makeProject({
        slug: "ranked-1",
        name: "Zeta",
        portfolioOrder: 0,
      });
      const ranked2 = makeProject({
        slug: "ranked-2",
        name: "Yank",
        portfolioOrder: 1,
      });
      const unranked = makeProject({
        slug: "unranked",
        name: "Alpha",
        portfolioOrder: undefined,
      });

      const result = sortProjects([unranked, ranked1, ranked2], {
        field: "priority",
        direction: "desc",
      });
      expect(result.map((p) => p.slug)).toEqual([
        "ranked-2",
        "ranked-1",
        "unranked",
      ]);
    });
  });

  it("does not mutate the input array", () => {
    const input = [bravo, alpha, charlie];
    const original = [...input];
    sortProjects(input, { field: "name", direction: "asc" });
    expect(input).toEqual(original);
  });

  it("handles empty array", () => {
    expect(sortProjects([], { field: "name", direction: "asc" })).toEqual([]);
  });

  it("handles single-item array", () => {
    const result = sortProjects([alpha], { field: "name", direction: "asc" });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("alpha");
  });
});

// ---------------------------------------------------------------------------
// ProjectSort component tests
// ---------------------------------------------------------------------------

describe("ProjectSort", () => {
  afterEach(() => {
    cleanup();
  });

  function renderSort(sort: SortState, onChange = vi.fn()) {
    render(<ProjectSort sort={sort} onChange={onChange} />);
    return onChange;
  }

  it("renders all sort option buttons", () => {
    renderSort({ field: "last_updated", direction: "desc" });

    expect(
      screen.getByRole("button", { name: /updated/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /priority/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /name/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /progress/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /status/i })).toBeInTheDocument();
  });

  it("marks the active field button as pressed", () => {
    renderSort({ field: "name", direction: "asc" });

    const nameBtn = screen.getByRole("button", { name: /sort by name/i });
    expect(nameBtn).toHaveAttribute("aria-pressed", "true");

    const updatedBtn = screen.getByRole("button", { name: /sort by updated/i });
    expect(updatedBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with new field and default direction when an inactive field is clicked", () => {
    const onChange = renderSort({ field: "last_updated", direction: "desc" });

    // Click Name (default direction for name is asc)
    fireEvent.click(screen.getByRole("button", { name: /sort by name/i }));

    expect(onChange).toHaveBeenCalledWith({ field: "name", direction: "asc" });
  });

  it("toggles direction when the active field is clicked again", () => {
    const onChange = renderSort({ field: "name", direction: "asc" });

    fireEvent.click(screen.getByRole("button", { name: /sort by name/i }));

    expect(onChange).toHaveBeenCalledWith({ field: "name", direction: "desc" });
  });

  it("toggles asc->desc->asc for the active field", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <ProjectSort
        sort={{ field: "progress", direction: "desc" }}
        onChange={onChange}
      />,
    );

    // Click active Progress button: desc -> asc
    fireEvent.click(screen.getByRole("button", { name: /sort by progress/i }));
    expect(onChange).toHaveBeenLastCalledWith({
      field: "progress",
      direction: "asc",
    });

    // Simulate parent updating sort state
    rerender(
      <ProjectSort
        sort={{ field: "progress", direction: "asc" }}
        onChange={onChange}
      />,
    );

    // Click again: asc -> desc
    fireEvent.click(screen.getByRole("button", { name: /sort by progress/i }));
    expect(onChange).toHaveBeenLastCalledWith({
      field: "progress",
      direction: "desc",
    });

    cleanup();
  });

  describe("default directions for each field", () => {
    // Maps field to its display label used in aria-label ("Sort by {label}")
    const cases: Array<{
      field: SortState["field"];
      label: string;
      expectedDir: SortState["direction"];
    }> = [
      { field: "last_updated", label: "Updated", expectedDir: "desc" },
      { field: "priority", label: "Priority", expectedDir: "asc" },
      { field: "name", label: "Name", expectedDir: "asc" },
      { field: "progress", label: "Progress", expectedDir: "desc" },
      { field: "status", label: "Status", expectedDir: "asc" },
    ];

    for (const { field, label, expectedDir } of cases) {
      it(`clicking ${field} from a different active field uses direction=${expectedDir}`, () => {
        // Start with a different active field
        const activeField = field === "name" ? "progress" : "name";
        const onChange = renderSort({ field: activeField, direction: "asc" });

        const btn = screen.getByRole("button", {
          name: new RegExp(`sort by ${label}`, "i"),
        });
        fireEvent.click(btn);

        expect(onChange).toHaveBeenCalledWith({
          field,
          direction: expectedDir,
        });
        cleanup();
      });
    }
  });

  it("renders a Sort: label", () => {
    renderSort({ field: "last_updated", direction: "desc" });
    expect(screen.getByText("Sort:")).toBeInTheDocument();
  });
});
