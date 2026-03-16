import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
} from "@testing-library/react";

// Mock the server action
const { mockGenerateCrossProjectPrompt } = vi.hoisted(() => ({
  mockGenerateCrossProjectPrompt: vi.fn(),
}));
vi.mock("@/lib/actions/prompt-actions", () => ({
  generateCrossProjectPrompt: mockGenerateCrossProjectPrompt,
}));

import { CrossProjectPromptButton } from "@/components/prompt/cross-project-prompt-button";

describe("CrossProjectPromptButton", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateCrossProjectPrompt.mockResolvedValue({
      success: true,
      prompt: "cd /projects/best\n\nProject: Best Project",
    });
  });

  it("renders cross-project prompt button", () => {
    render(<CrossProjectPromptButton />);
    expect(
      screen.getByRole("button", { name: /suggest next work/i }),
    ).toBeInTheDocument();
  });

  it("opens modal on click", async () => {
    render(<CrossProjectPromptButton />);
    fireEvent.click(screen.getByRole("button", { name: /suggest next work/i }));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("calls generateCrossProjectPrompt action", async () => {
    render(<CrossProjectPromptButton />);
    fireEvent.click(screen.getByRole("button", { name: /suggest next work/i }));
    await waitFor(() => {
      expect(mockGenerateCrossProjectPrompt).toHaveBeenCalledOnce();
    });
  });

  it("shows prompt in modal after loading", async () => {
    render(<CrossProjectPromptButton />);
    fireEvent.click(screen.getByRole("button", { name: /suggest next work/i }));
    await waitFor(() => {
      expect(screen.getByText(/cd \/projects\/best/)).toBeInTheDocument();
    });
  });

  it("shows empty state message when no work suggested", async () => {
    mockGenerateCrossProjectPrompt.mockResolvedValue({
      success: false,
      error: "All projects are up to date! No work to suggest.",
    });
    render(<CrossProjectPromptButton />);
    fireEvent.click(screen.getByRole("button", { name: /suggest next work/i }));
    await waitFor(() => {
      expect(screen.getByText(/up to date/i)).toBeInTheDocument();
    });
  });
});
