import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { ClickableRoadmapStatusBadge } from "@/components/roadmap/clickable-roadmap-status-badge";
import { ReorderButtons } from "@/components/roadmap/reorder-buttons";
import { MoveCategorySelect } from "@/components/roadmap/move-category-select";

describe("ClickableRoadmapStatusBadge", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows current status", () => {
    render(
      <ClickableRoadmapStatusBadge status="planned" onStatusChange={vi.fn()} />,
    );
    expect(screen.getByText("Planned")).toBeInTheDocument();
  });

  it("opens dropdown on click", () => {
    render(
      <ClickableRoadmapStatusBadge status="planned" onStatusChange={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("calls onStatusChange with selected status", () => {
    const onStatusChange = vi.fn();
    render(
      <ClickableRoadmapStatusBadge
        status="planned"
        onStatusChange={onStatusChange}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("menuitem", { name: /Done/i }));
    expect(onStatusChange).toHaveBeenCalledWith("done");
  });

  it("shows all 4 roadmap statuses", () => {
    render(
      <ClickableRoadmapStatusBadge status="idea" onStatusChange={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("menuitem", { name: /Idea/i })).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Planned/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Active/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Done/i })).toBeInTheDocument();
  });
});

describe("ReorderButtons", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders up/down buttons", () => {
    render(
      <ReorderButtons
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        isFirst={false}
        isLast={false}
      />,
    );
    expect(
      screen.getByRole("button", { name: /move up/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /move down/i }),
    ).toBeInTheDocument();
  });

  it("calls onMoveUp when up clicked", () => {
    const onMoveUp = vi.fn();
    render(
      <ReorderButtons
        onMoveUp={onMoveUp}
        onMoveDown={vi.fn()}
        isFirst={false}
        isLast={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /move up/i }));
    expect(onMoveUp).toHaveBeenCalledTimes(1);
  });

  it("calls onMoveDown when down clicked", () => {
    const onMoveDown = vi.fn();
    render(
      <ReorderButtons
        onMoveUp={vi.fn()}
        onMoveDown={onMoveDown}
        isFirst={false}
        isLast={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /move down/i }));
    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  it("disables up for first item", () => {
    render(
      <ReorderButtons
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        isFirst={true}
        isLast={false}
      />,
    );
    expect(screen.getByRole("button", { name: /move up/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /move down/i }),
    ).not.toBeDisabled();
  });

  it("disables down for last item", () => {
    render(
      <ReorderButtons
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        isFirst={false}
        isLast={true}
      />,
    );
    expect(screen.getByRole("button", { name: /move up/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /move down/i })).toBeDisabled();
  });
});

describe("MoveCategorySelect", () => {
  const categories = [
    { title: "Features", slug: "features" },
    { title: "Bugs", slug: "bugs" },
    { title: "Tech Debt", slug: "tech-debt" },
  ];

  afterEach(() => {
    cleanup();
  });

  it("renders category options", () => {
    render(
      <MoveCategorySelect
        categories={categories}
        currentCategorySlug="features"
        onMove={vi.fn()}
      />,
    );
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    // Should have placeholder + 2 options (excluding current)
    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(3); // placeholder + bugs + tech-debt
  });

  it("calls onMove with selected category", () => {
    const onMove = vi.fn();
    render(
      <MoveCategorySelect
        categories={categories}
        currentCategorySlug="features"
        onMove={onMove}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "bugs" },
    });
    expect(onMove).toHaveBeenCalledWith("bugs");
  });

  it("excludes current category from options", () => {
    render(
      <MoveCategorySelect
        categories={categories}
        currentCategorySlug="bugs"
        onMove={vi.fn()}
      />,
    );
    const select = screen.getByRole("combobox");
    const options = Array.from(select.querySelectorAll("option"));
    const values = options.map((o) => o.getAttribute("value"));
    expect(values).not.toContain("bugs");
    expect(values).toContain("features");
    expect(values).toContain("tech-debt");
  });
});
