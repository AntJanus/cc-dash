import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { IdeaCard } from "@/components/ideas/idea-card";
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

describe("IdeaCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the idea title", () => {
    render(<IdeaCard idea={makeIdea({ title: "My Cool Idea" })} />);
    expect(screen.getByText("My Cool Idea")).toBeInTheDocument();
  });

  it("renders the status badge", () => {
    render(<IdeaCard idea={makeIdea({ status: "started" })} />);
    expect(screen.getByText("Started")).toBeInTheDocument();
  });

  it("renders status badge for each status variant", () => {
    const statuses = [
      { status: "not-started" as const, label: "Not Started" },
      { status: "started" as const, label: "Started" },
      { status: "complete" as const, label: "Complete" },
    ];
    for (const { status, label } of statuses) {
      const { unmount } = render(<IdeaCard idea={makeIdea({ status })} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it("renders stack tags as pills", () => {
    render(
      <IdeaCard idea={makeIdea({ stack: ["React", "TypeScript", "Go"] })} />,
    );
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();
  });

  it("does not render stack section when stack is undefined", () => {
    render(<IdeaCard idea={makeIdea({ stack: undefined })} />);
    // No stack tags should be present
    expect(screen.queryByText("React")).not.toBeInTheDocument();
  });

  it("does not render stack section when stack is empty", () => {
    render(<IdeaCard idea={makeIdea({ stack: [] })} />);
    expect(screen.queryByText("React")).not.toBeInTheDocument();
  });

  it("renders description teaser from first non-empty body line", () => {
    render(
      <IdeaCard
        idea={makeIdea({
          body: "\n\nFirst real line of content.\nSecond line.",
        })}
      />,
    );
    expect(screen.getByText("First real line of content.")).toBeInTheDocument();
  });

  it("truncates teaser to 120 chars with ellipsis", () => {
    const longBody = "A".repeat(150);
    render(<IdeaCard idea={makeIdea({ body: longBody })} />);
    const teaser = screen.getByText(/^A+\.\.\.$/);
    expect(teaser).toBeInTheDocument();
    // 120 chars + "..."
    expect(teaser.textContent).toHaveLength(123);
  });

  it("renders path when present", () => {
    render(<IdeaCard idea={makeIdea({ path: "/projects/my-project" })} />);
    expect(screen.getByText("/projects/my-project")).toBeInTheDocument();
  });

  it("does not render path when absent", () => {
    render(<IdeaCard idea={makeIdea({ path: undefined })} />);
    expect(screen.queryByText("/projects/my-project")).not.toBeInTheDocument();
  });

  it("links to the idea detail page", () => {
    render(<IdeaCard idea={makeIdea({ id: "i_xyz99" })} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/ideas/i_xyz99");
  });
});
