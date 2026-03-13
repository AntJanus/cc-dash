import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { EditableText } from "@/components/roadmap/editable-text";

describe("EditableText", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders text value when not editing", () => {
    render(<EditableText value="Hello World" onSave={vi.fn()} />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
    // Should not have an input visible
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("switches to input on click", () => {
    render(<EditableText value="Click me" onSave={vi.fn()} />);
    fireEvent.click(screen.getByText("Click me"));
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Click me");
  });

  it("saves on Enter key", () => {
    const onSave = vi.fn();
    render(<EditableText value="Original" onSave={onSave} />);
    fireEvent.click(screen.getByText("Original"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Updated" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).toHaveBeenCalledWith("Updated");
    // Should exit edit mode
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("cancels on Escape key", () => {
    const onSave = vi.fn();
    render(<EditableText value="Original" onSave={onSave} />);
    fireEvent.click(screen.getByText("Original"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.keyDown(input, { key: "Escape" });
    // Should not save
    expect(onSave).not.toHaveBeenCalled();
    // Should exit edit mode and show original value
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText("Original")).toBeInTheDocument();
  });

  it("saves on blur", () => {
    const onSave = vi.fn();
    render(<EditableText value="Original" onSave={onSave} />);
    fireEvent.click(screen.getByText("Original"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Blurred" } });
    fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledWith("Blurred");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("calls onSave with updated value", () => {
    const onSave = vi.fn();
    render(<EditableText value="Start" onSave={onSave} />);
    fireEvent.click(screen.getByText("Start"));
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "End" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).toHaveBeenCalledWith("End");
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
