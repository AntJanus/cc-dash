import Link from "next/link";
import { ListChecks, FileText, Activity, AlertTriangle } from "lucide-react";
import type { TodayDirections } from "@/lib/projects/get-today-directions";
import type { ProjectCardData } from "@/lib/projects/get-projects";
import type { TopPendingQaItem } from "@/lib/projects/get-qa-portfolio";
import { isDirectionsStale } from "@/lib/projects/today-staleness";
import { QaCheckboxRow } from "@/components/today/qa-checkbox-row";
import { TodayDirectionsPromptButton } from "@/components/today/todays-directions-prompt-button";
import { DirectionsBody } from "@/components/today/directions-body";
import { RelativeTime } from "@/components/shared/relative-time";

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

export function TodaysDirectionsPanel({
  directions,
  projectNames,
  sessionsToday,
  topPendingQa,
  now = new Date(),
}: TodaysDirectionsPanelProps) {
  if (!directions) {
    return (
      <EmptyState sessionsToday={sessionsToday} topPendingQa={topPendingQa} />
    );
  }

  const pendingRefs = directions.qaRefs.filter((ref) => !ref.checked);
  const completedCount = directions.qaRefs.length - pendingRefs.length;
  const stale = isDirectionsStale(directions.frontmatter.for_date, now);

  return (
    <section
      className="rounded-xl p-5 mb-6"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-light)",
      }}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText
              className="h-5 w-5"
              style={{ color: "var(--text-muted)" }}
            />
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Today&apos;s Directions
            </h2>
            <span
              className="rounded-full px-2 py-0.5 text-sm"
              style={{
                background: "var(--bg-subtle, var(--bg-card))",
                color: "var(--text-muted)",
                border: "1px solid var(--border-light)",
              }}
            >
              {directions.frontmatter.for_date}
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Generated <RelativeTime iso={directions.frontmatter.generated} />
            {" · "}
            {directions.qaRefs.length > 0 ? (
              <>
                QA: {completedCount}/{directions.qaRefs.length} done
              </>
            ) : (
              "No QA items"
            )}
          </p>
        </div>
        <TodayDirectionsPromptButton variant="ghost" label="Regenerate" />
      </header>

      {stale ? <StaleBanner forDate={directions.frontmatter.for_date} /> : null}

      {directions.qaRefs.length > 0 ? (
        <div
          className="rounded-lg p-4 mb-4"
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
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              QA items today
            </h3>
          </div>
          <ul className="space-y-2">
            {directions.qaRefs.map((ref) => (
              <QaCheckboxRow
                key={ref.qaId}
                qaId={ref.qaId}
                slug={ref.slug}
                description={ref.description}
                checked={ref.checked}
                projectName={projectNames.get(ref.slug)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <DirectionsBody body={directions.body} />
    </section>
  );
}

interface EmptyStateProps {
  sessionsToday: ProjectCardData[];
  topPendingQa: TopPendingQaItem[];
}

function EmptyState({ sessionsToday, topPendingQa }: EmptyStateProps) {
  return (
    <section
      className="rounded-xl p-6 mb-6"
      style={{
        background: "var(--bg-card)",
        border: "1px dashed var(--border-light)",
      }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-prose">
          <div className="flex items-center gap-2">
            <FileText
              className="h-5 w-5"
              style={{ color: "var(--text-muted)" }}
            />
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Today&apos;s Directions
            </h2>
          </div>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            No directions written yet. Live signal below; click{" "}
            <strong>Generate Today&apos;s Directions</strong> to assemble a
            prompt for a Claude agent at <code>~/projects</code>.
          </p>
        </div>
        <TodayDirectionsPromptButton variant="primary" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SessionsTodayCard projects={sessionsToday} />
        <TopQaCard items={topPendingQa} />
      </div>
    </section>
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
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
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
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
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
