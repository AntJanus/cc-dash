import Image from "next/image";
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
  /** Lucide icon — used as fallback when glyphSrc is not provided. */
  icon: React.ElementType;
  /** Almanac glyph image — preferred over icon when present. */
  glyphSrc?: string;
  accent: LaneAccent;
  projects: ProjectCardData[];
  emptyMessage: string;
  showNextAction?: boolean;
}

export function PulseLane({
  title,
  subtitle,
  icon: Icon,
  glyphSrc,
  accent,
  projects,
  emptyMessage,
  showNextAction = false,
}: PulseLaneProps) {
  return (
    <section className="flex flex-col">
      <div
        className="self-start rounded-t-lg border border-b-0 px-4 py-2"
        style={{
          background: "var(--bg-paper-2)",
          borderColor: "var(--border)",
          boxShadow: "inset 0 -2px 0 var(--accent-gold)",
        }}
      >
        <h3 className="almanac-lane-title">{title}</h3>
      </div>

      <div
        className="rounded-r-xl rounded-bl-xl p-5 flex-1"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
        }}
      >
        <div className="mb-4 flex items-start gap-3">
          {glyphSrc ? (
            <Image
              src={glyphSrc}
              alt=""
              width={200}
              height={200}
              className="ink-art h-12 w-12 shrink-0"
            />
          ) : (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: `var(--accent-${accent}-light)`,
                color: `var(--accent-${accent})`,
              }}
            >
              <Icon className="h-4 w-4" />
            </div>
          )}
          <p
            className="pt-1 text-sm italic leading-snug"
            style={{ color: "var(--text-muted)" }}
          >
            {subtitle}
          </p>
        </div>

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
      </div>
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
