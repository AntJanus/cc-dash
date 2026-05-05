import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { QaPortfolioCard } from "@/components/qa/qa-portfolio-card";
import type { QaPortfolioCard as QaPortfolioCardData } from "@/lib/projects/get-qa-portfolio";

function makeCard(
  overrides: Partial<QaPortfolioCardData> = {},
): QaPortfolioCardData {
  return {
    slug: "project-beta",
    name: "project-beta",
    lastUpdated: "2026-05-04T10:00:00Z",
    hasRoadmap: true,
    total: 10,
    pending: 4,
    passed: 5,
    failed: 1,
    needsDecision: 0,
    skipped: 0,
    upcomingPreview: ["First check", "Second check"],
    ...overrides,
  };
}

describe("QaPortfolioCard", () => {
  afterEach(() => cleanup());

  it("links to the per-project QA page", () => {
    render(<QaPortfolioCard card={makeCard()} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/project/project-beta/qa");
  });

  it("shows the project name and percent done", () => {
    render(<QaPortfolioCard card={makeCard()} />);
    expect(screen.getByText("project-beta")).toBeInTheDocument();
    // 6/10 = 60%
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("renders preview items for pending checks", () => {
    render(<QaPortfolioCard card={makeCard()} />);
    expect(screen.getByText(/First check/)).toBeInTheDocument();
    expect(screen.getByText(/Second check/)).toBeInTheDocument();
  });

  it("warns when the project has no ROADMAP.md and pending items remain", () => {
    render(
      <QaPortfolioCard card={makeCard({ hasRoadmap: false, pending: 2 })} />,
    );
    expect(screen.getByText(/No ROADMAP\.md/)).toBeInTheDocument();
  });

  it("does NOT warn when there are no pending items even without a roadmap", () => {
    render(
      <QaPortfolioCard
        card={makeCard({
          hasRoadmap: false,
          pending: 0,
          passed: 10,
          total: 10,
        })}
      />,
    );
    expect(screen.queryByText(/No ROADMAP\.md/)).not.toBeInTheDocument();
  });

  it("renders 0% when total is 0 (empty checklist)", () => {
    render(
      <QaPortfolioCard
        card={makeCard({ total: 0, pending: 0, passed: 0, failed: 0 })}
      />,
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
