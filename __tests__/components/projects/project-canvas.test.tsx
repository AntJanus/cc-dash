import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Mock the server action so it doesn't actually run
vi.mock("@/lib/actions/portfolio-actions", () => ({
  setProjectCanvasPosition: vi.fn(),
}));

// Mock next/link to avoid AppRouter requirements
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & React.HTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { ProjectCanvas } from "@/components/projects/project-canvas";
import type { ProjectCardData } from "@/lib/projects/get-projects";

function makeProject(overrides: Partial<ProjectCardData>): ProjectCardData {
  return {
    slug: "alpha",
    name: "Alpha",
    description: "",
    path: "/p/alpha",
    doneCount: 0,
    totalCount: 0,
    hasActiveSession: false,
    sessionStatusText: null,
    lastUpdated: null,
    isStale: false,
    status: "active",
    portfolioStatus: "active",
    portfolioOrder: undefined,
    canvasPosition: undefined,
    nextAction: null,
    ...overrides,
  };
}

describe("ProjectCanvas", () => {
  afterEach(cleanup);

  it("renders one canvas-card per project", () => {
    const projects = [
      makeProject({ slug: "alpha", name: "Alpha" }),
      makeProject({ slug: "beta", name: "Beta" }),
      makeProject({ slug: "gamma", name: "Gamma" }),
    ];
    const { container } = render(<ProjectCanvas projects={projects} />);
    const cards = container.querySelectorAll("[data-slot=canvas-card]");
    expect(cards).toHaveLength(3);
  });

  it("uses saved canvasPosition when available", () => {
    const projects = [
      makeProject({
        slug: "alpha",
        name: "Alpha",
        canvasPosition: { x: 250, y: 400 },
      }),
    ];
    const { container } = render(<ProjectCanvas projects={projects} />);
    const card = container.querySelector(
      "[data-slot=canvas-card][data-slug=alpha]",
    ) as HTMLElement;
    expect(card.style.left).toBe("250px");
    expect(card.style.top).toBe("400px");
  });

  it("falls back to a 4-column auto-layout grid when no position is saved", () => {
    const projects = Array.from({ length: 6 }).map((_, i) =>
      makeProject({ slug: `p${i}`, name: `P${i}` }),
    );
    const { container } = render(<ProjectCanvas projects={projects} />);
    const positions = projects.map((p) => {
      const card = container.querySelector(
        `[data-slot=canvas-card][data-slug=${p.slug}]`,
      ) as HTMLElement;
      return { left: card.style.left, top: card.style.top };
    });
    // 4 cards across, then wrap. COLUMN_WIDTH=340, GUTTER_X=32 -> step = 372
    // ROW_HEIGHT=220, GUTTER_Y=32 -> row step = 252
    expect(positions[0]).toEqual({ left: "0px", top: "0px" });
    expect(positions[1]).toEqual({ left: "372px", top: "0px" });
    expect(positions[2]).toEqual({ left: "744px", top: "0px" });
    expect(positions[3]).toEqual({ left: "1116px", top: "0px" });
    // Wraps to row 2
    expect(positions[4]).toEqual({ left: "0px", top: "252px" });
    expect(positions[5]).toEqual({ left: "372px", top: "252px" });
  });

  it("mixes saved and auto-laid-out positions correctly", () => {
    const projects = [
      makeProject({
        slug: "saved",
        name: "Saved",
        canvasPosition: { x: 999, y: 999 },
      }),
      makeProject({ slug: "auto", name: "Auto" }),
    ];
    const { container } = render(<ProjectCanvas projects={projects} />);
    const saved = container.querySelector("[data-slug=saved]") as HTMLElement;
    const auto = container.querySelector("[data-slug=auto]") as HTMLElement;
    expect(saved.style.left).toBe("999px");
    expect(saved.style.top).toBe("999px");
    // "auto" is at index 1 in the unsorted projects array → col 1 row 0
    expect(auto.style.left).toBe("372px");
    expect(auto.style.top).toBe("0px");
  });

  it("renders the scroll container with the canvas-scroll class", () => {
    const { container } = render(<ProjectCanvas projects={[]} />);
    const scroll = container.querySelector("[data-slot=project-canvas]");
    expect(scroll).not.toBeNull();
    expect(scroll).toHaveClass("canvas-scroll");
  });

  it("each card links to the project roadmap", () => {
    const projects = [makeProject({ slug: "alpha-app", name: "Vlak" })];
    render(<ProjectCanvas projects={projects} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/project/alpha-app/roadmap");
  });
});
