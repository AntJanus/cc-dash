import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { TaskDependencySelect } from "@/components/session/task-dependency-select";

const allTasks = [
  { id: "t_abc01", description: "Set up database" },
  { id: "t_abc02", description: "Create API endpoints" },
  { id: "t_abc03", description: "Write integration tests" },
];

describe("TaskDependencySelect", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders select with none option and all task options", () => {
    render(
      <TaskDependencySelect
        currentTaskId="t_abc01"
        tasks={allTasks}
        value="none"
        onChange={vi.fn()}
      />,
    );
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    const options = select.querySelectorAll("option");
    // None + 2 tasks (excludes current t_abc01)
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("None");
  });

  it("shows current dependency as selected", () => {
    render(
      <TaskDependencySelect
        currentTaskId="t_abc01"
        tasks={allTasks}
        value="t_abc02"
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("t_abc02");
  });

  it("excludes current task from options", () => {
    render(
      <TaskDependencySelect
        currentTaskId="t_abc02"
        tasks={allTasks}
        value="none"
        onChange={vi.fn()}
      />,
    );
    const select = screen.getByRole("combobox");
    const options = Array.from(select.querySelectorAll("option"));
    const values = options.map((o) => o.getAttribute("value"));
    expect(values).not.toContain("t_abc02");
    expect(values).toContain("t_abc01");
    expect(values).toContain("t_abc03");
  });

  it("calls onChange with selected task ID", () => {
    const onChange = vi.fn();
    render(
      <TaskDependencySelect
        currentTaskId="t_abc01"
        tasks={allTasks}
        value="none"
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "t_abc03" },
    });
    expect(onChange).toHaveBeenCalledWith("t_abc03");
  });

  it("calls onChange with none when cleared", () => {
    const onChange = vi.fn();
    render(
      <TaskDependencySelect
        currentTaskId="t_abc01"
        tasks={allTasks}
        value="t_abc02"
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "none" },
    });
    expect(onChange).toHaveBeenCalledWith("none");
  });
});
