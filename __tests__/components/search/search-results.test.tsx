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

import { SearchResultsView } from "@/components/search/search-results";
import type { SearchResults, SearchResult } from "@/lib/actions/search-actions";

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
    title: "Implement search UI",
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
    description: "Build a search system",
    status: "not-started",
    type: "idea",
    link: "/ideas",
    ...overrides,
  };
}

const emptyResults: SearchResults = {
  roadmapItems: [],
  sessionTasks: [],
  ideas: [],
};

describe("SearchResultsView", () => {
  afterEach(() => {
    cleanup();
  });

  describe("empty state", () => {
    it("shows empty state when no results", () => {
      render(<SearchResultsView results={emptyResults} query="foobar" />);
      expect(screen.getByTestId("search-empty-state")).toBeInTheDocument();
    });

    it("shows the searched query in empty state", () => {
      render(<SearchResultsView results={emptyResults} query="foobar" />);
      expect(screen.getByText(/foobar/)).toBeInTheDocument();
    });

    it("does not show result groups when empty", () => {
      render(<SearchResultsView results={emptyResults} query="foobar" />);
      expect(
        screen.queryByTestId("search-section-roadmapItems"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("search-section-sessionTasks"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("search-section-ideas"),
      ).not.toBeInTheDocument();
    });
  });

  describe("with results", () => {
    it("shows search-results container when there are results", () => {
      render(
        <SearchResultsView
          results={{
            roadmapItems: [makeRoadmapResult()],
            sessionTasks: [],
            ideas: [],
          }}
          query="search"
        />,
      );
      expect(screen.getByTestId("search-results")).toBeInTheDocument();
    });

    it("shows result count", () => {
      render(
        <SearchResultsView
          results={{
            roadmapItems: [makeRoadmapResult()],
            sessionTasks: [makeSessionResult()],
            ideas: [],
          }}
          query="search"
        />,
      );
      expect(screen.getByText(/2 results/)).toBeInTheDocument();
    });

    it("shows '1 result' (singular) for a single result", () => {
      render(
        <SearchResultsView
          results={{
            roadmapItems: [makeRoadmapResult()],
            sessionTasks: [],
            ideas: [],
          }}
          query="search"
        />,
      );
      expect(screen.getByText(/1 result/)).toBeInTheDocument();
    });

    it("renders roadmap items section when present", () => {
      render(
        <SearchResultsView
          results={{
            roadmapItems: [makeRoadmapResult()],
            sessionTasks: [],
            ideas: [],
          }}
          query="search"
        />,
      );
      expect(
        screen.getByTestId("search-section-roadmapItems"),
      ).toBeInTheDocument();
      expect(screen.getByText("Roadmap Items")).toBeInTheDocument();
    });

    it("renders session tasks section when present", () => {
      render(
        <SearchResultsView
          results={{
            roadmapItems: [],
            sessionTasks: [makeSessionResult()],
            ideas: [],
          }}
          query="search"
        />,
      );
      expect(
        screen.getByTestId("search-section-sessionTasks"),
      ).toBeInTheDocument();
      expect(screen.getByText("Session Tasks")).toBeInTheDocument();
    });

    it("renders ideas section when present", () => {
      render(
        <SearchResultsView
          results={{
            roadmapItems: [],
            sessionTasks: [],
            ideas: [makeIdeaResult()],
          }}
          query="search"
        />,
      );
      expect(screen.getByTestId("search-section-ideas")).toBeInTheDocument();
      expect(screen.getByText("Ideas")).toBeInTheDocument();
    });

    it("omits empty sections", () => {
      render(
        <SearchResultsView
          results={{
            roadmapItems: [makeRoadmapResult()],
            sessionTasks: [],
            ideas: [],
          }}
          query="search"
        />,
      );
      expect(
        screen.queryByTestId("search-section-sessionTasks"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("search-section-ideas"),
      ).not.toBeInTheDocument();
    });

    it("shows item count next to section heading", () => {
      render(
        <SearchResultsView
          results={{
            roadmapItems: [
              makeRoadmapResult({ itemId: "r_aaa11" }),
              makeRoadmapResult({ itemId: "r_bbb22" }),
            ],
            sessionTasks: [],
            ideas: [],
          }}
          query="search"
        />,
      );
      // The section heading shows "(2)"
      expect(screen.getByText("(2)")).toBeInTheDocument();
    });

    it("renders all result cards within each section", () => {
      render(
        <SearchResultsView
          results={{
            roadmapItems: [
              makeRoadmapResult({ itemId: "r_aaa11", title: "Item One" }),
              makeRoadmapResult({ itemId: "r_bbb22", title: "Item Two" }),
            ],
            sessionTasks: [],
            ideas: [],
          }}
          query="search"
        />,
      );
      expect(screen.getByText("Item One")).toBeInTheDocument();
      expect(screen.getByText("Item Two")).toBeInTheDocument();
    });

    it("renders all three sections when all have results", () => {
      render(
        <SearchResultsView
          results={{
            roadmapItems: [makeRoadmapResult()],
            sessionTasks: [makeSessionResult()],
            ideas: [makeIdeaResult()],
          }}
          query="search"
        />,
      );
      expect(
        screen.getByTestId("search-section-roadmapItems"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("search-section-sessionTasks"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("search-section-ideas")).toBeInTheDocument();
    });
  });
});
