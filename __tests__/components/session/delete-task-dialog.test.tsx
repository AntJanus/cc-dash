import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { DeleteTaskDialog } from "@/components/session/delete-task-dialog";

describe("DeleteTaskDialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders delete button trigger", () => {
    render(
      <DeleteTaskDialog
        taskDescription="Set up database"
        onConfirm={vi.fn()}
      />,
    );
    const trigger = screen.getByRole("button", { name: /delete/i });
    expect(trigger).toBeInTheDocument();
  });

  it("shows confirmation dialog on trigger click", () => {
    render(
      <DeleteTaskDialog
        taskDescription="Set up database"
        onConfirm={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("shows task description in confirmation message", () => {
    render(
      <DeleteTaskDialog
        taskDescription="Set up database"
        onConfirm={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByText(/Set up database/)).toBeInTheDocument();
  });

  it("calls onConfirm when Delete button clicked", () => {
    const onConfirm = vi.fn();
    render(
      <DeleteTaskDialog
        taskDescription="Set up database"
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    const confirmBtn = screen.getByRole("button", { name: /^delete$/i });
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("closes dialog on Cancel", () => {
    render(
      <DeleteTaskDialog
        taskDescription="Set up database"
        onConfirm={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("closes dialog after confirming deletion", () => {
    render(
      <DeleteTaskDialog
        taskDescription="Set up database"
        onConfirm={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
