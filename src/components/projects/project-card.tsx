"use client";

import Link from "next/link";
import { ProgressRing } from "@/components/ui/progress-ring";
import { StatusBadge } from "@/components/shared/status-badge";
import { StaleBadge } from "@/components/shared/stale-badge";
import { RelativeTime } from "@/components/shared/relative-time";
import { PromptButton } from "@/components/prompt/prompt-button";
import type { ProjectCardData } from "@/lib/projects/get-projects";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: ProjectCardData;
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

const ICON_COLORS: Record<string, string> = {
  active: "var(--accent-teal-light)",
  stalled: "var(--accent-amber-light)",
  complete: "var(--accent-blue-light)",
  inactive: "var(--accent-violet-light)",
};

export function ProjectCard({ project }: ProjectCardProps) {
  const progressValue =
    project.totalCount > 0
      ? Math.round((project.doneCount / project.totalCount) * 100)
      : 0;

  const ringColor = STATUS_RING_COLORS[project.status] || "teal";
  const iconBg = ICON_COLORS[project.status] || "var(--accent-teal-light)";

  return (
    <Link href={`/project/${project.slug}/roadmap`} className="block group">
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-card p-5",
          "interactive-card",
          "dark:card-glow dark:gradient-border-top",
          "hover:border-[var(--accent-teal)] dark:hover:border-[var(--accent-cyan)]",
        )}
      >
        {/* Header with icon and badge */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-lg mb-2"
              style={{ background: iconBg }}
            >
              {getProjectEmoji(project.name)}
            </div>
            <h3
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {project.name}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <PromptButton slug={project.slug} />
            <StatusBadge status={project.status} />
          </div>
        </div>

        {/* Description */}
        <p
          className="text-sm leading-relaxed mb-4 line-clamp-2"
          style={{ color: "var(--text-secondary)" }}
        >
          {project.description}
        </p>

        {/* Progress section */}
        <div className="flex items-center gap-3.5 mb-4">
          <ProgressRing
            value={progressValue}
            size={52}
            strokeWidth={5}
            color={ringColor}
          />
          <div className="flex-1">
            <p
              className="text-sm mb-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              Completion
            </p>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {project.doneCount} / {project.totalCount} tasks
            </p>
          </div>
        </div>

        {/* Session status text */}
        {project.hasActiveSession && project.sessionStatusText && (
          <p
            className="text-sm mb-3"
            style={{ color: "var(--accent-emerald)" }}
          >
            {project.sessionStatusText}
          </p>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3.5 border-t"
          style={{ borderColor: "var(--border-light)" }}
        >
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {project.lastUpdated ? (
              <RelativeTime iso={project.lastUpdated} />
            ) : (
              "No activity"
            )}
          </span>

          <div className="flex items-center gap-2">
            {project.isStale && <StaleBadge />}
            {project.hasActiveSession && (
              <span
                className="flex items-center gap-1.5 text-sm font-medium"
                style={{ color: "var(--accent-emerald)" }}
              >
                <span
                  className="h-2 w-2 rounded-full pulse-dot"
                  style={{ background: "var(--accent-emerald)" }}
                />
                Session active
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function getProjectEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("skill") || lower.includes("box")) return "🚀";
  if (lower.includes("alpha-app") || lower.includes("train")) return "🚂";
  if (lower.includes("tmux") || lower.includes("terminal")) return "⌨️";
  if (
    lower.includes("cash") ||
    lower.includes("money") ||
    lower.includes("finance")
  )
    return "💰";
  if (lower.includes("blog") || lower.includes("content")) return "📝";
  if (lower.includes("game") || lower.includes("rpg")) return "🎮";
  if (lower.includes("fish")) return "🐟";
  if (lower.includes("photo") || lower.includes("image")) return "📷";
  if (lower.includes("banner")) return "🎨";
  if (lower.includes("agent") || lower.includes("ai")) return "🤖";
  if (lower.includes("media")) return "🎬";
  if (lower.includes("dash") || lower.includes("board")) return "📊";
  if (lower.includes("cottage") || lower.includes("home")) return "🏠";
  if (lower.includes("start") || lower.includes("boil")) return "🏁";
  if (lower.includes("memory") || lower.includes("project-zeta")) return "🧠";
  if (lower.includes("idea")) return "💡";
  if (lower.includes("interactive") || lower.includes("learn")) return "📚";
  return "📦";
}
