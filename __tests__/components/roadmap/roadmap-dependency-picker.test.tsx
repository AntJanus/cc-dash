import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { RoadmapDependencyPicker } from "@/components/roadmap/roadmap-dependency-picker";
import { RoadmapCard } from "@/components/roadmap/roadmap-card";
import type { BoardItem } from "@/components/roadmap/roadmap-board";

const allItems = [
  { id: "r_aaa01", name: "Feature Alpha" },
  { id: "r_bbb02", name: "Feature Beta" },
  { id: "r_ccc03", name: "Feature Gamma" },
  { id: "r_ddd04", name: "Feature Delta" },
];

describe("RoadmapDependencyPicker", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders checkbox for each available item", () => {
    render(
      <RoadmapDependencyPicker
        currentItemId="r_aaa01"
        currentDeps={[]}
        allItems={allItems}
        onChange={vi.fn()}
      />,
    );
    // Should show 3 checkboxes (all except current item)
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
  });

  it("excludes current item from options", () => {
    render(
      <RoadmapDependencyPicker
        currentItemId="r_bbb02"
        currentDeps={[]}
        allItems={allItems}
        onChange={vi.fn()}
      />,
    );
    // Feature Beta should not appear as an option
    expect(screen.queryByText("Feature Beta")).not.toBeInTheDocument();
    // The other 3 should appear
    expect(screen.getByText("Feature Alpha")).toBeInTheDocument();
    expect(screen.getByText("Feature Gamma")).toBeInTheDocument();
    expect(screen.getByText("Feature Delta")).toBeInTheDocument();
  });

  it("checks items that are in currentDeps", () => {
    render(
      <RoadmapDependencyPicker
        currentItemId="r_aaa01"
        currentDeps={["r_bbb02", "r_ddd04"]}
        allItems={allItems}
        onChange={vi.fn()}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    // Beta and Delta should be checked; Gamma should not
    const betaCheckbox = checkboxes.find((cb) =>
      cb.closest("label")?.textContent?.includes("Feature Beta"),
    ) as HTMLInputElement;
    const gammaCheckbox = checkboxes.find((cb) =>
      cb.closest("label")?.textContent?.includes("Feature Gamma"),
    ) as HTMLInputElement;
    const deltaCheckbox = checkboxes.find((cb) =>
      cb.closest("label")?.textContent?.includes("Feature Delta"),
    ) as HTMLInputElement;

    expect(betaCheckbox.checked).toBe(true);
    expect(gammaCheckbox.checked).toBe(false);
    expect(deltaCheckbox.checked).toBe(true);
  });

  it("calls onChange with added dep when checkbox checked", () => {
    const onChange = vi.fn();
    render(
      <RoadmapDependencyPicker
        currentItemId="r_aaa01"
        currentDeps={["r_bbb02"]}
        allItems={allItems}
        onChange={onChange}
      />,
    );
    // Find Gamma checkbox and click it
    const checkboxes = screen.getAllByRole("checkbox");
    const gammaCheckbox = checkboxes.find((cb) =>
      cb.closest("label")?.textContent?.includes("Feature Gamma"),
    ) as HTMLInputElement;

    fireEvent.click(gammaCheckbox);
    expect(onChange).toHaveBeenCalledWith(["r_bbb02", "r_ccc03"]);
  });

  it("calls onChange with removed dep when checkbox unchecked", () => {
    const onChange = vi.fn();
    render(
      <RoadmapDependencyPicker
        currentItemId="r_aaa01"
        currentDeps={["r_bbb02", "r_ccc03"]}
        allItems={allItems}
        onChange={onChange}
      />,
    );
    // Find Beta checkbox and uncheck it
    const checkboxes = screen.getAllByRole("checkbox");
    const betaCheckbox = checkboxes.find((cb) =>
      cb.closest("label")?.textContent?.includes("Feature Beta"),
    ) as HTMLInputElement;

    fireEvent.click(betaCheckbox);
    expect(onChange).toHaveBeenCalledWith(["r_ccc03"]);
  });

  it("shows item name as label", () => {
    render(
      <RoadmapDependencyPicker
        currentItemId="r_aaa01"
        currentDeps={[]}
        allItems={allItems}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Feature Beta")).toBeInTheDocument();
    expect(screen.getByText("Feature Gamma")).toBeInTheDocument();
    expect(screen.getByText("Feature Delta")).toBeInTheDocument();
  });

  it("truncates long item names at 40 chars", () => {
    const longItems = [
      { id: "r_aaa01", name: "Short" },
      {
        id: "r_long1",
        name: "This is a very long feature name that exceeds forty characters",
      },
    ];
    render(
      <RoadmapDependencyPicker
        currentItemId="r_aaa01"
        currentDeps={[]}
        allItems={longItems}
        onChange={vi.fn()}
      />,
    );
    // Should truncate at 40 chars with "..."
    expect(
      screen.getByText("This is a very long feature name that ex..."),
    ).toBeInTheDocument();
  });

  it("shows empty state when no other items exist", () => {
    render(
      <RoadmapDependencyPicker
        currentItemId="r_aaa01"
        currentDeps={[]}
        allItems={[{ id: "r_aaa01", name: "Only Item" }]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("No other items available")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});

describe("RoadmapCard dependency picker stays open on toggle", () => {
  afterEach(() => {
    cleanup();
  });

  const testItem: BoardItem = {
    id: "r_aaa01",
    name: "Feature Alpha",
    description: "An alpha feature",
    status: "planned",
    categorySlug: "core",
    categoryTitle: "Core Features",
    depends: [],
  };

  it("keeps dependency picker open after checking a checkbox", () => {
    const onUpdateItem = vi.fn();
    render(
      <RoadmapCard
        item={testItem}
        sessionRefs={{}}
        itemNames={{ r_aaa01: "Feature Alpha", r_bbb02: "Feature Beta" }}
        allItems={allItems}
        onUpdateItem={onUpdateItem}
        onDeleteItem={vi.fn()}
      />,
    );

    // Open the actions menu
    const menuButton = screen.getByRole("button", { name: /actions/i });
    fireEvent.click(menuButton);

    // Click "Dependencies" menu item
    const depMenuItem = screen.getByRole("menuitem", {
      name: /dependencies/i,
    });
    fireEvent.click(depMenuItem);

    // Picker should be open
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);

    // Check a checkbox
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);

    // Picker should STILL be open after toggle (bug fix: not closing on each change)
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
  });

  it("shows Done button instead of Cancel to close the picker", () => {
    const onUpdateItem = vi.fn();
    render(
      <RoadmapCard
        item={testItem}
        sessionRefs={{}}
        itemNames={{ r_aaa01: "Feature Alpha", r_bbb02: "Feature Beta" }}
        allItems={allItems}
        onUpdateItem={onUpdateItem}
        onDeleteItem={vi.fn()}
      />,
    );

    // Open the actions menu
    const menuButton = screen.getByRole("button", { name: /actions/i });
    fireEvent.click(menuButton);

    // Click "Dependencies" menu item
    const depMenuItem = screen.getByRole("menuitem", {
      name: /dependencies/i,
    });
    fireEvent.click(depMenuItem);

    // Should show "Done" button, not "Cancel"
    expect(screen.getByRole("button", { name: /done/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^cancel$/i }),
    ).not.toBeInTheDocument();
  });

  it("closes the picker when Done button is clicked", () => {
    const onUpdateItem = vi.fn();
    render(
      <RoadmapCard
        item={testItem}
        sessionRefs={{}}
        itemNames={{ r_aaa01: "Feature Alpha", r_bbb02: "Feature Beta" }}
        allItems={allItems}
        onUpdateItem={onUpdateItem}
        onDeleteItem={vi.fn()}
      />,
    );

    // Open the actions menu
    const menuButton = screen.getByRole("button", { name: /actions/i });
    fireEvent.click(menuButton);

    // Click "Dependencies" menu item
    const depMenuItem = screen.getByRole("menuitem", {
      name: /dependencies/i,
    });
    fireEvent.click(depMenuItem);

    // Click Done
    fireEvent.click(screen.getByRole("button", { name: /done/i }));

    // Picker should be closed (no checkboxes visible)
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
