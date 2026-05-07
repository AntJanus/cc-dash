import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { NextActionLine } from "@/components/projects/next-action-line";
import { getCompletionPercent } from "@/lib/projects/get-projects";
import type { RecommendedPick } from "@/lib/projects/pick-recommended";

interface RecommendedLaneProps {
  picks: RecommendedPick[];
  emptyMessage?: string;
}

const TAG_LABELS: Record<string, string> = {
  active: "Active session",
  actionable: "Has next action",
  warm: "Recently warm",
};

export function RecommendedLane({
  picks,
  emptyMessage = "Nothing strongly recommended right now.",
}: RecommendedLaneProps) {
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
            background: "var(--accent-teal-light)",
            color: "var(--accent-teal)",
          }}
        >
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2
            className="text-base font-semibold leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Up Next
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Two picks weighted by activity, actionability, and freshness.
          </p>
        </div>
      </header>

      {picks.length === 0 ? (
        <p
          className="text-sm py-4 text-center italic"
          style={{ color: "var(--text-muted)" }}
        >
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2">
          {picks.map((pick) => (
            <li key={pick.project.slug}>
              <RecommendedRow pick={pick} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecommendedRow({ pick }: { pick: RecommendedPick }) {
  const pct = Math.round(getCompletionPercent(pick.project));
  const labels = pick.whyTags
    .map((tag) => TAG_LABELS[tag] ?? tag)
    .filter(Boolean);

  return (
    <Link
      href={`/project/${pick.project.slug}/roadmap`}
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--bg-hover,var(--bg-card))]"
      style={{ border: "1px solid transparent" }}
    >
      <ProgressRing value={pct} size={36} strokeWidth={4} color="teal" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className="text-base font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {pick.project.name}
          </p>
          <span
            className="text-sm shrink-0"
            style={{ color: "var(--text-muted)" }}
          >
            {pick.project.doneCount}/{pick.project.totalCount}
          </span>
        </div>

        {pick.project.nextAction ? (
          <NextActionLine action={pick.project.nextAction} />
        ) : null}

        {labels.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {labels.map((label) => (
              <span
                key={label}
                className="rounded-full px-2 py-0.5 text-sm"
                style={{
                  background: "var(--accent-teal-light)",
                  color: "var(--accent-teal)",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <ArrowRight
        className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: "var(--text-muted)" }}
      />
    </Link>
  );
}
