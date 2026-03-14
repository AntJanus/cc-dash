import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { TaskSection } from "@/components/session/task-section";
import type { SessionTask } from "@/lib/schemas/session";

function makeTask(overrides: Partial<SessionTask> = {}): SessionTask {
  return {
    id: "t_abc12",
    checked: false,
    dependency: "none",
    description: "Implement feature X",
    ...overrides,
  };
}

const taskNames: Record<string, string> = {
  t_abc12: "Implement feature X",
  t_def34: "Write tests for Y",
  t_ghi56: "Deploy Z",
};

describe("SESS-03: TaskSection (read-only mode)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders task list in file order", () => {
    const tasks = [
      makeTask({ id: "t_abc12", description: "First task" }),
      makeTask({ id: "t_def34", description: "Second task" }),
      makeTask({ id: "t_ghi56", description: "Third task" }),
    ];
    render(<TaskSection tasks={tasks} taskNames={taskNames} />);
    expect(screen.getByText("First task")).toBeInTheDocument();
    expect(screen.getByText("Second task")).toBeInTheDocument();
    expect(screen.getByText("Third task")).toBeInTheDocument();
  });

  it("renders checked/unchecked checkboxes (read-only when no callbacks)", () => {
    const tasks = [
      makeTask({ id: "t_abc12", checked: true, description: "Done task" }),
      makeTask({ id: "t_def34", checked: false, description: "Pending task" }),
    ];
    render(<TaskSection tasks={tasks} taskNames={taskNames} />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[0]).toBeDisabled();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[1]).toBeDisabled();
  });

  it("checked tasks have strikethrough and dimmed opacity", () => {
    const tasks = [
      makeTask({ id: "t_abc12", checked: true, description: "Done task" }),
    ];
    render(<TaskSection tasks={tasks} taskNames={taskNames} />);
    const text = screen.getByText("Done task");
    expect(text).toHaveClass("line-through");
    expect(text).toHaveClass("opacity-50");
  });

  it("renders dependency badges with tooltip", () => {
    const tasks = [
      makeTask({
        id: "t_def34",
        dependency: "t_abc12",
        description: "Depends on X",
      }),
    ];
    render(<TaskSection tasks={tasks} taskNames={taskNames} />);
    // DependencyBadge renders the count of dependencies
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders progress summary with count text", () => {
    const tasks = [
      makeTask({ id: "t_abc12", checked: true }),
      makeTask({ id: "t_def34", checked: false }),
      makeTask({ id: "t_ghi56", checked: true }),
    ];
    render(<TaskSection tasks={tasks} taskNames={taskNames} />);
    expect(screen.getByText("2/3 tasks")).toBeInTheDocument();
  });

  it("renders progress bar", () => {
    const tasks = [
      makeTask({ id: "t_abc12", checked: true }),
      makeTask({ id: "t_def34", checked: false }),
    ];
    render(<TaskSection tasks={tasks} taskNames={taskNames} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
  });

  it("does not render actions menu, reorder buttons, or editable text in read-only mode", () => {
    const tasks = [makeTask({ id: "t_abc12", description: "Read-only task" })];
    render(<TaskSection tasks={tasks} taskNames={taskNames} />);

    // No action buttons
    expect(
      screen.queryByRole("button", { name: /task actions/i }),
    ).not.toBeInTheDocument();
    // No reorder buttons
    expect(
      screen.queryByRole("button", { name: /move up/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /move down/i }),
    ).not.toBeInTheDocument();
  });
});

describe("SESS-03: TaskSection (interactive mode)", () => {
  afterEach(() => {
    cleanup();
  });

  const onToggle = vi.fn();
  const onEditDescription = vi.fn();
  const onDelete = vi.fn();
  const onMoveUp = vi.fn();
  const onMoveDown = vi.fn();
  const onSetDependency = vi.fn();

  function renderInteractive(tasks?: SessionTask[]) {
    const defaultTasks = [
      makeTask({ id: "t_abc12", description: "First task" }),
      makeTask({ id: "t_def34", description: "Second task" }),
      makeTask({ id: "t_ghi56", description: "Third task" }),
    ];
    return render(
      <TaskSection
        tasks={tasks ?? defaultTasks}
        taskNames={taskNames}
        onToggle={onToggle}
        onEditDescription={onEditDescription}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onSetDependency={onSetDependency}
      />,
    );
  }

  it("checkboxes are enabled when onToggle is provided", () => {
    renderInteractive();
    const checkboxes = screen.getAllByRole("checkbox");
    for (const cb of checkboxes) {
      expect(cb).not.toBeDisabled();
    }
  });

  it("checkbox click calls onToggle with task id", () => {
    renderInteractive();
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onToggle).toHaveBeenCalledWith("t_abc12");
  });

  it("clicking task description enters edit mode via EditableText", () => {
    renderInteractive();
    fireEvent.click(screen.getByText("First task"));
    expect(screen.getByDisplayValue("First task")).toBeInTheDocument();
  });

  it("editing task description calls onEditDescription", () => {
    renderInteractive();
    fireEvent.click(screen.getByText("First task"));
    const input = screen.getByDisplayValue("First task");
    fireEvent.change(input, { target: { value: "Updated task" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onEditDescription).toHaveBeenCalledWith("t_abc12", "Updated task");
  });

  it("renders reorder buttons for each task", () => {
    renderInteractive();
    const moveUpButtons = screen.getAllByRole("button", { name: /move up/i });
    const moveDownButtons = screen.getAllByRole("button", {
      name: /move down/i,
    });
    expect(moveUpButtons).toHaveLength(3);
    expect(moveDownButtons).toHaveLength(3);
  });

  it("first task move up is disabled, last task move down is disabled", () => {
    renderInteractive();
    const moveUpButtons = screen.getAllByRole("button", { name: /move up/i });
    const moveDownButtons = screen.getAllByRole("button", {
      name: /move down/i,
    });
    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveDownButtons[2]).toBeDisabled();
  });

  it("move up calls onMoveUp with task id", () => {
    renderInteractive();
    const moveUpButtons = screen.getAllByRole("button", { name: /move up/i });
    // Second task's up button
    fireEvent.click(moveUpButtons[1]);
    expect(onMoveUp).toHaveBeenCalledWith("t_def34");
  });

  it("move down calls onMoveDown with task id", () => {
    renderInteractive();
    const moveDownButtons = screen.getAllByRole("button", {
      name: /move down/i,
    });
    fireEvent.click(moveDownButtons[0]);
    expect(onMoveDown).toHaveBeenCalledWith("t_abc12");
  });

  it("renders task actions menu for each task", () => {
    renderInteractive();
    const actionButtons = screen.getAllByRole("button", {
      name: /task actions/i,
    });
    expect(actionButtons).toHaveLength(3);
  });

  it("delete action in menu calls onDelete", () => {
    renderInteractive();
    const actionButtons = screen.getAllByRole("button", {
      name: /task actions/i,
    });
    fireEvent.click(actionButtons[0]);
    fireEvent.click(screen.getByRole("menuitem", { name: /delete/i }));

    // Dialog appears
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    // Confirm delete
    fireEvent.click(screen.getByRole("button", { name: /^Delete$/i }));
    expect(onDelete).toHaveBeenCalledWith("t_abc12");
  });

  it("set dependency action shows TaskDependencySelect", () => {
    renderInteractive();
    const actionButtons = screen.getAllByRole("button", {
      name: /task actions/i,
    });
    fireEvent.click(actionButtons[0]);
    fireEvent.click(screen.getByRole("menuitem", { name: /set dependency/i }));

    // Dependency select should appear
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
  });

  it("changing dependency calls onSetDependency", () => {
    renderInteractive();
    const actionButtons = screen.getAllByRole("button", {
      name: /task actions/i,
    });
    fireEvent.click(actionButtons[0]);
    fireEvent.click(screen.getByRole("menuitem", { name: /set dependency/i }));

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "t_def34" } });
    expect(onSetDependency).toHaveBeenCalledWith("t_abc12", "t_def34");
  });
});
