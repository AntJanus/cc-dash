"use client";

import { Progress } from "@/components/ui/progress";
import { DependencyBadge } from "@/components/shared/dependency-badge";
import type { SessionTask } from "@/lib/schemas/session";
import { cn } from "@/lib/utils";

interface TaskSectionProps {
  tasks: SessionTask[];
  taskNames: Record<string, string>;
}

export function TaskSection({ tasks, taskNames }: TaskSectionProps) {
  const completedCount = tasks.filter((t) => t.checked).length;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {completedCount}/{totalCount} tasks
        </span>
        <Progress value={percentage} className="flex-1" />
      </div>

      <ul className="space-y-1">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              checked={task.checked}
              disabled
              className="h-4 w-4 rounded border-gray-300"
              readOnly
            />
            <span
              className={cn(
                "text-sm",
                task.checked && "line-through opacity-50",
              )}
            >
              {task.description}
            </span>
            {task.dependency !== "none" && (
              <DependencyBadge
                depends={[task.dependency]}
                itemNames={taskNames}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
