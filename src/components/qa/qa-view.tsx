import { QaItemRow } from "@/components/qa/qa-item-row";
import type { QaFile } from "@/lib/schemas/qa";

interface QaViewProps {
  qa: QaFile;
  slug: string;
  hasRoadmap: boolean;
}

interface Counts {
  pending: number;
  passed: number;
  failed: number;
  needsDecision: number;
  skipped: number;
}

function tally(qa: QaFile): Counts {
  const counts: Counts = {
    pending: 0,
    passed: 0,
    failed: 0,
    needsDecision: 0,
    skipped: 0,
  };
  for (const item of qa.items) {
    switch (item.status) {
      case "pending":
        counts.pending++;
        break;
      case "passed":
        counts.passed++;
        break;
      case "failed":
        counts.failed++;
        break;
      case "needs-decision":
        counts.needsDecision++;
        break;
      case "skipped":
        counts.skipped++;
        break;
    }
  }
  return counts;
}

export function QaView({ qa, slug, hasRoadmap }: QaViewProps) {
  const counts = tally(qa);
  const total = qa.items.length;
  const completed = total - counts.pending;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{completed}</span>{" "}
            of {total} reviewed
          </span>
          <span>·</span>
          <span>{counts.pending} pending</span>
          {counts.passed > 0 && (
            <>
              <span>·</span>
              <span className="text-green-700 dark:text-green-400">
                {counts.passed} passed
              </span>
            </>
          )}
          {counts.failed > 0 && (
            <>
              <span>·</span>
              <span className="text-red-700 dark:text-red-400">
                {counts.failed} failed
              </span>
            </>
          )}
          {counts.needsDecision > 0 && (
            <>
              <span>·</span>
              <span className="text-amber-700 dark:text-amber-400">
                {counts.needsDecision} needs decision
              </span>
            </>
          )}
          {counts.skipped > 0 && (
            <>
              <span>·</span>
              <span>{counts.skipped} skipped</span>
            </>
          )}
        </div>
        {!hasRoadmap && counts.pending > 0 && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            This project has no ROADMAP.md, so failing an item won&apos;t be
            able to file an issue. Add a roadmap before running QA.
          </p>
        )}
      </header>

      {qa.setup && (
        <section className="rounded-md border bg-muted/30 px-4 py-3">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Setup</h2>
          <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground">
            {qa.setup}
          </pre>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Checklist
        </h2>
        {qa.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No QA items in this file yet.
          </p>
        ) : (
          <ol className="space-y-2">
            {qa.items.map((item) => (
              <QaItemRow key={item.id} item={item} slug={slug} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
