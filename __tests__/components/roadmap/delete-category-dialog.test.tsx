import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { DeleteCategoryDialog } from "@/components/roadmap/delete-category-dialog";

describe("DeleteCategoryDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders delete category button", () => {
    render(
      <DeleteCategoryDialog
        categoryName="Features"
        itemCount={3}
        onConfirm={vi.fn()}
      />,
    );
    const trigger = screen.getByRole("button", { name: /delete/i });
    expect(trigger).toBeInTheDocument();
  });

  it("shows confirmation with category name and item count", () => {
    render(
      <DeleteCategoryDialog
        categoryName="Features"
        itemCount={5}
        onConfirm={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByText(/Features/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it("calls onConfirm when confirmed", () => {
    const onConfirm = vi.fn();
    render(
      <DeleteCategoryDialog
        categoryName="Features"
        itemCount={3}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    const confirmBtn = screen.getByRole("button", { name: /^delete$/i });
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("closes on cancel", () => {
    render(
      <DeleteCategoryDialog
        categoryName="Features"
        itemCount={3}
        onConfirm={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("warns about item deletion", () => {
    render(
      <DeleteCategoryDialog
        categoryName="Features"
        itemCount={3}
        onConfirm={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByText(/3 items/i)).toBeInTheDocument();
  });

  it("shows empty category message when itemCount is 0", () => {
    render(
      <DeleteCategoryDialog
        categoryName="Backlog"
        itemCount={0}
        onConfirm={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByText(/empty category/i)).toBeInTheDocument();
  });
});
