import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { WizardStepInspirations } from "@/components/ideas/wizard-step-inspirations";
import type { WizardData } from "@/components/ideas/wizard-types";

const baseData: WizardData = {
  title: "Test Idea",
  pitch: "A test pitch",
  projectType: "tool",
  stack: ["TypeScript"],
  coreLoop: "",
  requirements: ["Req 1"],
  inspirations: ["NetHack", "Dwarf Fortress"],
  openQuestions: [],
};

describe("WizardStepInspirations", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders WizardListInput with data.inspirations", () => {
    render(<WizardStepInspirations data={baseData} onChange={vi.fn()} />);

    // Existing items should be displayed
    expect(screen.getByText("NetHack")).toBeInTheDocument();
    expect(screen.getByText("Dwarf Fortress")).toBeInTheDocument();
  });

  it("calls onChange with inspirations when list changes", () => {
    const onChange = vi.fn();
    render(<WizardStepInspirations data={baseData} onChange={onChange} />);

    // Add a new inspiration via input + Add button
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Caves of Qud" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onChange).toHaveBeenCalledWith({
      inspirations: ["NetHack", "Dwarf Fortress", "Caves of Qud"],
    });
  });

  it("has descriptive label and placeholder about references/inspirations", () => {
    render(<WizardStepInspirations data={baseData} onChange={vi.fn()} />);

    // Should have heading text about inspirations
    expect(screen.getByText(/inspirations & references/i)).toBeInTheDocument();

    // Should have a placeholder
    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder");
  });
});
