import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { NextActionLine } from "@/components/projects/next-action-line";
import { getCompletionPercent } from "@/lib/projects/get-projects";
import { StickyNote } from "@/components/ui/sticky-note";
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
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <div className="flex shrink-0 items-center gap-3 md:w-56 md:flex-col md:items-start md:pt-3">
        <Image
          src="/today/glyph-up-next.png"
          alt=""
          width={200}
          height={200}
          className="ink-art h-16 w-16 shrink-0"
        />
        <div>
          <p className="almanac-eyebrow-label mb-1">Recommended</p>
          <h2 className="almanac-section-title">Up Next</h2>
          <p
            className="mt-1 text-sm italic"
            style={{ color: "var(--text-muted)" }}
          >
            Two picks weighted by activity, actionability, and freshness.
          </p>
        </div>
      </div>

      <StickyNote
        color="butter"
        tilt="right"
        decoration="pin"
        decorationPosition="top-left"
        className="flex-1 max-w-2xl"
      >
        {picks.length === 0 ? (
          <p
            className="text-base py-6 text-center italic"
            style={{ color: "var(--text-muted)" }}
          >
            {emptyMessage}
          </p>
        ) : (
          <ol className="m-0 list-none space-y-1 p-0">
            {picks.map((pick, index) => (
              <li key={pick.project.slug}>
                <RecommendedRow pick={pick} ordinal={index + 1} />
              </li>
            ))}
          </ol>
        )}
      </StickyNote>
    </div>
  );
}

function RecommendedRow({
  pick,
  ordinal,
}: {
  pick: RecommendedPick;
  ordinal: number;
}) {
  const pct = Math.round(getCompletionPercent(pick.project));
  const labels = pick.whyTags
    .map((tag) => TAG_LABELS[tag] ?? tag)
    .filter(Boolean);

  return (
    <Link
      href={`/project/${pick.project.slug}/roadmap`}
      className="group flex items-start gap-4 rounded-md px-2 py-3 transition-colors hover:bg-[rgba(64,54,41,0.04)]"
    >
      <span className="almanac-marginalia-num pt-0.5 select-none">
        {ordinal}.
      </span>

      <ProgressRing value={pct} size={40} strokeWidth={4} color="teal" />

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
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {labels.map((label) => (
              <span
                key={label}
                className="rounded-full px-2 py-0.5 text-sm font-medium"
                style={{
                  background: "rgba(64, 54, 41, 0.08)",
                  color: "var(--ink)",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <ArrowRight
        className="mt-1 h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: "var(--text-muted)" }}
      />
    </Link>
  );
}
