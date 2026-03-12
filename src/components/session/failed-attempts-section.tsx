"use client";

import type { FailedAttempt } from "@/lib/schemas/session";

interface FailedAttemptsSectionProps {
  failedAttempts: FailedAttempt[];
  taskNames: Record<string, string>;
}

export function FailedAttemptsSection({
  failedAttempts,
  taskNames,
}: FailedAttemptsSectionProps) {
  if (failedAttempts.length === 0) {
    return <p className="text-sm text-muted-foreground">No failed attempts</p>;
  }

  return (
    <div className="space-y-3">
      {failedAttempts.map((attempt) => (
        <div
          key={attempt.id}
          className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30"
        >
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            {taskNames[attempt.taskRef] ?? attempt.taskRef}
          </div>
          <p className="text-sm">{attempt.description}</p>
        </div>
      ))}
    </div>
  );
}
