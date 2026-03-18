import { describe, it, expect, afterEach, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { IdeaWizard } from "@/components/ideas/idea-wizard";

// Mock addIdea server action
const { mockAddIdea } = vi.hoisted(() => ({
  mockAddIdea: vi.fn(),
}));

vi.mock("@/lib/actions/ideas-actions", () => ({
  addIdea: mockAddIdea,
}));

// Mock useRouter for refresh
const { mockRefresh } = vi.hoisted(() => ({
  mockRefresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

describe("IdeaWizard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders a Wizard button", () => {
    render(<IdeaWizard />);
    expect(screen.getByRole("button", { name: /wizard/i })).toBeInTheDocument();
  });

  it("opens dialog when Wizard button is clicked", () => {
    render(<IdeaWizard />);
    fireEvent.click(screen.getByRole("button", { name: /wizard/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("starts on Step 1 (Concept) showing step indicator 'Step 1 of 6'", () => {
    render(<IdeaWizard />);
    fireEvent.click(screen.getByRole("button", { name: /wizard/i }));
    expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument();
    // Step 1 is Concept which has a title input
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it("Next button advances to Step 2", () => {
    render(<IdeaWizard />);
    fireEvent.click(screen.getByRole("button", { name: /wizard/i }));

    // Enter a title to enable Next
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Test Idea" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByText(/step 2 of 6/i)).toBeInTheDocument();
  });

  it("Back button returns to Step 1 with data preserved", () => {
    render(<IdeaWizard />);
    fireEvent.click(screen.getByRole("button", { name: /wizard/i }));

    // Enter title and advance
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "My Title" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/step 2 of 6/i)).toBeInTheDocument();

    // Go back
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toHaveValue("My Title");
  });

  it("Step 3 (Core Loop) appears when projectType is 'game', making total 'Step N of 7'", () => {
    render(<IdeaWizard />);
    fireEvent.click(screen.getByRole("button", { name: /wizard/i }));

    // Enter title and advance to step 2
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Test Game" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Change type to game
    fireEvent.change(screen.getByLabelText(/project type/i), {
      target: { value: "game" },
    });

    // Verify step count changed to 7
    expect(screen.getByText(/step 2 of 7/i)).toBeInTheDocument();

    // Advance to step 3 -- should be Core Loop
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/step 3 of 7/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/core gameplay loop/i)).toBeInTheDocument();
  });

  it("Step 3 is skipped when projectType is not 'game' (Next from Step 2 goes to Requirements)", () => {
    render(<IdeaWizard />);
    fireEvent.click(screen.getByRole("button", { name: /wizard/i }));

    // Enter title and advance to step 2
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Test Tool" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Default type is "tool" -- verify step count stays at 6
    expect(screen.getByText(/step 2 of 6/i)).toBeInTheDocument();

    // Advance -- should go to Requirements (step 3 of 6), not Core Loop
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/step 3 of 6/i)).toBeInTheDocument();
    // Requirements step content is visible (step indicator also contains "Requirements")
    expect(screen.getAllByText(/requirements/i).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(
      screen.queryByLabelText(/core gameplay loop/i),
    ).not.toBeInTheDocument();
  });

  it("changing type from game to non-game while on step 3 adjusts step index", () => {
    render(<IdeaWizard />);
    fireEvent.click(screen.getByRole("button", { name: /wizard/i }));

    // Enter title and advance to step 2
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Change type to game
    fireEvent.change(screen.getByLabelText(/project type/i), {
      target: { value: "game" },
    });

    // Advance to step 3 (Core Loop)
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/step 3 of 7/i)).toBeInTheDocument();

    // Go back to step 2 and change type to tool
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    fireEvent.change(screen.getByLabelText(/project type/i), {
      target: { value: "tool" },
    });

    // Step count should now be 6 again
    expect(screen.getByText(/step 2 of 6/i)).toBeInTheDocument();
  });

  it("Next button on Step 1 is disabled when title is empty", () => {
    render(<IdeaWizard />);
    fireEvent.click(screen.getByRole("button", { name: /wizard/i }));

    // Title is empty by default
    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeDisabled();
  });

  it("Final step shows 'Create' button instead of 'Next'", () => {
    render(<IdeaWizard />);
    fireEvent.click(screen.getByRole("button", { name: /wizard/i }));

    // Navigate to final step (6 steps for non-game)
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Test" },
    });

    // Step 1 -> 2 -> 3(req) -> 4(insp) -> 5(ques) -> 6(review)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
    }

    expect(screen.getByText(/step 6 of 6/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^next$/i }),
    ).not.toBeInTheDocument();
  });

  it("Create button calls addIdea with title, status 'not-started', stack, and body from generateIdeaBody", async () => {
    mockAddIdea.mockResolvedValue({ success: true, data: { id: "i_abc123" } });

    render(<IdeaWizard />);
    fireEvent.click(screen.getByRole("button", { name: /wizard/i }));

    // Step 1: title and pitch
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "My Idea" },
    });
    fireEvent.change(screen.getByLabelText(/elevator pitch/i), {
      target: { value: "A great idea" },
    });

    // Advance through all steps to final
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
    }

    // Click Create
    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(mockAddIdea).toHaveBeenCalledWith({
        title: "My Idea",
        status: "not-started",
        stack: [],
        body: "A great idea",
      });
    });
  });

  it("successful creation closes dialog", async () => {
    mockAddIdea.mockResolvedValue({ success: true, data: { id: "i_abc123" } });

    render(<IdeaWizard />);
    fireEvent.click(screen.getByRole("button", { name: /wizard/i }));

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Test" },
    });

    // Navigate to final step
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
    }

    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("failed creation shows error message", async () => {
    mockAddIdea.mockResolvedValue({
      success: false,
      errors: [
        { field: "title", message: "Title already exists", received: "Test" },
      ],
    });

    render(<IdeaWizard />);
    fireEvent.click(screen.getByRole("button", { name: /wizard/i }));

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Test" },
    });

    // Navigate to final step
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
    }

    fireEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText(/title already exists/i)).toBeInTheDocument();
    });
  });

  it("closing dialog resets wizard data to initial state", () => {
    render(<IdeaWizard />);
    fireEvent.click(screen.getByRole("button", { name: /wizard/i }));

    // Enter data and advance
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Will Be Reset" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Close dialog via backdrop (we'll click Cancel/close button)
    // Find the close button or backdrop -- we'll use the Cancel action
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    // Dialog closed
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Reopen and verify data is reset
    fireEvent.click(screen.getByRole("button", { name: /wizard/i }));
    expect(screen.getByLabelText(/title/i)).toHaveValue("");
    expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument();
  });
});
