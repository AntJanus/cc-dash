"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionPanel,
} from "@/components/ui/accordion";
import { SessionHeader } from "@/components/session/session-header";
import { TaskSection } from "@/components/session/task-section";
import { DecisionsSection } from "@/components/session/decisions-section";
import { FailedAttemptsSection } from "@/components/session/failed-attempts-section";
import { CompletedWorkSection } from "@/components/session/completed-work-section";
import { VerificationSection } from "@/components/session/verification-section";
import { updateSessionStatus } from "@/lib/actions/update-session-status";
import type { SessionFile } from "@/lib/schemas/session";
import type { UnknownSection } from "@/lib/fs/types";

interface SessionViewProps {
  session: SessionFile;
  slug: string;
  verificationSections: UnknownSection[];
  taskNames: Record<string, string>;
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
  taskNames,
}: SessionViewProps) {
  const [expandedSections, setExpandedSections] =
    useState<string[]>(DEFAULT_EXPANDED);
  const [currentStatus, setCurrentStatus] = useState(session.status);

  const allExpanded = expandedSections.length === ALL_SECTIONS.length;

  const checkedCount = session.tasks.filter((t) => t.checked).length;
  const totalCount = session.tasks.length;

  async function handleStatusChange(newStatus: string) {
    const previousStatus = currentStatus;
    setCurrentStatus(newStatus);

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
          className="text-sm text-primary hover:underline"
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
            <TaskSection tasks={session.tasks} taskNames={taskNames} />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="current-status">
          <AccordionHeader>
            <AccordionTrigger>Current Status</AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel data-testid="current-status-panel">
            <pre className="whitespace-pre-wrap text-sm">
              {session.currentStatus}
            </pre>
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
