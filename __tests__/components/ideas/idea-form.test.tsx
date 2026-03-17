import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Mock the server action
const { mockAddIdea } = vi.hoisted(() => ({
  mockAddIdea: vi.fn(),
}));
vi.mock("@/lib/actions/ideas-actions", () => ({
  addIdea: mockAddIdea,
}));

import { IdeaForm } from "@/components/ideas/idea-form";

describe("IdeaForm", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders add idea button", () => {
    render(<IdeaForm />);
    expect(
      screen.getByRole("button", { name: /add idea/i }),
    ).toBeInTheDocument();
  });

  it("opens modal on button click", () => {
    render(<IdeaForm />);
    fireEvent.click(screen.getByRole("button", { name: /add idea/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders form fields in modal", () => {
    render(<IdeaForm />);
    fireEvent.click(screen.getByRole("button", { name: /add idea/i }));
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stack/i)).toBeInTheDocument();
  });

  it("calls addIdea on submit with form values", async () => {
    mockAddIdea.mockResolvedValue({ success: true, data: { id: "i_new01" } });

    render(<IdeaForm />);
    fireEvent.click(screen.getByRole("button", { name: /add idea/i }));

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "My New Idea" },
    });
    fireEvent.change(screen.getByLabelText(/stack/i), {
      target: { value: "Go, Rust" },
    });

    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);

    // Wait for async action
    await vi.waitFor(() => {
      expect(mockAddIdea).toHaveBeenCalledWith({
        title: "My New Idea",
        status: "not-started",
        stack: ["Go", "Rust"],
      });
    });
  });

  it("does not submit with empty title", () => {
    render(<IdeaForm />);
    fireEvent.click(screen.getByRole("button", { name: /add idea/i }));

    // Submit without filling title
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);

    expect(mockAddIdea).not.toHaveBeenCalled();
  });

  it("closes modal on cancel", () => {
    render(<IdeaForm />);
    fireEvent.click(screen.getByRole("button", { name: /add idea/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes modal on successful submit", async () => {
    mockAddIdea.mockResolvedValue({ success: true, data: { id: "i_new01" } });

    render(<IdeaForm />);
    fireEvent.click(screen.getByRole("button", { name: /add idea/i }));

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "My Idea" },
    });
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);

    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("calls onSuccess callback after successful submit", async () => {
    mockAddIdea.mockResolvedValue({ success: true, data: { id: "i_new01" } });
    const onSuccess = vi.fn();

    render(<IdeaForm onSuccess={onSuccess} />);
    fireEvent.click(screen.getByRole("button", { name: /add idea/i }));

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "My Idea" },
    });
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);

    await vi.waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });

  it("shows error message on failed submit", async () => {
    mockAddIdea.mockResolvedValue({
      success: false,
      errors: [{ field: "status", message: "Invalid status", received: "bad" }],
    });

    render(<IdeaForm />);
    fireEvent.click(screen.getByRole("button", { name: /add idea/i }));

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "My Idea" },
    });
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);

    await vi.waitFor(() => {
      expect(screen.getByText(/invalid status/i)).toBeInTheDocument();
    });
  });
});
