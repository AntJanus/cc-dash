import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ArrowRight } from "lucide-react";
import { PulseLane } from "@/components/today/pulse-lane";
import type { ProjectCardData } from "@/lib/projects/get-projects";

function makeProject(
  overrides: Partial<ProjectCardData> = {},
): ProjectCardData {
  return {
    slug: "alpha",
    name: "Alpha",
    description: "",
    path: "/p/alpha",
    doneCount: 4,
    totalCount: 10,
    hasActiveSession: false,
    sessionStatusText: null,
    lastUpdated: "2026-04-29T10:00:00Z",
    isStale: false,
    status: "active",
    portfolioStatus: "active",
    portfolioOrder: undefined,
    canvasPosition: undefined,
    nextAction: null,
    ...overrides,
  };
}

describe("PulseLane", () => {
  afterEach(cleanup);

  it("renders title and subtitle", () => {
    render(
      <PulseLane
        title="Up Next"
        subtitle="One per project"
        icon={ArrowRight}
        accent="teal"
        projects={[]}
        emptyMessage="nothing"
      />,
    );
    expect(screen.getByText("Up Next")).toBeInTheDocument();
    expect(screen.getByText("One per project")).toBeInTheDocument();
  });

  it("renders empty message when no projects", () => {
    render(
      <PulseLane
        title="Stalled"
        subtitle="14+ days"
        icon={ArrowRight}
        accent="amber"
        projects={[]}
        emptyMessage="Nothing stalled"
      />,
    );
    expect(screen.getByText("Nothing stalled")).toBeInTheDocument();
  });

  it("renders one row per project with name and counts", () => {
    const projects = [
      makeProject({
        slug: "alpha",
        name: "Alpha",
        doneCount: 4,
        totalCount: 10,
      }),
      makeProject({ slug: "beta", name: "Beta", doneCount: 9, totalCount: 10 }),
    ];
    render(
      <PulseLane
        title="t"
        subtitle="s"
        icon={ArrowRight}
        accent="teal"
        projects={projects}
        emptyMessage="empty"
      />,
    );
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("4/10")).toBeInTheDocument();
    expect(screen.getByText("9/10")).toBeInTheDocument();
  });

  it("renders nextAction when showNextAction is true and project has one", () => {
    const project = makeProject({
      nextAction: {
        id: "r_aaaaa",
        name: "Wire payments",
        source: "roadmap-planned",
      },
    });
    render(
      <PulseLane
        title="t"
        subtitle="s"
        icon={ArrowRight}
        accent="teal"
        projects={[project]}
        emptyMessage="empty"
        showNextAction
      />,
    );
    expect(screen.getByText("Next:")).toBeInTheDocument();
    expect(screen.getByText("Wire payments")).toBeInTheDocument();
  });

  it("links each row to the project's roadmap by default", () => {
    const project = makeProject({ slug: "alpha-app", name: "Alpha App" });
    render(
      <PulseLane
        title="t"
        subtitle="s"
        icon={ArrowRight}
        accent="teal"
        projects={[project]}
        emptyMessage="empty"
      />,
    );
    const link = screen.getByRole("link", { name: /Alpha App/ });
    expect(link).toHaveAttribute("href", "/project/alpha-app/roadmap");
  });
});
