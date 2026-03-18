import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { WizardStepCoreLoop } from "@/components/ideas/wizard-step-core-loop";
import { INITIAL_WIZARD_DATA } from "@/components/ideas/wizard-types";

describe("WizardStepCoreLoop", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders textarea with current data.coreLoop value", () => {
    const data = {
      ...INITIAL_WIZARD_DATA,
      projectType: "game" as const,
      coreLoop: "Explore, fight, loot, upgrade",
    };
    render(<WizardStepCoreLoop data={data} onChange={vi.fn()} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("Explore, fight, loot, upgrade");
  });

  it("calls onChange({coreLoop: newValue}) when textarea changes", () => {
    const onChange = vi.fn();
    const data = { ...INITIAL_WIZARD_DATA, projectType: "game" as const };
    render(<WizardStepCoreLoop data={data} onChange={onChange} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Build, test, deploy" },
    });

    expect(onChange).toHaveBeenCalledWith({ coreLoop: "Build, test, deploy" });
  });

  it("has descriptive label about gameplay loop", () => {
    const data = { ...INITIAL_WIZARD_DATA, projectType: "game" as const };
    render(<WizardStepCoreLoop data={data} onChange={vi.fn()} />);

    expect(screen.getByText(/core gameplay loop/i)).toBeInTheDocument();
  });
});
