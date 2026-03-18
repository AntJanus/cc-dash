import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { WizardStepConcept } from "@/components/ideas/wizard-step-concept";
import { INITIAL_WIZARD_DATA } from "@/components/ideas/wizard-types";

describe("WizardStepConcept", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders title input with current data.title value", () => {
    const data = { ...INITIAL_WIZARD_DATA, title: "My Project" };
    render(<WizardStepConcept data={data} onChange={vi.fn()} />);

    const input = screen.getByLabelText(/title/i);
    expect(input).toHaveValue("My Project");
  });

  it("renders pitch textarea with current data.pitch value", () => {
    const data = { ...INITIAL_WIZARD_DATA, pitch: "A cool project" };
    render(<WizardStepConcept data={data} onChange={vi.fn()} />);

    const textarea = screen.getByLabelText(/elevator pitch/i);
    expect(textarea).toHaveValue("A cool project");
  });

  it("calls onChange({title: newValue}) when title input changes", () => {
    const onChange = vi.fn();
    render(
      <WizardStepConcept data={INITIAL_WIZARD_DATA} onChange={onChange} />,
    );

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "New Title" },
    });

    expect(onChange).toHaveBeenCalledWith({ title: "New Title" });
  });

  it("calls onChange({pitch: newValue}) when pitch textarea changes", () => {
    const onChange = vi.fn();
    render(
      <WizardStepConcept data={INITIAL_WIZARD_DATA} onChange={onChange} />,
    );

    fireEvent.change(screen.getByLabelText(/elevator pitch/i), {
      target: { value: "A new pitch" },
    });

    expect(onChange).toHaveBeenCalledWith({ pitch: "A new pitch" });
  });

  it("title input has required attribute", () => {
    render(<WizardStepConcept data={INITIAL_WIZARD_DATA} onChange={vi.fn()} />);

    expect(screen.getByLabelText(/title/i)).toBeRequired();
  });
});
