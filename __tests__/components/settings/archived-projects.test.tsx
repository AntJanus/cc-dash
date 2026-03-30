import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  cleanup,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Mock unarchiveProject server action
const { mockUnarchiveProject } = vi.hoisted(() => ({
  mockUnarchiveProject: vi.fn(),
}));
vi.mock("@/lib/actions/archive-actions", () => ({
  unarchiveProject: mockUnarchiveProject,
}));

import { ArchivedProjectsSection } from "@/components/settings/archived-projects-section";
import type { ArchivedProjectInfo } from "@/lib/actions/archive-actions";

const sampleProjects: ArchivedProjectInfo[] = [
  { slug: "project-a", name: "Project A", path: "/projects/project-a" },
  { slug: "project-b", name: "Project B", path: "/projects/project-b" },
];

describe("ArchivedProjectsSection", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUnarchiveProject.mockResolvedValue({ success: true });
  });

  it("renders the section heading", () => {
    render(<ArchivedProjectsSection initialProjects={[]} />);

    expect(
      screen.getByRole("heading", { name: /archived projects/i }),
    ).toBeInTheDocument();
  });

  it("shows empty state message when no projects are archived", () => {
    render(<ArchivedProjectsSection initialProjects={[]} />);

    expect(screen.getByText(/no archived projects/i)).toBeInTheDocument();
  });

  it("renders each archived project name and path", () => {
    render(<ArchivedProjectsSection initialProjects={sampleProjects} />);

    expect(screen.getByText("Project A")).toBeInTheDocument();
    expect(screen.getByText("/projects/project-a")).toBeInTheDocument();
    expect(screen.getByText("Project B")).toBeInTheDocument();
    expect(screen.getByText("/projects/project-b")).toBeInTheDocument();
  });

  it("renders an Unarchive button for each project", () => {
    render(<ArchivedProjectsSection initialProjects={sampleProjects} />);

    const buttons = screen.getAllByRole("button", { name: /unarchive/i });
    expect(buttons).toHaveLength(2);
  });

  it("calls unarchiveProject with the correct slug on click", async () => {
    render(<ArchivedProjectsSection initialProjects={sampleProjects} />);

    const buttons = screen.getAllByRole("button", { name: /unarchive/i });
    await act(async () => {
      fireEvent.click(buttons[0]);
    });

    await waitFor(() => {
      expect(mockUnarchiveProject).toHaveBeenCalledWith("project-a");
    });
  });

  it("optimistically removes the project from the list on unarchive", async () => {
    // Make unarchive hang so we can check optimistic state
    let resolveUnarchive: (value: { success: true }) => void;
    mockUnarchiveProject.mockReturnValue(
      new Promise((resolve) => {
        resolveUnarchive = resolve;
      }),
    );

    render(<ArchivedProjectsSection initialProjects={sampleProjects} />);

    const buttons = screen.getAllByRole("button", { name: /unarchive/i });
    await act(async () => {
      fireEvent.click(buttons[0]);
    });

    // Project A should be gone optimistically
    expect(screen.queryByText("Project A")).not.toBeInTheDocument();
    expect(screen.getByText("Project B")).toBeInTheDocument();

    // Resolve and confirm it stays removed
    await act(async () => {
      resolveUnarchive!({ success: true });
    });

    await waitFor(() => {
      expect(screen.queryByText("Project A")).not.toBeInTheDocument();
    });
  });

  it("rolls back optimistic removal if unarchive fails", async () => {
    mockUnarchiveProject.mockResolvedValue({
      success: false,
      error: "Write failed",
    });

    render(<ArchivedProjectsSection initialProjects={sampleProjects} />);

    const buttons = screen.getAllByRole("button", { name: /unarchive/i });
    await act(async () => {
      fireEvent.click(buttons[0]);
    });

    // Project A should be restored after failure
    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
    });
  });

  it("shows error message if unarchive fails", async () => {
    mockUnarchiveProject.mockResolvedValue({
      success: false,
      error: "Write failed",
    });

    render(<ArchivedProjectsSection initialProjects={sampleProjects} />);

    const buttons = screen.getAllByRole("button", { name: /unarchive/i });
    await act(async () => {
      fireEvent.click(buttons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/write failed/i)).toBeInTheDocument();
    });
  });

  it("does not show empty state message when projects are present", () => {
    render(<ArchivedProjectsSection initialProjects={sampleProjects} />);

    expect(screen.queryByText(/no archived projects/i)).not.toBeInTheDocument();
  });
});
