"use client";

import { useState, useTransition } from "react";
import { ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { unarchiveProject } from "@/lib/actions/archive-actions";
import type { ArchivedProjectInfo } from "@/lib/actions/archive-actions";

interface ArchivedProjectsSectionProps {
  initialProjects: ArchivedProjectInfo[];
}

/**
 * Settings section showing archived projects with Unarchive buttons.
 * Receives initial data as a prop (server-rendered); optimistically removes
 * items from the list on unarchive.
 */
export function ArchivedProjectsSection({
  initialProjects,
}: ArchivedProjectsSectionProps) {
  const [projects, setProjects] =
    useState<ArchivedProjectInfo[]>(initialProjects);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleUnarchive(slug: string) {
    // Optimistic: remove from list immediately
    const previous = projects;
    setProjects((prev) => prev.filter((p) => p.slug !== slug));
    setErrorMessage(null);

    startTransition(async () => {
      const result = await unarchiveProject(slug);
      if (!result.success) {
        // Rollback on failure
        setProjects(previous);
        setErrorMessage(result.error);
      }
    });
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Archived Projects</h2>

      {projects.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No archived projects.
        </p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li
              key={project.slug}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {project.name}
                </p>
                <p
                  className="text-sm truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {project.path}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleUnarchive(project.slug)}
                className="ml-4 shrink-0 gap-1.5"
              >
                <ArchiveRestore className="h-3.5 w-3.5" />
                Unarchive
              </Button>
            </li>
          ))}
        </ul>
      )}

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
    </section>
  );
}
