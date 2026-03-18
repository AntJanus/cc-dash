import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { WizardStepRequirements } from "@/components/ideas/wizard-step-requirements";
import { INITIAL_WIZARD_DATA } from "@/components/ideas/wizard-types";

describe("WizardStepRequirements", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders WizardListInput with data.requirements", () => {
    const data = {
      ...INITIAL_WIZARD_DATA,
      requirements: ["Fast startup", "Offline mode"],
    };
    render(<WizardStepRequirements data={data} onChange={vi.fn()} />);

    expect(screen.getByText("Fast startup")).toBeInTheDocument();
    expect(screen.getByText("Offline mode")).toBeInTheDocument();
  });

  it("calls onChange({requirements: newList}) when list changes via Add", () => {
    const onChange = vi.fn();
    const data = {
      ...INITIAL_WIZARD_DATA,
      requirements: ["Existing req"],
    };
    render(<WizardStepRequirements data={data} onChange={onChange} />);

    // Type a new requirement and click Add
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "New requirement" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onChange).toHaveBeenCalledWith({
      requirements: ["Existing req", "New requirement"],
    });
  });

  it("has descriptive label and placeholder", () => {
    render(
      <WizardStepRequirements data={INITIAL_WIZARD_DATA} onChange={vi.fn()} />,
    );

    // The label "Requirements" is rendered by WizardListInput
    expect(screen.getByText("Requirements")).toBeInTheDocument();
    // The description paragraph is also rendered
    expect(
      screen.getByText(/key requirements or features/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/add a requirement/i),
    ).toBeInTheDocument();
  });
});
