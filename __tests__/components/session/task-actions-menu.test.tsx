import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { TaskActionsMenu } from "@/components/session/task-actions-menu";

describe("TaskActionsMenu", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders three-dot trigger button", () => {
    render(
      <TaskActionsMenu
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetDependency={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /task actions/i }),
    ).toBeInTheDocument();
  });

  it("shows Edit and Delete options on click", () => {
    render(
      <TaskActionsMenu
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetDependency={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /task actions/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /edit/i })).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /delete/i }),
    ).toBeInTheDocument();
  });

  it("shows Set Dependency option on click", () => {
    render(
      <TaskActionsMenu
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetDependency={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /task actions/i }));
    expect(
      screen.getByRole("menuitem", { name: /set dependency/i }),
    ).toBeInTheDocument();
  });

  it("calls onEdit when Edit clicked", () => {
    const onEdit = vi.fn();
    render(
      <TaskActionsMenu
        onEdit={onEdit}
        onDelete={vi.fn()}
        onSetDependency={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /task actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete when Delete clicked", () => {
    const onDelete = vi.fn();
    render(
      <TaskActionsMenu
        onEdit={vi.fn()}
        onDelete={onDelete}
        onSetDependency={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /task actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("calls onSetDependency when Set Dependency clicked", () => {
    const onSetDependency = vi.fn();
    render(
      <TaskActionsMenu
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetDependency={onSetDependency}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /task actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /set dependency/i }));
    expect(onSetDependency).toHaveBeenCalledTimes(1);
  });

  it("closes menu after action", () => {
    render(
      <TaskActionsMenu
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetDependency={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /task actions/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem", { name: /edit/i }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
