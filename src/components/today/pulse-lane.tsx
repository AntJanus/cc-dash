import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProjectCardData } from "@/lib/projects/get-projects";
import { getCompletionPercent } from "@/lib/projects/get-projects";
import { ProgressRing } from "@/components/ui/progress-ring";
import { RelativeTime } from "@/components/shared/relative-time";
import { NextActionLine } from "@/components/projects/next-action-line";

type LaneAccent = "teal" | "emerald" | "blue" | "amber" | "violet";

interface PulseLaneProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  accent: LaneAccent;
  projects: ProjectCardData[];
  emptyMessage: string;
  showNextAction?: boolean;
}

export function PulseLane({
  title,
  subtitle,
  icon: Icon,
  accent,
  projects,
  emptyMessage,
  showNextAction = false,
}: PulseLaneProps) {
  return (
    <section
      className="rounded-xl p-5"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
      }}
    >
      <header className="flex items-center gap-2 mb-4">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{
            background: `var(--accent-${accent}-light)`,
            color: `var(--accent-${accent})`,
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2
            className="text-base font-semibold leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        </div>
      </header>

      {projects.length === 0 ? (
        <p
          className="text-sm py-4 text-center italic"
          style={{ color: "var(--text-muted)" }}
        >
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.slug}>
              <PulseRow
                project={project}
                showNextAction={showNextAction}
                accent={accent}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface PulseRowProps {
  project: ProjectCardData;
  showNextAction: boolean;
  accent: LaneAccent;
}

function PulseRow({ project, showNextAction, accent }: PulseRowProps) {
  const pct = Math.round(getCompletionPercent(project));

  return (
    <Link
      href={`/project/${project.slug}/roadmap`}
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--bg-hover,var(--bg-card))]"
      style={{ border: "1px solid transparent" }}
    >
      <ProgressRing value={pct} size={36} strokeWidth={4} color={accent} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className="text-base font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {project.name}
          </p>
          <span
            className="text-sm shrink-0"
            style={{ color: "var(--text-muted)" }}
          >
            {project.doneCount}/{project.totalCount}
          </span>
        </div>

        {showNextAction && project.nextAction ? (
          <NextActionLine action={project.nextAction} />
        ) : (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {project.lastUpdated ? (
              <>
                Updated <RelativeTime iso={project.lastUpdated} />
              </>
            ) : (
              "No activity yet"
            )}
          </p>
        )}
      </div>

      <ArrowRight
        className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: "var(--text-muted)" }}
      />
    </Link>
  );
}
