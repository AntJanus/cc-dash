import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { WizardListInput } from "@/components/ideas/wizard-list-input";

describe("WizardListInput", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders input field and Add button", () => {
    render(
      <WizardListInput items={[]} onChange={vi.fn()} label="Requirements" />,
    );

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  it("calls onChange with new item appended when Add clicked with non-empty input", () => {
    const onChange = vi.fn();
    render(
      <WizardListInput
        items={["Existing item"]}
        onChange={onChange}
        label="Requirements"
      />,
    );

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "New requirement" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onChange).toHaveBeenCalledWith(["Existing item", "New requirement"]);
  });

  it("clears input after adding an item", () => {
    render(
      <WizardListInput items={[]} onChange={vi.fn()} label="Requirements" />,
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Something" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(input).toHaveValue("");
  });

  it("does not add empty/whitespace-only items", () => {
    const onChange = vi.fn();
    render(
      <WizardListInput items={[]} onChange={onChange} label="Requirements" />,
    );

    // Try adding empty string
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(onChange).not.toHaveBeenCalled();

    // Try adding whitespace-only string
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders existing items with Remove buttons", () => {
    render(
      <WizardListInput
        items={["Item A", "Item B"]}
        onChange={vi.fn()}
        label="Requirements"
      />,
    );

    expect(screen.getByText("Item A")).toBeInTheDocument();
    expect(screen.getByText("Item B")).toBeInTheDocument();

    // Each item should have a Remove button
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    expect(removeButtons).toHaveLength(2);
  });

  it("calls onChange with item removed when Remove clicked", () => {
    const onChange = vi.fn();
    render(
      <WizardListInput
        items={["Item A", "Item B", "Item C"]}
        onChange={onChange}
        label="Requirements"
      />,
    );

    // Remove the second item
    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    fireEvent.click(removeButtons[1]);

    expect(onChange).toHaveBeenCalledWith(["Item A", "Item C"]);
  });

  it("supports Enter key to add item", () => {
    const onChange = vi.fn();
    render(
      <WizardListInput items={[]} onChange={onChange} label="Inspirations" />,
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "NetHack" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(["NetHack"]);
  });

  it("renders the label", () => {
    render(
      <WizardListInput items={[]} onChange={vi.fn()} label="Open Questions" />,
    );

    expect(screen.getByText("Open Questions")).toBeInTheDocument();
  });

  it("uses custom placeholder when provided", () => {
    render(
      <WizardListInput
        items={[]}
        onChange={vi.fn()}
        label="Inspirations"
        placeholder="e.g. NetHack"
      />,
    );

    expect(screen.getByPlaceholderText("e.g. NetHack")).toBeInTheDocument();
  });
});
