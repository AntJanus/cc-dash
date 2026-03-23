"use client";

/**
 * Wizard Step 3: Core Gameplay Loop — captures the primary gameplay loop via textarea.
 *
 * This component always renders its form content. The conditional display
 * (only for games) is handled by the wizard container, not by this component.
 */

import type { WizardData } from "@/components/ideas/wizard-types";

interface WizardStepCoreLoopProps {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export function WizardStepCoreLoop({
  data,
  onChange,
}: WizardStepCoreLoopProps) {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="wiz-core-loop"
          className="mb-1 block text-sm font-medium"
        >
          Core Gameplay Loop
        </label>
        <p className="mb-2 text-sm text-muted-foreground">
          Describe the primary gameplay loop — what the player does repeatedly
          and why it stays engaging.
        </p>
        <textarea
          id="wiz-core-loop"
          value={data.coreLoop}
          onChange={(e) => onChange({ coreLoop: e.target.value })}
          placeholder="e.g. Explore dungeon, fight monsters, collect loot, upgrade gear, go deeper"
          className="min-h-[80px] w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
    </div>
  );
}
