import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CreateProjectWizard } from "@/components/ideas/create-project-wizard";
import type { IdeaItem } from "@/lib/schemas/ideas";

// Mock server action
const { mockCreateProjectFromIdea } = vi.hoisted(() => ({
  mockCreateProjectFromIdea: vi.fn(),
}));
vi.mock("@/lib/actions/scaffold-actions", () => ({
  createProjectFromIdea: mockCreateProjectFromIdea,
}));

// Mock slugify
vi.mock("@/lib/fs", () => ({
  slugify: (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
}));

// Mock useRouter
const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function makeIdea(overrides: Partial<IdeaItem> = {}): IdeaItem {
  return {
    id: "i_abc12",
    status: "not-started",
    title: "My Cool Project",
    body: "A project description\n\n#### Requirements\n\n- Req 1",
    stack: ["TypeScript", "React"],
    ...overrides,
  };
}

const SCAN_DIRS = ["/home/user/projects", "/home/user/other"];

describe("CreateProjectWizard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders Create Project button", () => {
    render(<CreateProjectWizard idea={makeIdea()} scanDirs={SCAN_DIRS} />);
    expect(
      screen.getByRole("button", { name: /create project/i }),
    ).toBeInTheDocument();
  });

  it("hides button when idea already has a path", () => {
    render(
      <CreateProjectWizard
        idea={makeIdea({ path: "existing-project" })}
        scanDirs={SCAN_DIRS}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /create project/i }),
    ).not.toBeInTheDocument();
  });

  it("hides button when idea status is complete", () => {
    render(
      <CreateProjectWizard
        idea={makeIdea({ status: "complete" })}
        scanDirs={SCAN_DIRS}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /create project/i }),
    ).not.toBeInTheDocument();
  });

  it("opens dialog on button click", () => {
    render(<CreateProjectWizard idea={makeIdea()} scanDirs={SCAN_DIRS} />);
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows step 1 of 3 initially", () => {
    render(<CreateProjectWizard idea={makeIdea()} scanDirs={SCAN_DIRS} />);
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
  });

  it("pre-fills project name from idea title", () => {
    render(<CreateProjectWizard idea={makeIdea()} scanDirs={SCAN_DIRS} />);
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));

    const nameInput = screen.getByLabelText(/project name/i);
    expect(nameInput).toHaveValue("My Cool Project");
  });

  it("pre-fills directory name from slugified title", () => {
    render(<CreateProjectWizard idea={makeIdea()} scanDirs={SCAN_DIRS} />);
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));

    const dirInput = screen.getByLabelText(/directory name/i);
    expect(dirInput).toHaveValue("my-cool-project");
  });

  it("pre-fills description from first paragraph of body", () => {
    render(<CreateProjectWizard idea={makeIdea()} scanDirs={SCAN_DIRS} />);
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));

    const descInput = screen.getByLabelText(/description/i);
    expect(descInput).toHaveValue("A project description");
  });

  it("navigates to step 2 on Next", () => {
    render(<CreateProjectWizard idea={makeIdea()} scanDirs={SCAN_DIRS} />);
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
  });

  it("navigates back to step 1 with Back button", () => {
    render(<CreateProjectWizard idea={makeIdea()} scanDirs={SCAN_DIRS} />);
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
  });

  it("shows Create Project button on step 3", () => {
    render(<CreateProjectWizard idea={makeIdea()} scanDirs={SCAN_DIRS} />);
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));
    // Step 1 -> 2
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    // Step 2 -> 3
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument();
    // The submit button in the dialog should say "Create Project"
    const buttons = screen.getAllByRole("button", { name: /create project/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("closes dialog on Cancel", () => {
    render(<CreateProjectWizard idea={makeIdea()} scanDirs={SCAN_DIRS} />);
    fireEvent.click(screen.getByRole("button", { name: /create project/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows started idea with no path (button visible)", () => {
    render(
      <CreateProjectWizard
        idea={makeIdea({ status: "started" })}
        scanDirs={SCAN_DIRS}
      />,
    );
    expect(
      screen.getByRole("button", { name: /create project/i }),
    ).toBeInTheDocument();
  });
});
