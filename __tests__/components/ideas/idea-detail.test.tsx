import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { IdeaDetail } from "@/components/ideas/idea-detail";
import type { IdeaItem } from "@/lib/schemas/ideas";

/** Helper to create a default IdeaItem with overrides */
function makeIdea(overrides: Partial<IdeaItem> = {}): IdeaItem {
  return {
    id: "i_abc12",
    status: "not-started",
    title: "Test Idea",
    body: "This is a test idea body.",
    ...overrides,
  };
}

describe("IdeaDetail", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the idea title", () => {
    render(<IdeaDetail idea={makeIdea({ title: "My Project Idea" })} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "My Project Idea" }),
    ).toBeInTheDocument();
  });

  it("renders the status badge", () => {
    render(<IdeaDetail idea={makeIdea({ status: "started" })} />);
    expect(screen.getByText("Started")).toBeInTheDocument();
  });

  it("renders stack tags", () => {
    render(
      <IdeaDetail
        idea={makeIdea({ stack: ["React", "TypeScript", "Python"] })}
      />,
    );
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
  });

  it("renders path link when present", () => {
    render(<IdeaDetail idea={makeIdea({ path: "/projects/my-project" })} />);
    expect(screen.getByText("/projects/my-project")).toBeInTheDocument();
    const link = screen.getByText("/projects/my-project");
    expect(link.closest("a")).toHaveAttribute(
      "href",
      "/project//projects/my-project",
    );
  });

  it("does not render path when absent", () => {
    render(<IdeaDetail idea={makeIdea({ path: undefined })} />);
    expect(screen.queryByText("Project:")).not.toBeInTheDocument();
  });

  it("renders body with #### subsection headings", () => {
    const body = `Introduction paragraph.

#### Requirements
- Must be fast
- Must be reliable

#### Design
The design should be simple.`;

    render(<IdeaDetail idea={makeIdea({ body })} />);
    expect(
      screen.getByRole("heading", { level: 4, name: "Requirements" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 4, name: "Design" }),
    ).toBeInTheDocument();
  });

  it("renders list items from body", () => {
    const body = `#### Features
- Authentication system
- Dashboard views
- API endpoints`;

    render(<IdeaDetail idea={makeIdea({ body })} />);
    expect(screen.getByText("Authentication system")).toBeInTheDocument();
    expect(screen.getByText("Dashboard views")).toBeInTheDocument();
    expect(screen.getByText("API endpoints")).toBeInTheDocument();
  });

  it("renders paragraphs in body sections", () => {
    const body = `#### Overview
This is the first paragraph about the project.

This is the second paragraph with more details.`;

    render(<IdeaDetail idea={makeIdea({ body })} />);
    expect(
      screen.getByText("This is the first paragraph about the project."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This is the second paragraph with more details."),
    ).toBeInTheDocument();
  });

  it("handles idea with no subsections (plain body text)", () => {
    const body = "Just a simple idea without any subsections or structure.";

    render(<IdeaDetail idea={makeIdea({ body })} />);
    expect(
      screen.getByText(
        "Just a simple idea without any subsections or structure.",
      ),
    ).toBeInTheDocument();
    // No h4 headings should be present
    expect(screen.queryAllByRole("heading", { level: 4 })).toHaveLength(0);
  });

  it("handles empty body gracefully", () => {
    render(<IdeaDetail idea={makeIdea({ body: "" })} />);
    // Should render title but no body content
    expect(
      screen.getByRole("heading", { level: 1, name: "Test Idea" }),
    ).toBeInTheDocument();
  });

  it("renders all three status badge variants", () => {
    const statuses = [
      { status: "not-started" as const, label: "Not Started" },
      { status: "started" as const, label: "Started" },
      { status: "complete" as const, label: "Complete" },
    ];
    for (const { status, label } of statuses) {
      const { unmount } = render(<IdeaDetail idea={makeIdea({ status })} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });
});
