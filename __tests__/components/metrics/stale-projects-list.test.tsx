import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { StaleProjectsList } from "@/components/metrics/stale-projects-list";
import type { StaleProject } from "@/lib/metrics/portfolio-metrics";

describe("StaleProjectsList", () => {
  afterEach(cleanup);

  it("renders project names with days since update", () => {
    const projects: StaleProject[] = [
      {
        slug: "a",
        name: "Project A",
        lastUpdated: "2026-04-01",
        daysSinceUpdate: 14,
        status: "stalled",
      },
      {
        slug: "b",
        name: "Project B",
        lastUpdated: "2026-03-15",
        daysSinceUpdate: 31,
        status: "inactive",
      },
    ];
    render(<StaleProjectsList projects={projects} />);

    expect(screen.getByText("Project A")).toBeInTheDocument();
    expect(screen.getByText("14d ago")).toBeInTheDocument();
    expect(screen.getByText("Project B")).toBeInTheDocument();
    expect(screen.getByText("31d ago")).toBeInTheDocument();
  });

  it("shows empty message when no stale projects", () => {
    render(<StaleProjectsList projects={[]} />);
    expect(
      screen.getByText(/All projects have been updated/),
    ).toBeInTheDocument();
  });

  it("shows 'No update date' for projects with daysSinceUpdate of -1", () => {
    const projects: StaleProject[] = [
      {
        slug: "x",
        name: "No Date",
        lastUpdated: null,
        daysSinceUpdate: -1,
        status: "inactive",
      },
    ];
    render(<StaleProjectsList projects={projects} />);
    expect(screen.getByText("No update date")).toBeInTheDocument();
  });

  it("limits display to 10 projects", () => {
    const projects: StaleProject[] = Array.from({ length: 15 }, (_, i) => ({
      slug: `p${i}`,
      name: `Project ${i}`,
      lastUpdated: "2026-01-01",
      daysSinceUpdate: 100 + i,
      status: "inactive" as const,
    }));
    render(<StaleProjectsList projects={projects} />);

    expect(screen.getByText("Project 0")).toBeInTheDocument();
    expect(screen.getByText("Project 9")).toBeInTheDocument();
    expect(screen.queryByText("Project 10")).not.toBeInTheDocument();
  });
});
