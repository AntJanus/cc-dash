"use client";

/**
 * Wizard Step 6: Open Questions.
 *
 * Captures a dynamic list of open questions/unknowns using WizardListInput.
 * This entire step is optional -- users can skip if they have no open questions.
 */

import type { WizardData } from "./wizard-types";
import { WizardListInput } from "./wizard-list-input";

interface WizardStepQuestionsProps {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export function WizardStepQuestions({
  data,
  onChange,
}: WizardStepQuestionsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Open Questions</h2>
        <p className="text-sm text-muted-foreground">
          What unknowns or decisions remain? (Optional - skip if none)
        </p>
      </div>
      <WizardListInput
        items={data.openQuestions}
        onChange={(items) => onChange({ openQuestions: items })}
        label="Open Questions"
        placeholder="Add a question..."
      />
    </div>
  );
}
