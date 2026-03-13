import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { RoadmapView } from "@/components/roadmap/roadmap-view";
import type { RoadmapFile } from "@/lib/schemas/roadmap";

// Mock all 6 server actions
const {
  mockAddItem,
  mockUpdateItem,
  mockDeleteItem,
  mockReorderItems,
  mockAddCategory,
  mockDeleteCategory,
} = vi.hoisted(() => ({
  mockAddItem: vi.fn(),
  mockUpdateItem: vi.fn(),
  mockDeleteItem: vi.fn(),
  mockReorderItems: vi.fn(),
  mockAddCategory: vi.fn(),
  mockDeleteCategory: vi.fn(),
}));

vi.mock("@/lib/actions/roadmap-actions", () => ({
  addRoadmapItem: mockAddItem,
  updateRoadmapItem: mockUpdateItem,
  deleteRoadmapItem: mockDeleteItem,
  reorderRoadmapItems: mockReorderItems,
  addRoadmapCategory: mockAddCategory,
  deleteRoadmapCategory: mockDeleteCategory,
}));

function makeRoadmap(overrides: Partial<RoadmapFile> = {}): RoadmapFile {
  return {
    schema: "cc-dash/roadmap@1",
    project: "test-project",
    description: "A test project",
    last_updated: "2026-03-01T12:00:00-07:00",
    categories: [
      {
        title: "Core Features",
        slug: "core",
        items: [
          {
            id: "r_abc12",
            status: "planned",
            name: "Feature A",
            description: "First feature",
            started: "2026-02-01",
          },
          {
            id: "r_def34",
            status: "done",
            name: "Feature B",
            description: "Second feature",
            completed: "2026-02-15",
          },
        ],
      },
      {
        title: "Extra Features",
        slug: "extra",
        items: [
          {
            id: "r_ghi56",
            status: "in-progress",
            name: "Feature C",
            description: "Third feature",
            started: "2026-03-01",
            depends: ["r_abc12"],
          },
        ],
      },
    ],
    filePath: "/projects/test/ROADMAP.md",
    ...overrides,
  };
}

const defaultSessionRefs: Record<string, string> = {};

function renderCrudView(overrides: Partial<RoadmapFile> = {}) {
  return render(
    <RoadmapView
      roadmap={makeRoadmap(overrides)}
      sessionRefs={defaultSessionRefs}
      slug="test-project"
    />,
  );
}

describe("RoadmapViewCrud", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders roadmap view with CRUD controls", () => {
    renderCrudView();
    // Switch to list view where CRUD controls are visible
    fireEvent.click(screen.getByRole("tab", { name: /list/i }));

    // Should have "Add item" buttons (one per category)
    const addButtons = screen.getAllByRole("button", { name: /add item/i });
    expect(addButtons.length).toBeGreaterThanOrEqual(2);

    // Should have "Add category" button
    expect(
      screen.getByRole("button", { name: /add category/i }),
    ).toBeInTheDocument();
  });

  it("add item button opens form", () => {
    renderCrudView();
    fireEvent.click(screen.getByRole("tab", { name: /list/i }));

    // Click the first "Add item" button
    const addButtons = screen.getAllByRole("button", { name: /add item/i });
    fireEvent.click(addButtons[0]);

    // Form should appear with name input and submit button
    expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Add$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("edit inline saves changes", async () => {
    mockUpdateItem.mockResolvedValue({ success: true, data: undefined });

    renderCrudView();
    fireEvent.click(screen.getByRole("tab", { name: /list/i }));

    // Click on "Feature A" text to enter edit mode
    fireEvent.click(screen.getByText("Feature A"));

    // Should now show an input with the value
    const input = screen.getByDisplayValue("Feature A");
    expect(input).toBeInTheDocument();

    // Change value and press Enter
    fireEvent.change(input, { target: { value: "Feature A Updated" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Server action should have been called
    expect(mockUpdateItem).toHaveBeenCalledWith("test-project", "r_abc12", {
      name: "Feature A Updated",
    });
  });

  it("delete item shows confirmation", () => {
    renderCrudView();
    fireEvent.click(screen.getByRole("tab", { name: /list/i }));

    // Find delete buttons (trash icons)
    const deleteButtons = screen.getAllByRole("button", {
      name: /delete item/i,
    });
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);

    // Click first delete button
    fireEvent.click(deleteButtons[0]);

    // Confirmation dialog should appear
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/Delete "Feature A"\?/)).toBeInTheDocument();
  });

  it("status badge changes status", async () => {
    mockUpdateItem.mockResolvedValue({ success: true, data: undefined });

    renderCrudView();
    fireEvent.click(screen.getByRole("tab", { name: /list/i }));

    // Find the "Planned" badge for Feature A and click it
    const plannedBadge = screen.getByText("Planned");
    fireEvent.click(plannedBadge);

    // Dropdown should appear with status options
    expect(screen.getByRole("menu")).toBeInTheDocument();

    // Click "Done"
    fireEvent.click(screen.getByRole("menuitem", { name: /Done/i }));

    // Server action should be called with status update
    expect(mockUpdateItem).toHaveBeenCalledWith("test-project", "r_abc12", {
      status: "done",
    });
  });

  it("reorder buttons move items", async () => {
    mockReorderItems.mockResolvedValue({ success: true, data: undefined });

    renderCrudView();
    fireEvent.click(screen.getByRole("tab", { name: /list/i }));

    // Feature A is first in "Core Features" so its up should be disabled
    const moveUpButtons = screen.getAllByRole("button", { name: /move up/i });
    const moveDownButtons = screen.getAllByRole("button", {
      name: /move down/i,
    });

    // At least 2 items in "Core Features" category
    expect(moveUpButtons.length).toBeGreaterThanOrEqual(2);
    expect(moveDownButtons.length).toBeGreaterThanOrEqual(2);

    // First item's up button should be disabled
    expect(moveUpButtons[0]).toBeDisabled();

    // Click "move down" on first item
    fireEvent.click(moveDownButtons[0]);

    // Reorder action should be called
    expect(mockReorderItems).toHaveBeenCalledWith("test-project", "core", [
      "r_def34",
      "r_abc12",
    ]);
  });

  it("category can be added", async () => {
    mockAddCategory.mockResolvedValue({
      success: true,
      data: { slug: "new-category" },
    });

    renderCrudView();
    fireEvent.click(screen.getByRole("tab", { name: /list/i }));

    // Find the "Add category" button and click it
    fireEvent.click(screen.getByRole("button", { name: /add category/i }));

    // Input should appear
    const input = screen.getByPlaceholderText("Category name");
    fireEvent.change(input, { target: { value: "New Category" } });

    // Submit via the confirm button
    fireEvent.click(screen.getByRole("button", { name: /^Create$/i }));

    // Server action should be called
    expect(mockAddCategory).toHaveBeenCalledWith(
      "test-project",
      "New Category",
    );
  });

  it("category can be deleted", async () => {
    mockDeleteCategory.mockResolvedValue({ success: true, data: undefined });

    renderCrudView();
    fireEvent.click(screen.getByRole("tab", { name: /list/i }));

    // Find delete category buttons
    const deleteCategoryButtons = screen.getAllByRole("button", {
      name: /delete category/i,
    });
    expect(deleteCategoryButtons.length).toBeGreaterThanOrEqual(1);

    // Click the first delete category button
    fireEvent.click(deleteCategoryButtons[0]);

    // Confirmation dialog should appear with category name
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(
      screen.getByText(/Delete category "Core Features"\?/),
    ).toBeInTheDocument();
  });
});
