"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StaleBadge } from "@/components/shared/stale-badge";
import { RelativeTime } from "@/components/shared/relative-time";
import type { ProjectCardData } from "@/lib/projects/get-projects";

interface ProjectBoardCardProps {
  project: ProjectCardData;
}

const STATUS_DOT_COLORS: Record<string, string> = {
  active: "bg-[var(--status-active)]",
  stalled: "bg-[var(--status-stalled)]",
  complete: "bg-[var(--status-complete)]",
  inactive: "bg-[var(--status-inactive)]",
};

export function ProjectBoardCard({ project }: ProjectBoardCardProps) {
  const progressValue =
    project.totalCount > 0
      ? Math.round((project.doneCount / project.totalCount) * 100)
      : 0;

  return (
    <Link href={`/project/${project.slug}/roadmap`} className="block">
      <Card
        size="sm"
        className="transition-all duration-200 hover:ring-2 hover:ring-foreground/10"
      >
        <CardHeader>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT_COLORS[project.status] ?? STATUS_DOT_COLORS.inactive}`}
            />
            <CardTitle>{project.name}</CardTitle>
            {project.hasActiveSession && (
              <span
                data-testid="active-session-dot"
                className="h-2 w-2 shrink-0 rounded-full bg-green-500"
                aria-label="Active session"
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {project.description && (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {project.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <Progress value={progressValue} className="flex-1" />
            <span className="shrink-0 text-xs text-muted-foreground">
              {project.doneCount}/{project.totalCount}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {project.lastUpdated ? (
                <>
                  Updated <RelativeTime iso={project.lastUpdated} />
                </>
              ) : (
                "No activity"
              )}
            </span>
            {project.isStale && <StaleBadge />}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
