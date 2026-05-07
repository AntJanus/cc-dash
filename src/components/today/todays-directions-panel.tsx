import { ListChecks, FileText } from "lucide-react";
import type { TodayDirections } from "@/lib/projects/get-today-directions";
import { QaCheckboxRow } from "@/components/today/qa-checkbox-row";
import { TodayDirectionsPromptButton } from "@/components/today/todays-directions-prompt-button";
import { RelativeTime } from "@/components/shared/relative-time";

interface TodaysDirectionsPanelProps {
  directions: TodayDirections | null;
  /** Map of project slug to display name, used to label QA rows. */
  projectNames: Map<string, string>;
}

export function TodaysDirectionsPanel({
  directions,
  projectNames,
}: TodaysDirectionsPanelProps) {
  if (!directions) {
    return <EmptyState />;
  }

  const pendingRefs = directions.qaRefs.filter((ref) => !ref.checked);
  const completedCount = directions.qaRefs.length - pendingRefs.length;

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

      <details>
        <summary
          className="cursor-pointer text-sm font-semibold"
          style={{ color: "var(--text-muted)" }}
        >
          Full directions (markdown source)
        </summary>
        <pre
          className="mt-3 overflow-x-auto rounded-md p-4 text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            background: "var(--bg-subtle, var(--bg-card))",
            border: "1px solid var(--border-light)",
            color: "var(--text-primary)",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}
        >
          {directions.body}
        </pre>
      </details>
    </section>
  );
}

function EmptyState() {
  return (
    <section
      className="rounded-xl p-6 mb-6"
      style={{
        background: "var(--bg-card)",
        border: "1px dashed var(--border-light)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
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
            No directions for today yet. Generate a prompt, paste it into a
            Claude session at <code>~/projects</code>, and the agent
            will write <code>~/projects/TODAYS_DIRECTIONS.md</code> for
            this page to render.
          </p>
        </div>
        <TodayDirectionsPromptButton variant="primary" />
      </div>
    </section>
  );
}
