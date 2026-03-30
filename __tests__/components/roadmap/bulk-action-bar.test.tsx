import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { BulkActionBar } from "@/components/roadmap/bulk-action-bar";
import type { RoadmapCategory } from "@/lib/schemas/roadmap";

// --- Test fixtures ---

const twoCategories: RoadmapCategory[] = [
  {
    title: "Core Features",
    slug: "core-features",
    items: [
      {
        id: "r_abc12",
        status: "planned",
        name: "Feature A",
        description: "First feature",
      },
    ],
  },
  {
    title: "Nice to Have",
    slug: "nice-to-have",
    items: [
      {
        id: "r_def34",
        status: "idea",
        name: "Feature B",
        description: "Second feature",
      },
    ],
  },
];

const oneCategory: RoadmapCategory[] = [
  {
    title: "Core Features",
    slug: "core-features",
    items: [
      {
        id: "r_abc12",
        status: "planned",
        name: "Feature A",
        description: "First feature",
      },
    ],
  },
];

const defaultProps = {
  selectedCount: 2,
  categories: twoCategories,
  onChangeStatus: vi.fn().mockResolvedValue(undefined),
  onMoveToCategory: vi.fn().mockResolvedValue(undefined),
  onDelete: vi.fn(),
  onClearSelection: vi.fn(),
};

// --- Tests ---

describe("BulkActionBar", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders nothing when selectedCount is 0", () => {
    render(<BulkActionBar {...defaultProps} selectedCount={0} />);
    expect(screen.queryByTestId("bulk-action-bar")).not.toBeInTheDocument();
  });

  it("renders the bar when selectedCount > 0", () => {
    render(<BulkActionBar {...defaultProps} />);
    expect(screen.getByTestId("bulk-action-bar")).toBeInTheDocument();
  });

  it("shows singular item label when count is 1", () => {
    render(<BulkActionBar {...defaultProps} selectedCount={1} />);
    expect(screen.getByText("1 item selected")).toBeInTheDocument();
  });

  it("shows plural items label when count is > 1", () => {
    render(<BulkActionBar {...defaultProps} selectedCount={3} />);
    expect(screen.getByText("3 items selected")).toBeInTheDocument();
  });

  it("renders Change Status button", () => {
    render(<BulkActionBar {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /change status/i }),
    ).toBeInTheDocument();
  });

  it("renders Delete button", () => {
    render(<BulkActionBar {...defaultProps} />);
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("renders dismiss/clear selection button", () => {
    render(<BulkActionBar {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /clear selection/i }),
    ).toBeInTheDocument();
  });

  it("calls onClearSelection when dismiss button is clicked", () => {
    render(<BulkActionBar {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /clear selection/i }));
    expect(defaultProps.onClearSelection).toHaveBeenCalledOnce();
  });

  it("calls onDelete when Delete button is clicked", () => {
    render(<BulkActionBar {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(defaultProps.onDelete).toHaveBeenCalledOnce();
  });

  it("opens status menu when Change Status button is clicked", () => {
    render(<BulkActionBar {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /change status/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /planned/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /in progress/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /done/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /idea/i })).toBeInTheDocument();
  });

  it("calls onChangeStatus with correct status when menu item clicked", () => {
    render(<BulkActionBar {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /change status/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /done/i }));
    expect(defaultProps.onChangeStatus).toHaveBeenCalledWith("done");
  });

  it("calls onChangeStatus with in-progress when In Progress is clicked", () => {
    render(<BulkActionBar {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /change status/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /in progress/i }));
    expect(defaultProps.onChangeStatus).toHaveBeenCalledWith("in-progress");
  });

  it("renders Move to Category button when 2+ categories exist", () => {
    render(<BulkActionBar {...defaultProps} categories={twoCategories} />);
    expect(
      screen.getByRole("button", { name: /move to category/i }),
    ).toBeInTheDocument();
  });

  it("does not render Move to Category button when only 1 category", () => {
    render(<BulkActionBar {...defaultProps} categories={oneCategory} />);
    expect(
      screen.queryByRole("button", { name: /move to category/i }),
    ).not.toBeInTheDocument();
  });

  it("opens category menu when Move to Category button is clicked", () => {
    render(<BulkActionBar {...defaultProps} categories={twoCategories} />);
    fireEvent.click(screen.getByRole("button", { name: /move to category/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /core features/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /nice to have/i }),
    ).toBeInTheDocument();
  });

  it("calls onMoveToCategory with correct slug when category menu item clicked", () => {
    render(<BulkActionBar {...defaultProps} categories={twoCategories} />);
    fireEvent.click(screen.getByRole("button", { name: /move to category/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /nice to have/i }));
    expect(defaultProps.onMoveToCategory).toHaveBeenCalledWith("nice-to-have");
  });

  it("closes status menu after selecting an option", () => {
    render(<BulkActionBar {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /change status/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /done/i }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("has toolbar role for accessibility", () => {
    render(<BulkActionBar {...defaultProps} />);
    expect(
      screen.getByRole("toolbar", { name: /bulk actions/i }),
    ).toBeInTheDocument();
  });
});
