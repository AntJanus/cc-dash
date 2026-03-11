"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { StaleBadge } from "@/components/shared/stale-badge";
import { RelativeTime } from "@/components/shared/relative-time";
import type { ProjectCardData } from "@/lib/projects/get-projects";

interface ProjectCardProps {
  project: ProjectCardData;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const progressValue =
    project.totalCount > 0
      ? Math.round((project.doneCount / project.totalCount) * 100)
      : 0;

  return (
    <Link href={`/project/${project.slug}/roadmap`} className="block">
      <Card className="transition-colors hover:border-foreground/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {project.hasActiveSession && (
                <span
                  data-testid="active-session-dot"
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500"
                  aria-label="Active session"
                />
              )}
              <CardTitle>{project.name}</CardTitle>
            </div>
            <StatusBadge status={project.status} />
          </div>
          <CardDescription>{project.description}</CardDescription>
        </CardHeader>

        <CardContent>
          <Progress value={progressValue} />
          <p className="mt-2 text-sm text-muted-foreground">
            {project.doneCount} / {project.totalCount} items
          </p>
          {project.hasActiveSession && project.sessionStatusText && (
            <p className="mt-1 text-sm text-green-700 dark:text-green-400">
              {project.sessionStatusText}
            </p>
          )}
        </CardContent>

        <CardFooter>
          <div className="flex w-full items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {project.lastUpdated ? (
                <RelativeTime iso={project.lastUpdated} />
              ) : (
                "No activity"
              )}
            </span>
            {project.isStale && <StaleBadge />}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
