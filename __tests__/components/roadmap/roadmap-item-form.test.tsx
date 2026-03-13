import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { RoadmapItemForm } from "@/components/roadmap/roadmap-item-form";

describe("RoadmapItemForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders add item form with name, description, status fields", () => {
    render(<RoadmapItemForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByPlaceholderText(/name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add|save|submit/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onSubmit with form data on submit", () => {
    const onSubmit = vi.fn();
    render(<RoadmapItemForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/name/i), {
      target: { value: "New Feature" },
    });
    fireEvent.change(screen.getByPlaceholderText(/description/i), {
      target: { value: "A cool feature" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add|save|submit/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: "New Feature",
      description: "A cool feature",
      status: "planned",
    });
  });

  it("validates name is non-empty before submit", () => {
    const onSubmit = vi.fn();
    render(<RoadmapItemForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    // Try to submit with empty name
    fireEvent.click(screen.getByRole("button", { name: /add|save|submit/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("resets form after successful submit", () => {
    const onSubmit = vi.fn();
    render(<RoadmapItemForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    const nameInput = screen.getByPlaceholderText(/name/i);
    fireEvent.change(nameInput, { target: { value: "Feature" } });
    fireEvent.click(screen.getByRole("button", { name: /add|save|submit/i }));
    // After submit, name field should be cleared
    expect(nameInput).toHaveValue("");
  });

  it("renders edit mode with pre-filled values", () => {
    render(
      <RoadmapItemForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        initialValues={{
          name: "Existing",
          description: "Existing desc",
          status: "in-progress",
        }}
      />,
    );
    expect(screen.getByPlaceholderText(/name/i)).toHaveValue("Existing");
    expect(screen.getByPlaceholderText(/description/i)).toHaveValue(
      "Existing desc",
    );
    expect(screen.getByRole("combobox")).toHaveValue("in-progress");
  });

  it("calls onCancel when cancel button clicked", () => {
    const onCancel = vi.fn();
    render(<RoadmapItemForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
