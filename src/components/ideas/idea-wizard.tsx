"use client";

/**
 * IdeaWizard container component.
 *
 * Orchestrates all 7 wizard steps (6 when not a game), manages step
 * navigation with conditional Step 3 (Core Loop), accumulates data
 * across steps, and submits via addIdea server action.
 *
 * Uses custom inline dialog pattern (not shadcn Dialog) for jsdom testability.
 */

import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addIdea } from "@/lib/actions/ideas-actions";
import { generateIdeaBody } from "@/components/ideas/generate-idea-body";
import {
  INITIAL_WIZARD_DATA,
  type WizardData,
} from "@/components/ideas/wizard-types";
import { WizardStepConcept } from "@/components/ideas/wizard-step-concept";
import { WizardStepType } from "@/components/ideas/wizard-step-type";
import { WizardStepCoreLoop } from "@/components/ideas/wizard-step-core-loop";
import { WizardStepRequirements } from "@/components/ideas/wizard-step-requirements";
import { WizardStepInspirations } from "@/components/ideas/wizard-step-inspirations";
import { WizardStepQuestions } from "@/components/ideas/wizard-step-questions";
import { WizardStepReview } from "@/components/ideas/wizard-step-review";

interface IdeaWizardProps {
  onSuccess?: () => void;
}

/** Step definition for the wizard. */
interface StepConfig {
  key: string;
  label: string;
}

/** Returns the list of visible steps based on current data (game includes Core Loop). */
function getVisibleSteps(data: WizardData): StepConfig[] {
  const steps: StepConfig[] = [
    { key: "concept", label: "Concept" },
    { key: "type", label: "Type & Stack" },
  ];

  if (data.projectType === "game") {
    steps.push({ key: "core-loop", label: "Core Loop" });
  }

  steps.push(
    { key: "requirements", label: "Requirements" },
    { key: "inspirations", label: "Inspirations" },
    { key: "questions", label: "Open Questions" },
    { key: "review", label: "Review" },
  );

  return steps;
}

export function IdeaWizard({ onSuccess }: IdeaWizardProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<WizardData>({ ...INITIAL_WIZARD_DATA });
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleSteps = getVisibleSteps(data);
  const currentStep = visibleSteps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === visibleSteps.length - 1;

  function handleUpdate(updates: Partial<WizardData>) {
    setData((prev) => {
      const next = { ...prev, ...updates };

      // If projectType changed and core-loop step was removed,
      // clamp stepIndex to visible steps length - 1
      const nextSteps = getVisibleSteps(next);
      if (stepIndex >= nextSteps.length) {
        setStepIndex(nextSteps.length - 1);
      }

      return next;
    });
  }

  function handleNext() {
    // Prevent advancing from step 1 if title is empty
    if (stepIndex === 0 && !data.title.trim()) return;
    if (!isLast) {
      setStepIndex((i) => i + 1);
    }
  }

  function handleBack() {
    if (!isFirst) {
      setStepIndex((i) => i - 1);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    const body = generateIdeaBody(data);
    const result = await addIdea({
      title: data.title.trim(),
      status: "not-started",
      stack: data.stack,
      body,
    });

    setSubmitting(false);

    if (result.success) {
      handleClose();
      onSuccess?.();
    } else {
      setError(result.errors[0]?.message ?? "Failed to create idea");
    }
  }

  function handleClose() {
    setData({ ...INITIAL_WIZARD_DATA });
    setStepIndex(0);
    setError(null);
    setOpen(false);
  }

  /** Render the current step component. */
  function renderStep() {
    if (!currentStep) return null;

    switch (currentStep.key) {
      case "concept":
        return <WizardStepConcept data={data} onChange={handleUpdate} />;
      case "type":
        return <WizardStepType data={data} onChange={handleUpdate} />;
      case "core-loop":
        return <WizardStepCoreLoop data={data} onChange={handleUpdate} />;
      case "requirements":
        return <WizardStepRequirements data={data} onChange={handleUpdate} />;
      case "inspirations":
        return <WizardStepInspirations data={data} onChange={handleUpdate} />;
      case "questions":
        return <WizardStepQuestions data={data} onChange={handleUpdate} />;
      case "review":
        return <WizardStepReview data={data} />;
      default:
        return null;
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Wizard"
      >
        <Wand2 className="mr-1 size-4" />
        Wizard
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="fixed inset-0 bg-black/10" onClick={handleClose} />
          <div className="relative z-10 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-background p-6 ring-1 ring-foreground/10 shadow-lg">
            {/* Step indicator */}
            <div className="mb-4 text-sm text-muted-foreground">
              Step {stepIndex + 1} of {visibleSteps.length} &mdash;{" "}
              {currentStep?.label}
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto">{renderStep()}</div>

            {/* Error message */}
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

            {/* Navigation buttons */}
            <div className="mt-4 flex justify-between">
              <div>
                {!isFirst && (
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                {isLast ? (
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Creating..." : "Create"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={stepIndex === 0 && !data.title.trim()}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
