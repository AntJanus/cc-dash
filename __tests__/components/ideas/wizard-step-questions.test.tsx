import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { WizardStepQuestions } from "@/components/ideas/wizard-step-questions";
import type { WizardData } from "@/components/ideas/wizard-types";

const baseData: WizardData = {
  title: "Test Idea",
  pitch: "A test pitch",
  projectType: "tool",
  stack: ["TypeScript"],
  coreLoop: "",
  requirements: ["Req 1"],
  inspirations: [],
  openQuestions: ["What framework?", "What hosting?"],
};

describe("WizardStepQuestions", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders WizardListInput with data.openQuestions", () => {
    render(<WizardStepQuestions data={baseData} onChange={vi.fn()} />);

    expect(screen.getByText("What framework?")).toBeInTheDocument();
    expect(screen.getByText("What hosting?")).toBeInTheDocument();
  });

  it("calls onChange with openQuestions when list changes", () => {
    const onChange = vi.fn();
    render(<WizardStepQuestions data={baseData} onChange={onChange} />);

    // Add a new question
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "What database?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onChange).toHaveBeenCalledWith({
      openQuestions: ["What framework?", "What hosting?", "What database?"],
    });
  });

  it("has descriptive label indicating this step is optional", () => {
    render(<WizardStepQuestions data={baseData} onChange={vi.fn()} />);

    // Should mention "optional" somewhere in the step description
    expect(screen.getByText(/optional/i)).toBeInTheDocument();
  });
});
