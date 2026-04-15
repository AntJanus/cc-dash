"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import type { ActiveProject } from "@/lib/metrics/portfolio-metrics";

interface MostActiveListProps {
  projects: ActiveProject[];
}

export function MostActiveList({ projects }: MostActiveListProps) {
  if (projects.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No recent activity to show.
      </p>
    );
  }

  const maxCompletions = Math.max(
    ...projects.map((p) => p.recentCompletions),
    1,
  );

  return (
    <div className="space-y-2">
      {projects.map((project) => {
        const barPct = (project.recentCompletions / maxCompletions) * 100;

        return (
          <Link
            key={project.slug}
            href={`/project/${project.slug}/roadmap`}
            className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:ring-1"
            style={{
              background: "var(--bg-accent)",
              // @ts-expect-error CSS custom property
              "--tw-ring-color": "var(--accent-teal)",
            }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: "var(--accent-teal-light)",
                color: "var(--accent-teal)",
              }}
            >
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1">
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {project.name}
                </span>
                <span
                  className="text-sm shrink-0 ml-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {project.recentCompletions} items
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--border-light)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${barPct}%`,
                    background: "var(--accent-teal)",
                  }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
