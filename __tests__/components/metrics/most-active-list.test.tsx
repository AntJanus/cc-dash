import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MostActiveList } from "@/components/metrics/most-active-list";
import type { ActiveProject } from "@/lib/metrics/portfolio-metrics";

describe("MostActiveList", () => {
  afterEach(cleanup);

  it("renders project names with completion counts", () => {
    const projects: ActiveProject[] = [
      {
        slug: "a",
        name: "Project A",
        recentCompletions: 12,
        lastActivity: "2026-04-14",
      },
      {
        slug: "b",
        name: "Project B",
        recentCompletions: 5,
        lastActivity: "2026-04-13",
      },
    ];
    render(<MostActiveList projects={projects} />);

    expect(screen.getByText("Project A")).toBeInTheDocument();
    expect(screen.getByText("12 items")).toBeInTheDocument();
    expect(screen.getByText("Project B")).toBeInTheDocument();
    expect(screen.getByText("5 items")).toBeInTheDocument();
  });

  it("shows empty message when no projects", () => {
    render(<MostActiveList projects={[]} />);
    expect(screen.getByText(/No recent activity/)).toBeInTheDocument();
  });

  it("renders links to project roadmap pages", () => {
    const projects: ActiveProject[] = [
      {
        slug: "test-proj",
        name: "Test",
        recentCompletions: 3,
        lastActivity: "2026-04-14",
      },
    ];
    render(<MostActiveList projects={projects} />);

    const link = screen.getByText("Test").closest("a");
    expect(link).toHaveAttribute("href", "/project/test-proj/roadmap");
  });
});
