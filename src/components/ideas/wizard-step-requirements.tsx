"use client";

/**
 * Wizard Step 4: Requirements — captures project requirements as a dynamic list.
 *
 * Uses WizardListInput for add/remove functionality.
 */

import { WizardListInput } from "@/components/ideas/wizard-list-input";
import type { WizardData } from "@/components/ideas/wizard-types";

interface WizardStepRequirementsProps {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export function WizardStepRequirements({
  data,
  onChange,
}: WizardStepRequirementsProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        List the key requirements or features this project must have.
      </p>
      <WizardListInput
        items={data.requirements}
        onChange={(items) => onChange({ requirements: items })}
        label="Requirements"
        placeholder="Add a requirement..."
      />
    </div>
  );
}
