"use client";

/**
 * Wizard Step 1: Concept — captures title (required) and elevator pitch (optional).
 *
 * Receives WizardData and onChange callback from the wizard container.
 */

import { Input } from "@/components/ui/input";
import type { WizardData } from "@/components/ideas/wizard-types";

interface WizardStepConceptProps {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export function WizardStepConcept({ data, onChange }: WizardStepConceptProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="wiz-title" className="mb-1 block text-sm font-medium">
          Title *
        </label>
        <Input
          id="wiz-title"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          required
          placeholder="Project name"
        />
      </div>

      <div>
        <label htmlFor="wiz-pitch" className="mb-1 block text-sm font-medium">
          Elevator Pitch
        </label>
        <textarea
          id="wiz-pitch"
          value={data.pitch}
          onChange={(e) => onChange({ pitch: e.target.value })}
          placeholder="One-line description of your idea"
          className="min-h-[80px] w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
    </div>
  );
}
