"use client";

import { Input } from "@/components/ui/input";
import type { CreateProjectData } from "./create-project-types";

interface StepNameProps {
  data: CreateProjectData;
  scanDirs: string[];
  onChange: (updates: Partial<CreateProjectData>) => void;
}

/**
 * Step 1: Project name, directory name, target directory, description, stack.
 */
export function CreateProjectStepName({
  data,
  scanDirs,
  onChange,
}: StepNameProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="cp-name" className="mb-1 block text-sm font-medium">
          Project Name
        </label>
        <Input
          id="cp-name"
          value={data.projectName}
          onChange={(e) => onChange({ projectName: e.target.value })}
          placeholder="My Project"
        />
      </div>

      <div>
        <label htmlFor="cp-dir" className="mb-1 block text-sm font-medium">
          Directory Name
        </label>
        <Input
          id="cp-dir"
          value={data.directoryName}
          onChange={(e) => onChange({ directoryName: e.target.value })}
          placeholder="my-project"
        />
        <p className="mt-1 text-sm text-muted-foreground">
          Folder name created under the target directory
        </p>
      </div>

      <div>
        <label htmlFor="cp-target" className="mb-1 block text-sm font-medium">
          Target Directory
        </label>
        <select
          id="cp-target"
          value={data.targetDir}
          onChange={(e) => onChange({ targetDir: e.target.value })}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {scanDirs.map((dir) => (
            <option key={dir} value={dir}>
              {dir}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cp-desc" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="cp-desc"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="One-line project description"
          rows={3}
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div>
        <label htmlFor="cp-stack" className="mb-1 block text-sm font-medium">
          Stack (comma-separated)
        </label>
        <Input
          id="cp-stack"
          value={data.stack.join(", ")}
          onChange={(e) =>
            onChange({
              stack: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="TypeScript, React"
        />
      </div>
    </div>
  );
}
