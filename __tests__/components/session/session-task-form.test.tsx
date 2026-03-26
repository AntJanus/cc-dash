import { describe, it, expect, afterEach, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { SessionTaskForm } from "@/components/session/session-task-form";

const existingTasks = [
  { id: "t_abc01", description: "Set up database" },
  { id: "t_abc02", description: "Create API endpoints" },
  { id: "t_abc03", description: "Write integration tests" },
];

describe("SessionTaskForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders description input and dependency select", () => {
    render(
      <SessionTaskForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        existingTasks={existingTasks}
      />,
    );
    expect(
      screen.getByPlaceholderText(/task description/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add|save|submit/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onSubmit with description and dependency on submit", () => {
    const onSubmit = vi.fn();
    render(
      <SessionTaskForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        existingTasks={existingTasks}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(/task description/i), {
      target: { value: "New task description" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "t_abc01" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add|save|submit/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      description: "New task description",
      dependency: "t_abc01",
    });
  });

  it("does not submit when description is empty", () => {
    const onSubmit = vi.fn();
    render(
      <SessionTaskForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        existingTasks={existingTasks}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /add|save|submit/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("resets form after successful submit when no initialValues", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <SessionTaskForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        existingTasks={existingTasks}
      />,
    );
    const descInput = screen.getByPlaceholderText(/task description/i);
    fireEvent.change(descInput, { target: { value: "A task" } });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "t_abc02" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add|save|submit/i }));
    await waitFor(() => {
      expect(descInput).toHaveValue("");
    });
    expect(screen.getByRole("combobox")).toHaveValue("none");
  });

  it("shows existing task IDs in dependency dropdown", () => {
    render(
      <SessionTaskForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        existingTasks={existingTasks}
      />,
    );
    const select = screen.getByRole("combobox");
    const options = select.querySelectorAll("option");
    // "None" + 3 tasks
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent("None");
    expect(options[1]).toHaveTextContent("t_abc01");
    expect(options[2]).toHaveTextContent("t_abc02");
    expect(options[3]).toHaveTextContent("t_abc03");
  });

  it("defaults dependency to none", () => {
    render(
      <SessionTaskForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        existingTasks={existingTasks}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("none");
  });

  it("calls onCancel when Cancel button clicked", () => {
    const onCancel = vi.fn();
    render(
      <SessionTaskForm
        onSubmit={vi.fn()}
        onCancel={onCancel}
        existingTasks={existingTasks}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("populates fields from initialValues when editing", () => {
    render(
      <SessionTaskForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        existingTasks={existingTasks}
        initialValues={{
          description: "Existing task",
          dependency: "t_abc02",
        }}
      />,
    );
    expect(screen.getByPlaceholderText(/task description/i)).toHaveValue(
      "Existing task",
    );
    expect(screen.getByRole("combobox")).toHaveValue("t_abc02");
  });
});
