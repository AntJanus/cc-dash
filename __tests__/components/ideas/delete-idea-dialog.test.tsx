import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Mock the server action and router
const { mockDeleteIdea } = vi.hoisted(() => ({
  mockDeleteIdea: vi.fn(),
}));
vi.mock("@/lib/actions/ideas-actions", () => ({
  deleteIdea: mockDeleteIdea,
}));

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { DeleteIdeaDialog } from "@/components/ideas/delete-idea-dialog";

describe("DeleteIdeaDialog", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders delete button trigger", () => {
    render(
      <DeleteIdeaDialog
        ideaId="i_abc12"
        ideaTitle="Test Idea"
        ideaStatus="not-started"
      />,
    );
    const trigger = screen.getByRole("button", { name: /delete/i });
    expect(trigger).toBeInTheDocument();
  });

  it("shows confirmation dialog on click", () => {
    render(
      <DeleteIdeaDialog
        ideaId="i_abc12"
        ideaTitle="Test Idea"
        ideaStatus="not-started"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("shows idea title in confirmation message", () => {
    render(
      <DeleteIdeaDialog
        ideaId="i_abc12"
        ideaTitle="My Great Idea"
        ideaStatus="not-started"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByText(/My Great Idea/)).toBeInTheDocument();
  });

  it("calls deleteIdea on confirm", async () => {
    mockDeleteIdea.mockResolvedValue({ success: true, data: undefined });

    render(
      <DeleteIdeaDialog
        ideaId="i_abc12"
        ideaTitle="Test Idea"
        ideaStatus="not-started"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await vi.waitFor(() => {
      expect(mockDeleteIdea).toHaveBeenCalledWith({ id: "i_abc12" });
    });
  });

  it("navigates to /ideas after successful delete", async () => {
    mockDeleteIdea.mockResolvedValue({ success: true, data: undefined });

    render(
      <DeleteIdeaDialog
        ideaId="i_abc12"
        ideaTitle="Test Idea"
        ideaStatus="not-started"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/ideas");
    });
  });

  it("closes dialog on cancel", () => {
    render(
      <DeleteIdeaDialog
        ideaId="i_abc12"
        ideaTitle="Test Idea"
        ideaStatus="not-started"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows extra warning for started ideas", () => {
    render(
      <DeleteIdeaDialog
        ideaId="i_abc12"
        ideaTitle="Test Idea"
        ideaStatus="started"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(
      screen.getByText(/project directory will not be deleted/i),
    ).toBeInTheDocument();
  });

  it("shows extra warning for complete ideas", () => {
    render(
      <DeleteIdeaDialog
        ideaId="i_abc12"
        ideaTitle="Test Idea"
        ideaStatus="complete"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(
      screen.getByText(/project directory will not be deleted/i),
    ).toBeInTheDocument();
  });

  it("does not show extra warning for not-started ideas", () => {
    render(
      <DeleteIdeaDialog
        ideaId="i_abc12"
        ideaTitle="Test Idea"
        ideaStatus="not-started"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(
      screen.queryByText(/project directory will not be deleted/i),
    ).not.toBeInTheDocument();
  });
});
