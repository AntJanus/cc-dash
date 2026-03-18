import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { WizardStepType } from "@/components/ideas/wizard-step-type";
import { INITIAL_WIZARD_DATA } from "@/components/ideas/wizard-types";

describe("WizardStepType", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders project type select with 5 options", () => {
    render(<WizardStepType data={INITIAL_WIZARD_DATA} onChange={vi.fn()} />);

    const select = screen.getByLabelText(/project type/i);
    expect(select).toBeInTheDocument();

    const options = select.querySelectorAll("option");
    expect(options).toHaveLength(5);
  });

  it("renders stack input with current data.stack joined by comma", () => {
    const data = { ...INITIAL_WIZARD_DATA, stack: ["React", "Node", "TS"] };
    render(<WizardStepType data={data} onChange={vi.fn()} />);

    const input = screen.getByLabelText(/stack/i);
    expect(input).toHaveValue("React, Node, TS");
  });

  it("calls onChange({projectType: newValue}) when select changes", () => {
    const onChange = vi.fn();
    render(<WizardStepType data={INITIAL_WIZARD_DATA} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/project type/i), {
      target: { value: "game" },
    });

    expect(onChange).toHaveBeenCalledWith({ projectType: "game" });
  });

  it("calls onChange({stack: parsedArray}) when stack input changes (comma-split, trimmed, filtered)", () => {
    const onChange = vi.fn();
    render(<WizardStepType data={INITIAL_WIZARD_DATA} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/stack/i), {
      target: { value: "React, , Node , TypeScript" },
    });

    expect(onChange).toHaveBeenCalledWith({
      stack: ["React", "Node", "TypeScript"],
    });
  });

  it("shows current projectType as selected option", () => {
    const data = { ...INITIAL_WIZARD_DATA, projectType: "game" as const };
    render(<WizardStepType data={data} onChange={vi.fn()} />);

    const select = screen.getByLabelText(/project type/i) as HTMLSelectElement;
    expect(select.value).toBe("game");
  });
});
