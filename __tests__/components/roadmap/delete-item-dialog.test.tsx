import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { DeleteItemDialog } from "@/components/roadmap/delete-item-dialog";

describe("DeleteItemDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders delete button trigger", () => {
    render(<DeleteItemDialog itemName="Test Item" onConfirm={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: /delete/i });
    expect(trigger).toBeInTheDocument();
  });

  it("shows confirmation dialog on click", () => {
    render(<DeleteItemDialog itemName="Test Item" onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("calls onConfirm when delete action clicked", () => {
    const onConfirm = vi.fn();
    render(<DeleteItemDialog itemName="Test Item" onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    // Click the confirm delete button in the dialog
    const confirmBtn = screen.getByRole("button", { name: /^delete$/i });
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("closes dialog on cancel", () => {
    render(<DeleteItemDialog itemName="Test Item" onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows item name in confirmation message", () => {
    render(
      <DeleteItemDialog itemName="My Important Item" onConfirm={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByText(/My Important Item/)).toBeInTheDocument();
  });
});
