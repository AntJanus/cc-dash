import Image from "next/image";
import Link from "next/link";
import { Activity, AlertTriangle, ListChecks } from "lucide-react";
import type { TodayDirections } from "@/lib/projects/get-today-directions";
import type { ProjectCardData } from "@/lib/projects/get-projects";
import type { TopPendingQaItem } from "@/lib/projects/get-qa-portfolio";
import { isDirectionsStale } from "@/lib/projects/today-staleness";
import { QaCheckboxRow } from "@/components/today/qa-checkbox-row";
import { TodayDirectionsPromptButton } from "@/components/today/todays-directions-prompt-button";
import { DirectionsBody } from "@/components/today/directions-body";
import { RelativeTime } from "@/components/shared/relative-time";
import { StickyNote, type StickyNoteColor } from "@/components/ui/sticky-note";

interface TodaysDirectionsPanelProps {
  directions: TodayDirections | null;
  /** Map of project slug to display name, used to label QA rows. */
  projectNames: Map<string, string>;
  /** Fallback live signal shown when directions is null. */
  sessionsToday: ProjectCardData[];
  topPendingQa: TopPendingQaItem[];
  /** Reference time for staleness; defaults to wall-clock now. */
  now?: Date;
}

const STICKY_COLORS: StickyNoteColor[] = [
  "butter",
  "sage",
  "blush",
  "apricot",
  "lavender",
  "mist",
];

const STICKY_TILTS = ["left", "none", "right"] as const;

export function TodaysDirectionsPanel({
  directions,
  projectNames,
  sessionsToday,
  topPendingQa,
  now = new Date(),
}: TodaysDirectionsPanelProps) {
  if (!directions) {
    return (
      <ParchmentShell variant="empty">
        <EmptyHeader />
        <div className="grid gap-4 sm:grid-cols-2">
          <SessionsTodayCard projects={sessionsToday} />
          <TopQaCard items={topPendingQa} />
        </div>
      </ParchmentShell>
    );
  }

  const pendingRefs = directions.qaRefs.filter((ref) => !ref.checked);
  const completedCount = directions.qaRefs.length - pendingRefs.length;
  const stale = isDirectionsStale(directions.frontmatter.for_date, now);

  return (
    <ParchmentShell>
      <PanelHeader
        forDate={directions.frontmatter.for_date}
        generatedIso={directions.frontmatter.generated}
        completedCount={completedCount}
        totalQa={directions.qaRefs.length}
      />

      <Divider />

      {stale ? <StaleBanner forDate={directions.frontmatter.for_date} /> : null}

      {directions.qaRefs.length > 0 ? (
        <section className="mb-6">
          <p className="almanac-eyebrow-label mb-3">QA items today</p>
          <div role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {directions.qaRefs.map((ref, index) => (
              <StickyNote
                key={ref.qaId}
                role="listitem"
                color={STICKY_COLORS[index % STICKY_COLORS.length]}
                tilt={STICKY_TILTS[index % STICKY_TILTS.length]}
                decoration="pin"
                decorationPosition={
                  index % 3 === 0
                    ? "top-left"
                    : index % 3 === 2
                      ? "top-right"
                      : "top-center"
                }
              >
                <QaCheckboxRow
                  as="div"
                  qaId={ref.qaId}
                  slug={ref.slug}
                  description={ref.description}
                  checked={ref.checked}
                  projectName={projectNames.get(ref.slug)}
                />
              </StickyNote>
            ))}
          </div>
        </section>
      ) : null}

      <DirectionsBody body={directions.body} />
    </ParchmentShell>
  );
}

function ParchmentShell({
  variant,
  children,
}: {
  variant?: "empty";
  children: React.ReactNode;
}) {
  return (
    <section
      className="relative mb-10 overflow-hidden rounded-2xl px-6 py-8 sm:px-10 sm:py-10"
      style={{
        background: "var(--bg-paper)",
        border:
          variant === "empty"
            ? "1px dashed var(--border-light)"
            : "1px solid var(--border)",
        boxShadow: "var(--elevation-paper)",
      }}
    >
      <CornerFlourish position="top-left" />
      <CornerFlourish position="top-right" />
      <CornerFlourish position="bottom-left" />
      <CornerFlourish position="bottom-right" />
      <div className="relative z-[1]">{children}</div>
    </section>
  );
}

function CornerFlourish({
  position,
}: {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const flipX = position.endsWith("right");
  const flipY = position.startsWith("bottom");
  const transform = `scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`;

  const positionStyle: React.CSSProperties = {
    position: "absolute",
    width: "120px",
    height: "120px",
    pointerEvents: "none",
    opacity: 0.55,
    transform,
    transformOrigin: "center",
  };
  if (position.startsWith("top")) positionStyle.top = "-8px";
  else positionStyle.bottom = "-8px";
  if (position.endsWith("left")) positionStyle.left = "-8px";
  else positionStyle.right = "-8px";

  return (
    <div className="ink-art" style={positionStyle} aria-hidden>
      <Image
        src="/today/corner-flourish.png"
        alt=""
        width={400}
        height={400}
        className="h-full w-full"
      />
    </div>
  );
}

function PanelHeader({
  forDate,
  generatedIso,
  completedCount,
  totalQa,
}: {
  forDate: string;
  generatedIso: string;
  completedCount: number;
  totalQa: number;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-5">
      <div className="flex items-center gap-4">
        <Image
          src="/today/seal-directions.png"
          alt=""
          width={240}
          height={240}
          className="h-20 w-20 shrink-0 sm:h-24 sm:w-24"
        />
        <div>
          <p className="almanac-eyebrow-label mb-1">Daily Plan</p>
          <h2 className="almanac-section-title">Today&apos;s Directions</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            <span className="font-medium">{forDate}</span>
            <span className="mx-2 opacity-60">·</span>
            Generated <RelativeTime iso={generatedIso} />
            <span className="mx-2 opacity-60">·</span>
            {totalQa > 0 ? (
              <>
                QA: {completedCount}/{totalQa} done
              </>
            ) : (
              "No QA items"
            )}
          </p>
        </div>
      </div>
      <TodayDirectionsPromptButton variant="ghost" label="Regenerate" />
    </header>
  );
}

function EmptyHeader() {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-5">
      <div className="max-w-prose">
        <p className="almanac-eyebrow-label mb-1">Daily Plan</p>
        <h2 className="almanac-section-title">Today&apos;s Directions</h2>
        <p
          className="mt-2 text-base"
          style={{ color: "var(--text-secondary)" }}
        >
          No directions written yet. Live signal below; click{" "}
          <strong>Generate Today&apos;s Directions</strong> to assemble a prompt
          for a Claude agent at <code>~/projects</code>.
        </p>
      </div>
      <TodayDirectionsPromptButton variant="primary" />
    </header>
  );
}

function Divider() {
  return (
    <div className="almanac-divider my-6">
      <Image
        src="/today/divider-sprig.png"
        alt=""
        width={1080}
        height={72}
        className="ink-art"
      />
    </div>
  );
}

function SessionsTodayCard({ projects }: { projects: ProjectCardData[] }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: "var(--bg-subtle, var(--bg-card))",
        border: "1px solid var(--border-light)",
      }}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <Activity className="h-4 w-4" style={{ color: "var(--accent-blue)" }} />
        <h3 className="almanac-eyebrow-label">
          Sessions touched today ({projects.length})
        </h3>
      </div>
      {projects.length === 0 ? (
        <p
          className="text-sm py-1 italic"
          style={{ color: "var(--text-muted)" }}
        >
          No sessions updated today yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {projects.map((project) => (
            <li key={project.slug}>
              <Link
                href={`/project/${project.slug}/session`}
                className="block rounded-md px-2 py-1 text-sm hover:bg-[var(--bg-hover,var(--bg-card))]"
                style={{ color: "var(--text-primary)" }}
              >
                <span className="font-semibold">{project.name}</span>
                {project.sessionStatusText ? (
                  <span style={{ color: "var(--text-muted)" }}>
                    {" — "}
                    {project.sessionStatusText}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StaleBanner({ forDate }: { forDate: string }) {
  return (
    <div
      className="mb-4 flex items-start gap-2.5 rounded-lg p-3"
      style={{
        background: "var(--accent-amber-light)",
        border: "1px solid var(--accent-amber)",
        color: "var(--accent-amber)",
      }}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">Directions are stale</p>
        <p className="mt-0.5" style={{ color: "var(--text-primary)" }}>
          This file is for <code>{forDate}</code>. Regenerate to refresh
          today&apos;s plan.
        </p>
      </div>
    </div>
  );
}

function TopQaCard({ items }: { items: TopPendingQaItem[] }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: "var(--bg-subtle, var(--bg-card))",
        border: "1px solid var(--border-light)",
      }}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <ListChecks
          className="h-4 w-4"
          style={{ color: "var(--accent-emerald)" }}
        />
        <h3 className="almanac-eyebrow-label">
          Top pending QA ({items.length})
        </h3>
      </div>
      {items.length === 0 ? (
        <p
          className="text-sm py-1 italic"
          style={{ color: "var(--text-muted)" }}
        >
          No pending QA items across the portfolio.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, index) => (
            <li key={`${item.slug}-${index}`}>
              <Link
                href={`/project/${item.slug}/qa`}
                className="block rounded-md px-2 py-1 text-sm hover:bg-[var(--bg-hover,var(--bg-card))]"
                style={{ color: "var(--text-primary)" }}
              >
                <span style={{ color: "var(--text-muted)" }}>
                  {item.projectName}
                </span>
                <span> — {item.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
