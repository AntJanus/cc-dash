import { QaPortfolioCard } from "@/components/qa/qa-portfolio-card";
import type { QaPortfolioCard as QaPortfolioCardData } from "@/lib/projects/get-qa-portfolio";

interface QaPortfolioGridProps {
  cards: QaPortfolioCardData[];
}

export function QaPortfolioGrid({ cards }: QaPortfolioGridProps) {
  if (cards.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        <p className="mb-2 text-base font-medium text-foreground">
          No QA queues found.
        </p>
        <p className="text-sm">
          Drop a <code className="rounded bg-muted px-1">QA.md</code> with{" "}
          <code className="rounded bg-muted px-1">cc-dash/qa@1</code>{" "}
          frontmatter into any project to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <QaPortfolioCard key={card.slug} card={card} />
      ))}
    </div>
  );
}
