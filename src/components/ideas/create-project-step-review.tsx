"use client";

import { Badge } from "@/components/ui/badge";
import type { CreateProjectData } from "./create-project-types";

interface StepReviewProps {
  data: CreateProjectData;
  onChange: (updates: Partial<CreateProjectData>) => void;
}

/**
 * Step 3: Review all choices before creating the project.
 */
export function CreateProjectStepReview({ data, onChange }: StepReviewProps) {
  const fullPath = `${data.targetDir}/${data.directoryName}`;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">
          Project Name
        </h3>
        <p className="text-base font-semibold">{data.projectName}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground">Directory</h3>
        <p className="font-mono text-sm">{fullPath}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground">
          Description
        </h3>
        <p className="text-sm">{data.description || "(none)"}</p>
      </div>

      {data.stack.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Stack</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {data.stack.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {data.categories.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Roadmap Categories
          </h3>
          <div className="space-y-2">
            {data.categories.map((cat) => {
              const items = data.starterItems.filter(
                (i) => i.categorySlug === cat.slug,
              );
              return (
                <div key={cat.slug}>
                  <p className="text-sm font-medium">{cat.title}</p>
                  {items.length > 0 && (
                    <ul className="ml-4 mt-1 list-disc text-sm text-muted-foreground">
                      {items.map((item, idx) => (
                        <li key={idx}>{item.name}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
          Files to Create
        </h3>
        <ul className="ml-4 list-disc text-sm">
          <li>ROADMAP.md</li>
          <li>CLAUDE.md</li>
          <li>README.md</li>
          <li>.claude/settings.local.json</li>
          {data.createSession && <li>SESSION_PROGRESS.md</li>}
        </ul>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={data.createSession}
          onChange={(e) => onChange({ createSession: e.target.checked })}
          className="size-4 rounded border-input"
        />
        Create initial SESSION_PROGRESS.md
      </label>
    </div>
  );
}
