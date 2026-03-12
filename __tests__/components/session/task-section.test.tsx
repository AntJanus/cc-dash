import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
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

describe("SESS-03: TaskSection", () => {
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

  it("renders checked/unchecked checkboxes (read-only)", () => {
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
});
