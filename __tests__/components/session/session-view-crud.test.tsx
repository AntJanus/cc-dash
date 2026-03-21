import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { SessionView } from "@/components/session/session-view";
import type { SessionFile } from "@/lib/schemas/session";
import type { UnknownSection } from "@/lib/fs/types";

// Mock all session actions
const {
  mockToggleTaskCheckbox,
  mockAddSessionTask,
  mockUpdateSessionTask,
  mockDeleteSessionTask,
  mockReorderSessionTasks,
  mockUpdateCurrentStatus,
} = vi.hoisted(() => ({
  mockToggleTaskCheckbox: vi.fn(),
  mockAddSessionTask: vi.fn(),
  mockUpdateSessionTask: vi.fn(),
  mockDeleteSessionTask: vi.fn(),
  mockReorderSessionTasks: vi.fn(),
  mockUpdateCurrentStatus: vi.fn(),
}));

vi.mock("@/lib/actions/session-actions", () => ({
  toggleTaskCheckbox: mockToggleTaskCheckbox,
  addSessionTask: mockAddSessionTask,
  updateSessionTask: mockUpdateSessionTask,
  deleteSessionTask: mockDeleteSessionTask,
  reorderSessionTasks: mockReorderSessionTasks,
  updateCurrentStatus: mockUpdateCurrentStatus,
}));

// Mock status action (already mocked in session-view.test.tsx)
vi.mock("@/lib/actions/update-session-status", () => ({
  updateSessionStatus: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

function makeSession(overrides: Partial<SessionFile> = {}): SessionFile {
  return {
    schema: "cc-dash/session@1",
    project: "test-project",
    session_id: "s_2026-03-09_auth-refactor",
    roadmap_ref: "r_abc12",
    started: "2026-03-09T10:00:00-07:00",
    last_updated: "2026-03-09T14:30:00-07:00",
    status: "in-progress",
    tasks: [
      {
        id: "t_a1b2c",
        checked: false,
        dependency: "none",
        description: "Task Alpha",
      },
      {
        id: "t_d3e4f",
        checked: true,
        dependency: "t_a1b2c",
        description: "Task Beta",
      },
      {
        id: "t_g5h6i",
        checked: false,
        dependency: "none",
        description: "Task Gamma",
      },
    ],
    currentStatus: "Working on implementation phase",
    decisions: ["Use Zod v4"],
    failedAttempts: [],
    completedWork: [],
    filePath: "/projects/test/SESSION_PROGRESS.md",
    ...overrides,
  };
}

const defaultVerificationSections: UnknownSection[] = [];

function renderCrudView(overrides: Partial<SessionFile> = {}) {
  return render(
    <SessionView
      session={makeSession(overrides)}
      slug="test-project"
      verificationSections={defaultVerificationSections}
    />,
  );
}

describe("SessionView CRUD integration", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders task checkboxes that are clickable (not disabled)", () => {
    renderCrudView();

    const checkboxes = screen.getAllByRole("checkbox");
    // All checkboxes should be enabled (interactive)
    for (const cb of checkboxes) {
      expect(cb).not.toBeDisabled();
    }
  });

  it("optimistic checkbox toggle updates UI immediately", async () => {
    mockToggleTaskCheckbox.mockResolvedValue({
      success: true,
      data: undefined,
    });

    renderCrudView();

    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox (Task Alpha) is unchecked
    expect(checkboxes[0]).not.toBeChecked();

    // Click to toggle
    fireEvent.click(checkboxes[0]);

    // Should be checked now (optimistic)
    expect(checkboxes[0]).toBeChecked();

    // Server action should have been called
    expect(mockToggleTaskCheckbox).toHaveBeenCalledWith(
      "test-project",
      "t_a1b2c",
    );
  });

  it("shows Add Task button", () => {
    renderCrudView();

    expect(
      screen.getByRole("button", { name: /add task/i }),
    ).toBeInTheDocument();
  });

  it("Add Task button shows form and submit calls addSessionTask", async () => {
    mockAddSessionTask.mockResolvedValue({
      success: true,
      data: { id: "t_new12" },
    });

    renderCrudView();

    // Click Add Task
    fireEvent.click(screen.getByRole("button", { name: /add task/i }));

    // Form should appear
    const descInput = screen.getByPlaceholderText("Task description");
    expect(descInput).toBeInTheDocument();

    // Fill in description
    fireEvent.change(descInput, { target: { value: "New task from test" } });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));

    // Server action should be called
    expect(mockAddSessionTask).toHaveBeenCalledWith("test-project", {
      description: "New task from test",
      dependency: "none",
    });
  });

  it("shows task actions menu for each task", () => {
    renderCrudView();

    // Each task should have an actions menu button
    const actionButtons = screen.getAllByRole("button", {
      name: /task actions/i,
    });
    expect(actionButtons).toHaveLength(3);
  });

  it("inline editing updates task description", async () => {
    mockUpdateSessionTask.mockResolvedValue({
      success: true,
      data: undefined,
    });

    renderCrudView();

    // Click on "Task Alpha" text to enter edit mode
    fireEvent.click(screen.getByText("Task Alpha"));

    // Should show an input with the value
    const input = screen.getByDisplayValue("Task Alpha");
    expect(input).toBeInTheDocument();

    // Change value and press Enter
    fireEvent.change(input, { target: { value: "Task Alpha Updated" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // Server action should have been called
    expect(mockUpdateSessionTask).toHaveBeenCalledWith(
      "test-project",
      "t_a1b2c",
      { description: "Task Alpha Updated" },
    );
  });

  it("delete task removes from list after confirmation", async () => {
    mockDeleteSessionTask.mockResolvedValue({
      success: true,
      data: undefined,
    });

    renderCrudView();

    // Click the actions menu for the first task
    const actionButtons = screen.getAllByRole("button", {
      name: /task actions/i,
    });
    fireEvent.click(actionButtons[0]);

    // Click Delete in the menu
    fireEvent.click(screen.getByRole("menuitem", { name: /delete/i }));

    // Confirmation dialog should appear
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    // Click Delete to confirm
    fireEvent.click(screen.getByRole("button", { name: /^Delete$/i }));

    // Task should be removed from the list (optimistic)
    expect(screen.queryByText("Task Alpha")).not.toBeInTheDocument();

    // Server action should have been called
    expect(mockDeleteSessionTask).toHaveBeenCalledWith(
      "test-project",
      "t_a1b2c",
    );
  });

  it("reorder buttons appear for tasks", () => {
    renderCrudView();

    const moveUpButtons = screen.getAllByRole("button", { name: /move up/i });
    const moveDownButtons = screen.getAllByRole("button", {
      name: /move down/i,
    });

    // 3 tasks, so 3 up and 3 down buttons
    expect(moveUpButtons).toHaveLength(3);
    expect(moveDownButtons).toHaveLength(3);

    // First task's up button should be disabled
    expect(moveUpButtons[0]).toBeDisabled();
    // Last task's down button should be disabled
    expect(moveDownButtons[2]).toBeDisabled();
  });

  it("reorder down button calls reorderSessionTasks", async () => {
    mockReorderSessionTasks.mockResolvedValue({
      success: true,
      data: undefined,
    });

    renderCrudView();

    // Click "move down" on first task
    const moveDownButtons = screen.getAllByRole("button", {
      name: /move down/i,
    });
    fireEvent.click(moveDownButtons[0]);

    // Should call reorderSessionTasks with swapped order
    expect(mockReorderSessionTasks).toHaveBeenCalledWith("test-project", [
      "t_d3e4f",
      "t_a1b2c",
      "t_g5h6i",
    ]);
  });

  it("currentStatus section shows editable textarea", () => {
    renderCrudView();

    // Current status text should be visible
    expect(
      screen.getByText("Working on implementation phase"),
    ).toBeInTheDocument();

    // Click to enter edit mode (pencil icon or text click)
    fireEvent.click(screen.getByText("Working on implementation phase"));

    // Textarea should appear
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Working on implementation phase");
  });

  it("saving currentStatus calls updateCurrentStatus action", async () => {
    mockUpdateCurrentStatus.mockResolvedValue({
      success: true,
      data: undefined,
    });

    renderCrudView();

    // Click to enter edit mode
    fireEvent.click(screen.getByText("Working on implementation phase"));

    // Change the text
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "New status text" } });

    // Click Save
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    // Server action should have been called
    expect(mockUpdateCurrentStatus).toHaveBeenCalledWith(
      "test-project",
      "New status text",
    );
  });

  it("reverts optimistic update on server action failure", async () => {
    mockToggleTaskCheckbox.mockResolvedValue({
      success: false,
      errors: [{ field: "taskId", message: "Failed" }],
    });

    renderCrudView();

    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox (Task Alpha) is unchecked
    expect(checkboxes[0]).not.toBeChecked();

    // Click to toggle
    fireEvent.click(checkboxes[0]);

    // Optimistic: should be checked
    expect(checkboxes[0]).toBeChecked();

    // Wait for the revert
    await vi.waitFor(() => {
      expect(checkboxes[0]).not.toBeChecked();
    });
  });
});
