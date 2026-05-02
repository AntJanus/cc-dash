import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { ProjectGrid } from "@/components/projects/project-grid";
import { ProjectFilters } from "@/components/projects/project-filters";
import type { ProjectCardData } from "@/lib/projects/get-projects";

/** Helper to create a default ProjectCardData with overrides */
function makeProject(
  overrides: Partial<ProjectCardData> = {},
): ProjectCardData {
  return {
    slug: "test-project",
    name: "Test Project",
    description: "A test project",
    path: "/tmp/test-project",
    doneCount: 3,
    totalCount: 10,
    hasActiveSession: false,
    sessionStatusText: null,
    lastUpdated: new Date().toISOString(),
    isStale: false,
    status: "inactive",
    portfolioStatus: "active",
    portfolioOrder: undefined,
    canvasPosition: undefined,
    nextAction: null,
    ...overrides,
  };
}

/** Standard test dataset with one of each status */
const testProjects: ProjectCardData[] = [
  makeProject({
    slug: "dashboard",
    name: "Dashboard",
    description: "Project management dashboard",
    status: "active",
  }),
  makeProject({
    slug: "blog",
    name: "Blog",
    description: "Personal blog engine",
    status: "stalled",
  }),
  makeProject({
    slug: "tracker",
    name: "Tracker",
    description: "Redis cache tracker",
    status: "complete",
  }),
  makeProject({
    slug: "tools",
    name: "Tools",
    description: "Developer tools collection",
    status: "inactive",
  }),
];

describe("ProjectGrid", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders all projects when no filter is active", () => {
    render(<ProjectGrid projects={testProjects} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("Tracker")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
  });

  it("'All' filter button shows all projects", () => {
    render(<ProjectGrid projects={testProjects} />);
    // Click "All" explicitly to confirm it shows all projects
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("Tracker")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
  });

  it("'Active' filter shows only active projects", () => {
    render(<ProjectGrid projects={testProjects} />);
    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Blog")).not.toBeInTheDocument();
    expect(screen.queryByText("Tracker")).not.toBeInTheDocument();
    expect(screen.queryByText("Tools")).not.toBeInTheDocument();
  });

  it("'Stalled' filter shows only stalled projects", () => {
    render(<ProjectGrid projects={testProjects} />);
    fireEvent.click(screen.getByRole("button", { name: "Stalled" }));
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.getByText("Blog")).toBeInTheDocument();
    expect(screen.queryByText("Tracker")).not.toBeInTheDocument();
    expect(screen.queryByText("Tools")).not.toBeInTheDocument();
  });

  it("'Complete' filter shows only complete projects", () => {
    render(<ProjectGrid projects={testProjects} />);
    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Blog")).not.toBeInTheDocument();
    expect(screen.getByText("Tracker")).toBeInTheDocument();
    expect(screen.queryByText("Tools")).not.toBeInTheDocument();
  });

  it("'Inactive' filter shows only inactive projects", () => {
    render(<ProjectGrid projects={testProjects} />);
    fireEvent.click(screen.getByRole("button", { name: "Inactive" }));
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Blog")).not.toBeInTheDocument();
    expect(screen.queryByText("Tracker")).not.toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
  });

  it("search by project name filters results", () => {
    render(<ProjectGrid projects={testProjects} />);
    fireEvent.change(screen.getByPlaceholderText("Search projects..."), {
      target: { value: "dash" },
    });
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Blog")).not.toBeInTheDocument();
    expect(screen.queryByText("Tracker")).not.toBeInTheDocument();
    expect(screen.queryByText("Tools")).not.toBeInTheDocument();
  });

  it("search by project description filters results", () => {
    render(<ProjectGrid projects={testProjects} />);
    fireEvent.change(screen.getByPlaceholderText("Search projects..."), {
      target: { value: "redis" },
    });
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.getByText("Tracker")).toBeInTheDocument();
  });

  it("search is case-insensitive", () => {
    render(<ProjectGrid projects={testProjects} />);
    fireEvent.change(screen.getByPlaceholderText("Search projects..."), {
      target: { value: "DASH" },
    });
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("combined filter and search narrows results correctly", () => {
    render(<ProjectGrid projects={testProjects} />);
    fireEvent.click(screen.getByRole("button", { name: "Active" }));
    fireEvent.change(screen.getByPlaceholderText("Search projects..."), {
      target: { value: "nonexistent" },
    });
    expect(screen.getByText("No projects found")).toBeInTheDocument();
  });

  it("shows empty state message when no projects match filter", () => {
    render(<ProjectGrid projects={testProjects} />);
    fireEvent.change(screen.getByPlaceholderText("Search projects..."), {
      target: { value: "zzzzzznotfound" },
    });
    expect(screen.getByText("No projects found")).toBeInTheDocument();
  });

  it("shows empty state message when projects array is empty", () => {
    render(<ProjectGrid projects={[]} />);
    expect(screen.getByText(/no projects found/i)).toBeInTheDocument();
  });
});

describe("ProjectFilters", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders filter buttons for All, Active, Stalled, Complete", () => {
    render(
      <ProjectFilters
        statusFilter="all"
        onStatusFilterChange={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stalled" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Complete" }),
    ).toBeInTheDocument();
  });

  it("active filter button has visually distinct styling", () => {
    render(
      <ProjectFilters
        statusFilter="active"
        onStatusFilterChange={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
      />,
    );
    const activeBtn = screen.getByRole("button", { name: "Active" });
    const allBtn = screen.getByRole("button", { name: "All" });
    // The currently selected button should have a different class than unselected
    expect(activeBtn.className).not.toEqual(allBtn.className);
  });

  it("search input has placeholder 'Search projects...'", () => {
    render(
      <ProjectFilters
        statusFilter="all"
        onStatusFilterChange={() => {}}
        searchQuery=""
        onSearchChange={() => {}}
      />,
    );
    expect(
      screen.getByPlaceholderText("Search projects..."),
    ).toBeInTheDocument();
  });
});
