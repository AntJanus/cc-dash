"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { DependencyBadge } from "@/components/shared/dependency-badge";
import { EditableText } from "@/components/roadmap/editable-text";
import { ReorderButtons } from "@/components/roadmap/reorder-buttons";
import { TaskActionsMenu } from "@/components/session/task-actions-menu";
import { TaskDependencySelect } from "@/components/session/task-dependency-select";
import { Button } from "@/components/ui/button";
import type { SessionTask } from "@/lib/schemas/session";
import { cn } from "@/lib/utils";

interface TaskSectionProps {
  tasks: SessionTask[];
  taskNames: Record<string, string>;
  onToggle?: (taskId: string) => void;
  onEditDescription?: (taskId: string, description: string) => void;
  onDelete?: (taskId: string) => void;
  onMoveUp?: (taskId: string) => void;
  onMoveDown?: (taskId: string) => void;
  onSetDependency?: (taskId: string, dependency: string) => void;
}

export function TaskSection({
  tasks,
  taskNames,
  onToggle,
  onEditDescription,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSetDependency,
}: TaskSectionProps) {
  const [editingDependencyTaskId, setEditingDependencyTaskId] = useState<
    string | null
  >(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const completedCount = tasks.filter((t) => t.checked).length;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const hasCrud = Boolean(onToggle);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {completedCount}/{totalCount} tasks
        </span>
        <Progress value={percentage} className="flex-1" />
      </div>

      <ul className="space-y-1">
        {tasks.map((task, index) => (
          <li key={task.id} className="flex items-center gap-2 py-1">
            {hasCrud && onMoveUp && onMoveDown && (
              <ReorderButtons
                onMoveUp={() => onMoveUp(task.id)}
                onMoveDown={() => onMoveDown(task.id)}
                isFirst={index === 0}
                isLast={index === tasks.length - 1}
              />
            )}
            <input
              type="checkbox"
              checked={task.checked}
              disabled={!hasCrud}
              readOnly={!hasCrud}
              onChange={() => onToggle?.(task.id)}
              className="h-4 w-4 rounded border-gray-300"
            />
            {hasCrud && onEditDescription ? (
              <EditableText
                value={task.description}
                onSave={(newDesc) => onEditDescription(task.id, newDesc)}
                className={cn(
                  "text-sm",
                  task.checked && "line-through text-muted-foreground",
                )}
              />
            ) : (
              <span
                className={cn(
                  "text-sm",
                  task.checked && "line-through text-muted-foreground",
                )}
              >
                {task.description}
              </span>
            )}
            {task.dependency !== "none" && (
              <DependencyBadge
                depends={[task.dependency]}
                itemNames={taskNames}
              />
            )}
            {hasCrud && onDelete && onSetDependency && (
              <>
                <TaskActionsMenu
                  onEdit={() => {
                    // EditableText handles its own edit mode via click
                  }}
                  onDelete={() => {
                    setDeletingTaskId(task.id);
                  }}
                  onSetDependency={() => {
                    setEditingDependencyTaskId(task.id);
                  }}
                />
                {deletingTaskId === task.id && (
                  <div
                    role="alertdialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center"
                  >
                    <div
                      className="fixed inset-0 bg-black/10"
                      onClick={() => setDeletingTaskId(null)}
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-xl bg-background p-4 ring-1 ring-foreground/10 shadow-lg">
                      <h2 className="text-base font-medium">
                        Delete &quot;{task.description}&quot;?
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        This will remove the task from the session file. This
                        action cannot be undone.
                      </p>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDeletingTaskId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            onDelete(task.id);
                            setDeletingTaskId(null);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {editingDependencyTaskId === task.id && onSetDependency && (
              <TaskDependencySelect
                currentTaskId={task.id}
                tasks={tasks.map((t) => ({
                  id: t.id,
                  description: t.description,
                }))}
                value={task.dependency}
                onChange={(dep) => {
                  onSetDependency(task.id, dep);
                  setEditingDependencyTaskId(null);
                }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
