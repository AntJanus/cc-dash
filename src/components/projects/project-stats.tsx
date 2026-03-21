"use client";

import type { ProjectCardData } from "@/lib/projects/get-projects";

interface ProjectStatsProps {
  projects: ProjectCardData[];
}

export function ProjectStats({ projects }: ProjectStatsProps) {
  const total = projects.length;
  const activeSessions = projects.filter((p) => p.hasActiveSession).length;
  const stalledCount = projects.filter((p) => p.status === "stalled").length;
  const avgProgress =
    total > 0
      ? Math.round(
          projects.reduce((sum, p) => {
            const pct =
              p.totalCount > 0
                ? Math.round((p.doneCount / p.totalCount) * 100)
                : 0;
            return sum + pct;
          }, 0) / total,
        )
      : 0;

  return (
    <div className="mb-4 flex items-center gap-6 text-base text-muted-foreground">
      <span>
        <strong className="text-foreground">{total}</strong> projects
      </span>
      <span>
        <strong className="text-foreground">{activeSessions}</strong> active
        sessions
      </span>
      <span>
        <strong className="text-foreground">{stalledCount}</strong> stalled
      </span>
      <span>
        <strong className="text-foreground">{avgProgress}%</strong> avg progress
      </span>
    </div>
  );
}
