import { getQaPortfolio } from "@/lib/projects/get-qa-portfolio";
import { QaPortfolioGrid } from "@/components/qa/qa-portfolio-grid";

export default async function QaPortfolioPage() {
  const cards = await getQaPortfolio();

  const totalPending = cards.reduce((sum, card) => sum + card.pending, 0);
  const reposWithPending = cards.filter((card) => card.pending > 0).length;

  return (
    <div className="p-8 lg:p-10">
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold">Manual QA</h1>
        <p className="text-sm text-muted-foreground">
          {totalPending} pending {totalPending === 1 ? "item" : "items"} across{" "}
          {reposWithPending} {reposWithPending === 1 ? "project" : "projects"}.
        </p>
      </header>
      <QaPortfolioGrid cards={cards} />
    </div>
  );
}
