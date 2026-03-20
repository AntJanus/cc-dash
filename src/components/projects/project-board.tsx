"use client";

import { useMemo } from "react";
import { ProjectColumn } from "./project-column";
import type { ProjectCardData } from "@/lib/projects/get-projects";

const PROJECT_COLUMNS = [
  { status: "active", label: "Active", color: "var(--status-active)" },
  { status: "stalled", label: "Stalled", color: "var(--status-stalled)" },
  { status: "complete", label: "Complete", color: "var(--status-complete)" },
  { status: "inactive", label: "Inactive", color: "var(--status-inactive)" },
] as const;

interface ProjectBoardProps {
  projects: ProjectCardData[];
  searchQuery?: string;
}

export function ProjectBoard({
  projects,
  searchQuery = "",
}: ProjectBoardProps) {
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [projects, searchQuery]);

  const grouped = useMemo(() => {
    const map: Record<string, ProjectCardData[]> = {
      active: [],
      stalled: [],
      complete: [],
      inactive: [],
    };
    for (const p of filtered) {
      const bucket = map[p.status];
      if (bucket) bucket.push(p);
    }
    return map;
  }, [filtered]);

  return (
    <div
      data-testid="project-board"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      {PROJECT_COLUMNS.map((col) => (
        <ProjectColumn
          key={col.status}
          label={col.label}
          color={col.color}
          items={grouped[col.status] ?? []}
          defaultCollapsed={col.status === "complete"}
        />
      ))}
    </div>
  );
}
