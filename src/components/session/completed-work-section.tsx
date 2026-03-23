"use client";

import { RelativeTime } from "@/components/shared/relative-time";
import type { CompletionEntry } from "@/lib/schemas/session";

interface CompletedWorkSectionProps {
  completedWork: CompletionEntry[];
  taskNames: Record<string, string>;
}

export function CompletedWorkSection({
  completedWork,
  taskNames,
}: CompletedWorkSectionProps) {
  if (completedWork.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No completed work recorded
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {completedWork.map((entry, index) => (
        <div
          key={index}
          className="flex items-start gap-3 border-l-2 border-l-green-500 pl-3"
        >
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <RelativeTime iso={entry.timestamp} />
              <span className="font-medium">
                {taskNames[entry.taskRef] ?? entry.taskRef}
              </span>
            </div>
            <p className="text-sm">{entry.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
