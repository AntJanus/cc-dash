"use client";

/**
 * Wizard Step 5: Inspirations & References.
 *
 * Captures a dynamic list of inspirations using WizardListInput.
 * Examples: existing projects, games, tools, or design references.
 */

import type { WizardData } from "./wizard-types";
import { WizardListInput } from "./wizard-list-input";

interface WizardStepInspirationsProps {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export function WizardStepInspirations({
  data,
  onChange,
}: WizardStepInspirationsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Inspirations & References</h2>
        <p className="text-sm text-muted-foreground">
          What existing projects, games, or tools inspire this idea?
        </p>
      </div>
      <WizardListInput
        items={data.inspirations}
        onChange={(items) => onChange({ inspirations: items })}
        label="Inspirations"
        placeholder="Add an inspiration..."
      />
    </div>
  );
}
