import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { IdeasGrid } from "@/components/ideas/ideas-grid";
import type { IdeaItem } from "@/lib/schemas/ideas";

/** Helper to create a default IdeaItem with overrides */
function makeIdea(overrides: Partial<IdeaItem> = {}): IdeaItem {
  return {
    id: "i_abc12",
    status: "not-started",
    title: "Test Idea",
    body: "A body for the test idea.",
    ...overrides,
  };
}

/** Standard test dataset with one of each status */
const testIdeas: IdeaItem[] = [
  makeIdea({
    id: "i_aaa01",
    title: "Dashboard Redesign",
    body: "Redesign the project dashboard with new layout.",
    status: "not-started",
    stack: ["React", "Tailwind"],
  }),
  makeIdea({
    id: "i_bbb02",
    title: "CLI Tool",
    body: "Build a command-line interface for data export.",
    status: "started",
    stack: ["Go"],
  }),
  makeIdea({
    id: "i_ccc03",
    title: "API Gateway",
    body: "Implement an API gateway with rate limiting.",
    status: "complete",
    stack: ["Node.js"],
  }),
];

describe("IdeasGrid", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders all idea cards when no filter is active", () => {
    render(<IdeasGrid ideas={testIdeas} />);
    expect(screen.getByText("Dashboard Redesign")).toBeInTheDocument();
    expect(screen.getByText("CLI Tool")).toBeInTheDocument();
    expect(screen.getByText("API Gateway")).toBeInTheDocument();
  });

  it("filters by not-started status", () => {
    render(<IdeasGrid ideas={testIdeas} />);
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "not-started" },
    });
    expect(screen.getByText("Dashboard Redesign")).toBeInTheDocument();
    expect(screen.queryByText("CLI Tool")).not.toBeInTheDocument();
    expect(screen.queryByText("API Gateway")).not.toBeInTheDocument();
  });

  it("filters by started status", () => {
    render(<IdeasGrid ideas={testIdeas} />);
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "started" },
    });
    expect(screen.queryByText("Dashboard Redesign")).not.toBeInTheDocument();
    expect(screen.getByText("CLI Tool")).toBeInTheDocument();
    expect(screen.queryByText("API Gateway")).not.toBeInTheDocument();
  });

  it("filters by complete status", () => {
    render(<IdeasGrid ideas={testIdeas} />);
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "complete" },
    });
    expect(screen.queryByText("Dashboard Redesign")).not.toBeInTheDocument();
    expect(screen.queryByText("CLI Tool")).not.toBeInTheDocument();
    expect(screen.getByText("API Gateway")).toBeInTheDocument();
  });

  it("'all' filter shows all ideas", () => {
    render(<IdeasGrid ideas={testIdeas} />);
    // First filter to something, then back to all
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "started" },
    });
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "all" },
    });
    expect(screen.getByText("Dashboard Redesign")).toBeInTheDocument();
    expect(screen.getByText("CLI Tool")).toBeInTheDocument();
    expect(screen.getByText("API Gateway")).toBeInTheDocument();
  });

  it("searches by title (case-insensitive)", () => {
    render(<IdeasGrid ideas={testIdeas} />);
    fireEvent.change(screen.getByPlaceholderText("Search ideas..."), {
      target: { value: "cli" },
    });
    expect(screen.queryByText("Dashboard Redesign")).not.toBeInTheDocument();
    expect(screen.getByText("CLI Tool")).toBeInTheDocument();
    expect(screen.queryByText("API Gateway")).not.toBeInTheDocument();
  });

  it("searches by body text (case-insensitive)", () => {
    render(<IdeasGrid ideas={testIdeas} />);
    fireEvent.change(screen.getByPlaceholderText("Search ideas..."), {
      target: { value: "rate limiting" },
    });
    expect(screen.queryByText("Dashboard Redesign")).not.toBeInTheDocument();
    expect(screen.queryByText("CLI Tool")).not.toBeInTheDocument();
    expect(screen.getByText("API Gateway")).toBeInTheDocument();
  });

  it("combined filter and search narrows results", () => {
    render(<IdeasGrid ideas={testIdeas} />);
    fireEvent.change(screen.getByLabelText("Filter by status"), {
      target: { value: "not-started" },
    });
    fireEvent.change(screen.getByPlaceholderText("Search ideas..."), {
      target: { value: "nonexistent" },
    });
    expect(screen.getByText("No ideas found")).toBeInTheDocument();
  });

  it("shows empty state when no ideas match filter", () => {
    render(<IdeasGrid ideas={testIdeas} />);
    fireEvent.change(screen.getByPlaceholderText("Search ideas..."), {
      target: { value: "zzzznotfound" },
    });
    expect(screen.getByText("No ideas found")).toBeInTheDocument();
  });

  it("shows empty state when ideas array is empty", () => {
    render(<IdeasGrid ideas={[]} />);
    expect(screen.getByText("No ideas found")).toBeInTheDocument();
  });
});
