import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PromptModal } from "@/components/prompt/prompt-modal";

describe("PromptModal", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    prompt:
      "cd /path/to/project\n\nProject: MyProject\nRoadmap: 3/10 items done",
    isLoading: false,
    onRegenerate: vi.fn(),
    onCopy: vi.fn(),
    copyLabel: "Copy",
  };

  it("renders nothing when open is false", () => {
    const { container } = render(
      <PromptModal {...defaultProps} open={false} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders dialog with prompt text when open", () => {
    render(<PromptModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/cd \/path\/to\/project/)).toBeInTheDocument();
  });

  it("shows loading spinner when isLoading", () => {
    render(<PromptModal {...defaultProps} isLoading={true} />);
    expect(screen.getByText(/Generating prompt/i)).toBeInTheDocument();
  });

  it("displays prompt in monospace pre block", () => {
    render(<PromptModal {...defaultProps} />);
    const pre = screen.getByText(/cd \/path\/to\/project/).closest("pre");
    expect(pre).toBeInTheDocument();
    expect(pre?.className).toContain("font-mono");
  });

  it("calls onCopy when Copy button clicked", () => {
    const onCopy = vi.fn();
    render(<PromptModal {...defaultProps} onCopy={onCopy} />);
    fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it("calls onRegenerate when Regenerate button clicked", () => {
    const onRegenerate = vi.fn();
    render(<PromptModal {...defaultProps} onRegenerate={onRegenerate} />);
    fireEvent.click(screen.getByRole("button", { name: /regenerate/i }));
    expect(onRegenerate).toHaveBeenCalledOnce();
  });

  it("calls onClose when Close button clicked", () => {
    const onClose = vi.fn();
    render(<PromptModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when overlay clicked", () => {
    const onClose = vi.fn();
    render(<PromptModal {...defaultProps} onClose={onClose} />);
    // The overlay is the backdrop element
    const overlay = screen.getByTestId("prompt-modal-overlay");
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not close when content area clicked", () => {
    const onClose = vi.fn();
    render(<PromptModal {...defaultProps} onClose={onClose} />);
    // Click on the content area (the dialog container)
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
  });
});
