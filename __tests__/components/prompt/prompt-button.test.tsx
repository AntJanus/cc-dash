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
const { mockGenerateProjectPrompt } = vi.hoisted(() => ({
  mockGenerateProjectPrompt: vi.fn(),
}));
vi.mock("@/lib/actions/prompt-actions", () => ({
  generateProjectPrompt: mockGenerateProjectPrompt,
}));

import { PromptButton } from "@/components/prompt/prompt-button";

describe("PromptButton", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateProjectPrompt.mockResolvedValue({
      success: true,
      prompt: "cd /projects/test\n\nProject: Test",
    });
  });

  it("renders generate prompt button", () => {
    render(<PromptButton slug="test-project" />);
    expect(
      screen.getByRole("button", { name: /generate prompt/i }),
    ).toBeInTheDocument();
  });

  it("opens modal on click", async () => {
    render(<PromptButton slug="test-project" />);
    fireEvent.click(screen.getByRole("button", { name: /generate prompt/i }));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("calls generateProjectPrompt with slug", async () => {
    render(<PromptButton slug="test-project" />);
    fireEvent.click(screen.getByRole("button", { name: /generate prompt/i }));
    await waitFor(() => {
      expect(mockGenerateProjectPrompt).toHaveBeenCalledWith("test-project");
    });
  });

  it("shows prompt in modal after loading", async () => {
    render(<PromptButton slug="test-project" />);
    fireEvent.click(screen.getByRole("button", { name: /generate prompt/i }));
    await waitFor(() => {
      expect(screen.getByText(/cd \/projects\/test/)).toBeInTheDocument();
    });
  });

  it("stops event propagation (prevents card Link navigation)", () => {
    const parentOnClick = vi.fn();
    render(
      <div onClick={parentOnClick}>
        <PromptButton slug="test-project" />
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: /generate prompt/i }));
    expect(parentOnClick).not.toHaveBeenCalled();
  });
});
