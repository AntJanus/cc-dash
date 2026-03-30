import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { SearchResultCard } from "@/components/search/search-result-card";
import type { SearchResult } from "@/lib/actions/search-actions";

function makeRoadmapResult(
  overrides: Partial<SearchResult> = {},
): SearchResult {
  return {
    projectSlug: "my-project",
    projectName: "My Project",
    itemId: "r_abc12",
    title: "Build search feature",
    description: "Implement cross-project search",
    status: "planned",
    type: "roadmap",
    link: "/project/my-project/roadmap",
    ...overrides,
  };
}

function makeSessionResult(
  overrides: Partial<SearchResult> = {},
): SearchResult {
  return {
    projectSlug: "my-project",
    projectName: "My Project",
    itemId: "t_a1b2c",
    title: "Implement search UI component",
    description: "s_2026-03-17_feature-work",
    status: "pending",
    type: "session",
    link: "/project/my-project/session",
    ...overrides,
  };
}

function makeIdeaResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    projectSlug: "ideas",
    projectName: "Project Ideas",
    itemId: "i_abc12",
    title: "Search feature idea",
    description: "Build a search system for cross-project discovery",
    status: "not-started",
    type: "idea",
    link: "/ideas",
    ...overrides,
  };
}

describe("SearchResultCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders result title", () => {
    render(<SearchResultCard result={makeRoadmapResult()} />);
    expect(screen.getByText("Build search feature")).toBeInTheDocument();
  });

  it("renders result description", () => {
    render(<SearchResultCard result={makeRoadmapResult()} />);
    expect(
      screen.getByText("Implement cross-project search"),
    ).toBeInTheDocument();
  });

  it("renders project name", () => {
    render(<SearchResultCard result={makeRoadmapResult()} />);
    expect(screen.getByText("My Project")).toBeInTheDocument();
  });

  it("renders as a link to the result's link", () => {
    render(<SearchResultCard result={makeRoadmapResult()} />);
    const link = screen.getByTestId("search-result-card");
    expect(link).toHaveAttribute("href", "/project/my-project/roadmap");
  });

  it("has data-testid attribute", () => {
    render(<SearchResultCard result={makeRoadmapResult()} />);
    expect(screen.getByTestId("search-result-card")).toBeInTheDocument();
  });

  describe("roadmap result", () => {
    it("shows Planned status badge for planned item", () => {
      render(
        <SearchResultCard result={makeRoadmapResult({ status: "planned" })} />,
      );
      expect(screen.getByText("Planned")).toBeInTheDocument();
    });

    it("shows Done status badge for done item", () => {
      render(
        <SearchResultCard result={makeRoadmapResult({ status: "done" })} />,
      );
      expect(screen.getByText("Done")).toBeInTheDocument();
    });

    it("shows Active badge for in-progress item", () => {
      render(
        <SearchResultCard
          result={makeRoadmapResult({ status: "in-progress" })}
        />,
      );
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  describe("session task result", () => {
    it("shows Pending status badge for unchecked task", () => {
      render(
        <SearchResultCard result={makeSessionResult({ status: "pending" })} />,
      );
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    it("shows Done status badge for checked task", () => {
      render(
        <SearchResultCard result={makeSessionResult({ status: "done" })} />,
      );
      expect(screen.getByText("Done")).toBeInTheDocument();
    });

    it("links to session page", () => {
      render(<SearchResultCard result={makeSessionResult()} />);
      expect(screen.getByTestId("search-result-card")).toHaveAttribute(
        "href",
        "/project/my-project/session",
      );
    });
  });

  describe("idea result", () => {
    it("shows Not Started badge for not-started idea", () => {
      render(
        <SearchResultCard result={makeIdeaResult({ status: "not-started" })} />,
      );
      expect(screen.getByText("Not Started")).toBeInTheDocument();
    });

    it("shows Started badge for started idea", () => {
      render(
        <SearchResultCard result={makeIdeaResult({ status: "started" })} />,
      );
      expect(screen.getByText("Started")).toBeInTheDocument();
    });

    it("shows Complete badge for complete idea", () => {
      render(
        <SearchResultCard result={makeIdeaResult({ status: "complete" })} />,
      );
      expect(screen.getByText("Complete")).toBeInTheDocument();
    });

    it("links to /ideas page", () => {
      render(<SearchResultCard result={makeIdeaResult()} />);
      expect(screen.getByTestId("search-result-card")).toHaveAttribute(
        "href",
        "/ideas",
      );
    });

    it("renders idea title and description", () => {
      render(<SearchResultCard result={makeIdeaResult()} />);
      expect(screen.getByText("Search feature idea")).toBeInTheDocument();
      expect(
        screen.getByText("Build a search system for cross-project discovery"),
      ).toBeInTheDocument();
    });
  });
});
