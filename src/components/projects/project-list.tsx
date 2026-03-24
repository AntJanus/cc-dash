"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatusBadge } from "@/components/shared/status-badge";
import { RelativeTime } from "@/components/shared/relative-time";
import type { ProjectCardData } from "@/lib/projects/get-projects";

interface ProjectListProps {
  projects: ProjectCardData[];
  searchQuery?: string;
}

const STATUS_RING_COLORS: Record<
  string,
  "teal" | "violet" | "amber" | "blue" | "emerald"
> = {
  active: "teal",
  stalled: "amber",
  complete: "blue",
  inactive: "violet",
};

export function ProjectList({ projects, searchQuery = "" }: ProjectListProps) {
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [projects, searchQuery]);

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center" style={{ color: "var(--text-muted)" }}>
        <p>No projects found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div
        className="grid grid-cols-[1fr_100px_120px_100px_120px] gap-4 px-4 py-2 text-sm font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        <span>Project</span>
        <span className="text-center">Progress</span>
        <span className="text-center">Status</span>
        <span className="text-center">Tasks</span>
        <span className="text-right">Updated</span>
      </div>

      {/* Rows */}
      <div className="space-y-1">
        {filtered.map((project) => (
          <ProjectListRow key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
}

function ProjectListRow({ project }: { project: ProjectCardData }) {
  const progressValue =
    project.totalCount > 0
      ? Math.round((project.doneCount / project.totalCount) * 100)
      : 0;

  const ringColor = STATUS_RING_COLORS[project.status] || "teal";

  return (
    <Link
      href={`/project/${project.slug}/roadmap`}
      className="grid grid-cols-[1fr_100px_120px_100px_120px] gap-4 items-center px-4 py-3 rounded-lg border border-border bg-card transition-all hover:border-[var(--accent-teal)] hover:shadow-md dark:hover:shadow-[0_0_20px_var(--accent-cyan-dim)]"
    >
      {/* Project name and description */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {project.name}
          </span>
          {project.hasActiveSession && (
            <span
              className="h-2 w-2 rounded-full pulse-dot flex-shrink-0"
              style={{ background: "var(--accent-emerald)" }}
            />
          )}
        </div>
        <p className="text-sm truncate" style={{ color: "var(--text-muted)" }}>
          {project.description}
        </p>
      </div>

      {/* Progress ring */}
      <div className="flex justify-center">
        <ProgressRing
          value={progressValue}
          size={40}
          strokeWidth={4}
          color={ringColor}
        />
      </div>

      {/* Status badge */}
      <div className="flex justify-center">
        <StatusBadge status={project.status} />
      </div>

      {/* Task count */}
      <div className="text-center">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {project.doneCount}/{project.totalCount}
        </span>
      </div>

      {/* Last updated */}
      <div className="text-right">
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {project.lastUpdated ? (
            <RelativeTime iso={project.lastUpdated} />
          ) : (
            "No activity"
          )}
        </span>
      </div>
    </Link>
  );
}
