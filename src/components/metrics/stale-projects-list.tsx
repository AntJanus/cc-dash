"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import type { StaleProject } from "@/lib/metrics/portfolio-metrics";

interface StaleProjectsListProps {
  projects: StaleProject[];
}

export function StaleProjectsList({ projects }: StaleProjectsListProps) {
  if (projects.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        All projects have been updated recently.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {projects.slice(0, 10).map((project) => (
        <Link
          key={project.slug}
          href={`/project/${project.slug}/roadmap`}
          className="flex items-center justify-between rounded-lg p-3 transition-colors hover:ring-1"
          style={{
            background: "var(--bg-accent)",
            // @ts-expect-error CSS custom property
            "--tw-ring-color": "var(--accent-amber)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: "var(--accent-amber-light)",
                color: "var(--accent-amber)",
              }}
            >
              <Clock className="h-4 w-4" />
            </div>
            <span
              className="text-sm font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {project.name}
            </span>
          </div>
          <span
            className="text-sm shrink-0 ml-3"
            style={{ color: "var(--text-muted)" }}
          >
            {project.daysSinceUpdate === -1
              ? "No update date"
              : `${project.daysSinceUpdate}d ago`}
          </span>
        </Link>
      ))}
    </div>
  );
}
