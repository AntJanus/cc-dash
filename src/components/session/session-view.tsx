"use client";

import { useState, useCallback, useMemo } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionPanel,
} from "@/components/ui/accordion";
import { SessionHeader } from "@/components/session/session-header";
import { TaskSection } from "@/components/session/task-section";
import { SessionTaskForm } from "@/components/session/session-task-form";
import { DecisionsSection } from "@/components/session/decisions-section";
import { FailedAttemptsSection } from "@/components/session/failed-attempts-section";
import { CompletedWorkSection } from "@/components/session/completed-work-section";
import { VerificationSection } from "@/components/session/verification-section";
import { updateSessionStatus } from "@/lib/actions/update-session-status";
import {
  toggleTaskCheckbox,
  addSessionTask,
  updateSessionTask,
  deleteSessionTask,
  reorderSessionTasks,
  updateCurrentStatus,
} from "@/lib/actions/session-actions";
import type { SessionFile, SessionTask } from "@/lib/schemas/session";
import type { UnknownSection } from "@/lib/fs/types";

interface SessionViewProps {
  session: SessionFile;
  slug: string;
  verificationSections: UnknownSection[];
}

const ALL_SECTIONS = [
  "tasks",
  "current-status",
  "decisions",
  "failed-attempts",
  "completed-work",
  "verification",
];

const DEFAULT_EXPANDED = ["tasks", "current-status"];

export function SessionView({
  session,
  slug,
  verificationSections,
}: SessionViewProps) {
  const [expandedSections, setExpandedSections] =
    useState<string[]>(DEFAULT_EXPANDED);
  const [currentStatus, setCurrentStatus] = useState(session.status);

  // Task state management
  const [tasks, setTasks] = useState<SessionTask[]>(session.tasks);

  // Derive task names from local state so dependency badges stay fresh
  const taskNames = useMemo(() => {
    const names: Record<string, string> = {};
    for (const task of tasks) names[task.id] = task.description;
    return names;
  }, [tasks]);
  const [currentStatusText, setCurrentStatusText] = useState(
    session.currentStatus,
  );
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [editingCurrentStatus, setEditingCurrentStatus] = useState(false);

  const allExpanded = expandedSections.length === ALL_SECTIONS.length;

  const checkedCount = tasks.filter((t) => t.checked).length;
  const totalCount = tasks.length;

  async function handleStatusChange(newStatus: string) {
    const previousStatus = currentStatus;
    setCurrentStatus(
      newStatus as "in-progress" | "completed" | "paused" | "blocked",
    );

    const result = await updateSessionStatus(slug, newStatus);
    if (!result.success) {
      setCurrentStatus(previousStatus);
    }
  }

  function handleToggleAll() {
    if (allExpanded) {
      setExpandedSections([]);
    } else {
      setExpandedSections([...ALL_SECTIONS]);
    }
  }

  // --- Task CRUD handlers (optimistic pattern) ---

  const handleToggleTask = useCallback(
    async (taskId: string) => {
      const prev = tasks;
      setTasks((t) =>
        t.map((task) =>
          task.id === taskId ? { ...task, checked: !task.checked } : task,
        ),
      );

      const result = await toggleTaskCheckbox(slug, taskId);
      if (!result.success) {
        setTasks(prev);
      }
    },
    [slug, tasks],
  );

  const handleAddTask = useCallback(
    async (input: { description: string; dependency: string }) => {
      const result = await addSessionTask(slug, input);
      if (result.success) {
        const newTask: SessionTask = {
          id: result.data.id,
          checked: false,
          description: input.description,
          dependency: input.dependency,
        };
        setTasks((t) => [...t, newTask]);
        setShowAddTaskForm(false);
      }
    },
    [slug],
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, description: string) => {
      const prev = tasks;
      setTasks((t) =>
        t.map((task) => (task.id === taskId ? { ...task, description } : task)),
      );

      const result = await updateSessionTask(slug, taskId, { description });
      if (!result.success) {
        setTasks(prev);
      }
    },
    [slug, tasks],
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      const prev = tasks;
      setTasks((t) => t.filter((task) => task.id !== taskId));

      const result = await deleteSessionTask(slug, taskId);
      if (!result.success) {
        setTasks(prev);
      }
    },
    [slug, tasks],
  );

  const handleReorder = useCallback(
    async (taskId: string, direction: "up" | "down") => {
      const prev = tasks;
      const idx = tasks.findIndex((t) => t.id === taskId);
      if (idx === -1) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= tasks.length) return;

      const newTasks = [...tasks];
      [newTasks[idx], newTasks[swapIdx]] = [newTasks[swapIdx], newTasks[idx]];
      setTasks(newTasks);

      const orderedIds = newTasks.map((t) => t.id);
      const result = await reorderSessionTasks(slug, orderedIds);
      if (!result.success) {
        setTasks(prev);
      }
    },
    [slug, tasks],
  );

  const handleSetDependency = useCallback(
    async (taskId: string, dependency: string) => {
      const prev = tasks;
      setTasks((t) =>
        t.map((task) => (task.id === taskId ? { ...task, dependency } : task)),
      );

      const result = await updateSessionTask(slug, taskId, { dependency });
      if (!result.success) {
        setTasks(prev);
      }
    },
    [slug, tasks],
  );

  const handleSaveCurrentStatus = useCallback(
    async (newText: string) => {
      const prev = currentStatusText;
      setCurrentStatusText(newText);
      setEditingCurrentStatus(false);

      const result = await updateCurrentStatus(slug, newText);
      if (!result.success) {
        setCurrentStatusText(prev);
      }
    },
    [slug, currentStatusText],
  );

  return (
    <div>
      <SessionHeader
        sessionId={session.session_id}
        status={currentStatus}
        roadmapRef={session.roadmap_ref}
        started={session.started}
        lastUpdated={session.last_updated}
        slug={slug}
        onStatusChange={handleStatusChange}
      />

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={handleToggleAll}
          className="rounded-md border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {allExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>

      <Accordion
        value={expandedSections}
        onValueChange={(value) => setExpandedSections(value as string[])}
      >
        <AccordionItem value="tasks">
          <AccordionHeader>
            <AccordionTrigger>
              Tasks ({checkedCount}/{totalCount})
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel data-testid="tasks-panel">
            <div className="mb-2">
              {showAddTaskForm ? (
                <SessionTaskForm
                  onSubmit={handleAddTask}
                  onCancel={() => setShowAddTaskForm(false)}
                  existingTasks={tasks.map((t) => ({
                    id: t.id,
                    description: t.description,
                  }))}
                />
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddTaskForm(true)}
                >
                  Add Task
                </Button>
              )}
            </div>
            <TaskSection
              tasks={tasks}
              taskNames={taskNames}
              onToggle={handleToggleTask}
              onEditDescription={handleUpdateTask}
              onDelete={handleDeleteTask}
              onMoveUp={(id) => handleReorder(id, "up")}
              onMoveDown={(id) => handleReorder(id, "down")}
              onSetDependency={handleSetDependency}
            />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="current-status">
          <AccordionHeader>
            <AccordionTrigger>Current Status</AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel data-testid="current-status-panel">
            {editingCurrentStatus ? (
              <div className="space-y-2">
                <textarea
                  value={currentStatusText}
                  onChange={(e) => setCurrentStatusText(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50"
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveCurrentStatus(currentStatusText)}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentStatusText(session.currentStatus);
                      setEditingCurrentStatus(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="group cursor-pointer"
                onClick={() => setEditingCurrentStatus(true)}
              >
                <div className="flex items-start gap-2">
                  <pre className="flex-1 whitespace-pre-wrap text-sm">
                    {currentStatusText}
                  </pre>
                  <Pencil className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
                </div>
              </div>
            )}
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="decisions">
          <AccordionHeader>
            <AccordionTrigger>
              Decisions ({session.decisions.length})
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel data-testid="decisions-panel">
            <DecisionsSection decisions={session.decisions} />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="failed-attempts">
          <AccordionHeader>
            <AccordionTrigger>
              Failed Attempts ({session.failedAttempts.length})
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel data-testid="failed-attempts-panel">
            <FailedAttemptsSection
              failedAttempts={session.failedAttempts}
              taskNames={taskNames}
            />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="completed-work">
          <AccordionHeader>
            <AccordionTrigger>
              Completed Work ({session.completedWork.length})
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel data-testid="completed-work-panel">
            <CompletedWorkSection
              completedWork={session.completedWork}
              taskNames={taskNames}
            />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="verification">
          <AccordionHeader>
            <AccordionTrigger>Verification Results</AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel data-testid="verification-panel">
            <VerificationSection verificationSections={verificationSections} />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
