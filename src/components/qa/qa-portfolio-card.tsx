import Link from "next/link";
import type { QaPortfolioCard as QaPortfolioCardData } from "@/lib/projects/get-qa-portfolio";

interface QaPortfolioCardProps {
  card: QaPortfolioCardData;
}

export function QaPortfolioCard({ card }: QaPortfolioCardProps) {
  const completed = card.total - card.pending;
  const percentDone =
    card.total > 0 ? Math.round((completed / card.total) * 100) : 0;

  return (
    <Link
      href={`/project/${card.slug}/qa`}
      className="interactive-card flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-tight">{card.name}</h3>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {percentDone}%
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
        <span className="text-foreground">
          <span className="font-semibold">{card.pending}</span> pending
        </span>
        {card.passed > 0 && (
          <span className="text-green-700 dark:text-green-400">
            {card.passed} passed
          </span>
        )}
        {card.failed > 0 && (
          <span className="text-red-700 dark:text-red-400">
            {card.failed} failed
          </span>
        )}
        {card.needsDecision > 0 && (
          <span className="text-amber-700 dark:text-amber-400">
            {card.needsDecision} needs decision
          </span>
        )}
        {card.skipped > 0 && (
          <span className="text-muted-foreground">{card.skipped} skipped</span>
        )}
      </div>

      {card.upcomingPreview.length > 0 && (
        <ul className="space-y-1 text-sm text-muted-foreground">
          {card.upcomingPreview.map((preview, idx) => (
            <li key={idx} className="line-clamp-1">
              · {preview}
            </li>
          ))}
        </ul>
      )}

      {!card.hasRoadmap && card.pending > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          No ROADMAP.md — failures can&apos;t file issues
        </p>
      )}
    </Link>
  );
}
