"use client";

/**
 * Wizard Step 2: Type & Stack — captures project type via select
 * and tech stack via comma-separated text input.
 *
 * Receives WizardData and onChange callback from the wizard container.
 */

import { Input } from "@/components/ui/input";
import type { WizardData, ProjectType } from "@/components/ideas/wizard-types";

interface WizardStepTypeProps {
  data: WizardData;
  onChange: (updates: Partial<WizardData>) => void;
}

export function WizardStepType({ data, onChange }: WizardStepTypeProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="wiz-type" className="mb-1 block text-sm font-medium">
          Project Type
        </label>
        <select
          id="wiz-type"
          value={data.projectType}
          onChange={(e) =>
            onChange({ projectType: e.target.value as ProjectType })
          }
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="game">Game</option>
          <option value="tool">Tool/CLI</option>
          <option value="webapp">Web App</option>
          <option value="library">Library</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="wiz-stack" className="mb-1 block text-sm font-medium">
          Stack (comma-separated)
        </label>
        <Input
          id="wiz-stack"
          value={data.stack.join(", ")}
          onChange={(e) =>
            onChange({
              stack: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="TypeScript, React, Node"
        />
      </div>
    </div>
  );
}
