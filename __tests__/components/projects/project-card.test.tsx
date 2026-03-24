import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { ProjectCard } from "@/components/projects/project-card";
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
    ...overrides,
  };
}

describe("ProjectCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the project name", () => {
    render(<ProjectCard project={makeProject({ name: "My Dashboard" })} />);
    expect(screen.getByText("My Dashboard")).toBeInTheDocument();
  });

  it("renders the project description", () => {
    render(
      <ProjectCard project={makeProject({ description: "A cool project" })} />,
    );
    expect(screen.getByText("A cool project")).toBeInTheDocument();
  });

  it("renders a progress ring with correct percentage", () => {
    render(
      <ProjectCard project={makeProject({ doneCount: 7, totalCount: 10 })} />,
    );
    // ProgressRing shows percentage in the center
    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  it("renders item count in new format", () => {
    render(
      <ProjectCard project={makeProject({ doneCount: 3, totalCount: 10 })} />,
    );
    // New format: "3 / 10 tasks"
    expect(screen.getByText(/3\s*\/\s*10\s*tasks/)).toBeInTheDocument();
  });

  it("shows session active text when project has active session", () => {
    render(<ProjectCard project={makeProject({ hasActiveSession: true })} />);
    expect(screen.getByText("Session active")).toBeInTheDocument();
  });

  it("does not show session active when project is inactive", () => {
    render(<ProjectCard project={makeProject({ hasActiveSession: false })} />);
    expect(screen.queryByText("Session active")).not.toBeInTheDocument();
  });

  it("displays session status text when available", () => {
    render(
      <ProjectCard
        project={makeProject({
          hasActiveSession: true,
          sessionStatusText: "Implementing auth",
        })}
      />,
    );
    expect(screen.getByText("Implementing auth")).toBeInTheDocument();
  });

  it("does not display session status text when null", () => {
    render(
      <ProjectCard
        project={makeProject({
          hasActiveSession: false,
          sessionStatusText: null,
        })}
      />,
    );
    expect(screen.queryByText("Implementing auth")).not.toBeInTheDocument();
  });

  it("shows relative timestamp for lastUpdated", () => {
    // Use a date 2 days ago to get a relative time string
    const twoDaysAgo = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString();
    render(<ProjectCard project={makeProject({ lastUpdated: twoDaysAgo })} />);
    // Should render a <time> element with some relative text
    const timeEl = screen.getByTestId("relative-time");
    expect(timeEl).toBeInTheDocument();
    expect(timeEl.textContent).toBeTruthy();
  });

  it("shows stale badge when project isStale is true", () => {
    render(<ProjectCard project={makeProject({ isStale: true })} />);
    expect(screen.getByText("Stale")).toBeInTheDocument();
  });

  it("does not show stale badge when project isStale is false", () => {
    render(<ProjectCard project={makeProject({ isStale: false })} />);
    expect(screen.queryByText("Stale")).not.toBeInTheDocument();
  });

  it("renders status badge with correct status text", () => {
    render(<ProjectCard project={makeProject({ status: "active" })} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders status badge for each status variant", () => {
    const statuses = [
      { status: "active" as const, label: "Active" },
      { status: "stalled" as const, label: "Stalled" },
      { status: "complete" as const, label: "Complete" },
      { status: "inactive" as const, label: "Inactive" },
    ];
    for (const { status, label } of statuses) {
      const { unmount } = render(
        <ProjectCard project={makeProject({ status })} />,
      );
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it("handles zero totalCount without error", () => {
    render(
      <ProjectCard project={makeProject({ doneCount: 0, totalCount: 0 })} />,
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText(/0\s*\/\s*0\s*tasks/)).toBeInTheDocument();
  });

  it("shows 'No activity' when lastUpdated is null", () => {
    render(<ProjectCard project={makeProject({ lastUpdated: null })} />);
    expect(screen.getByText("No activity")).toBeInTheDocument();
  });
});
