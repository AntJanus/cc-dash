import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { TodayDirections } from "@/lib/projects/get-today-directions";
import type { ProjectCardData } from "@/lib/projects/get-projects";
import type { TopPendingQaItem } from "@/lib/projects/get-qa-portfolio";

// Stub the children that touch server actions / next-navigation. We
// don't want their internals to bleed into structural tests of the
// panel; we just need to know they were rendered with the right props.
vi.mock("@/components/today/qa-checkbox-row", () => ({
  QaCheckboxRow: ({
    qaId,
    description,
  }: {
    qaId: string;
    description: string;
  }) => (
    <li data-testid={`qa-row-${qaId}`}>
      {qaId}: {description}
    </li>
  ),
}));

vi.mock("@/components/today/todays-directions-prompt-button", () => ({
  TodayDirectionsPromptButton: ({ label }: { label?: string }) => (
    <button>{label ?? "Generate Today's Directions"}</button>
  ),
}));

vi.mock("@/components/shared/relative-time", () => ({
  RelativeTime: ({ iso }: { iso: string }) => <span>at {iso}</span>,
}));

import { TodaysDirectionsPanel } from "@/components/today/todays-directions-panel";

const NOW = new Date("2026-05-07T12:00:00-06:00");

function makeDirections(
  overrides: Partial<TodayDirections> = {},
): TodayDirections {
  return {
    frontmatter: {
      schema: "cc-dash/today-directions@1",
      generated: "2026-05-07T08:30:00-06:00",
      for_date: "2026-05-07",
    },
    body: "## Active sessions to advance\n- prd-board",
    filePath: "/test/TODAYS_DIRECTIONS.md",
    qaRefs: [],
    ...overrides,
  };
}

function makeProject(
  overrides: Partial<ProjectCardData> = {},
): ProjectCardData {
  return {
    slug: "p",
    name: "Project",
    description: "",
    path: "/tmp/p",
    doneCount: 0,
    totalCount: 10,
    hasActiveSession: false,
    sessionStatusText: null,
    lastUpdated: null,
    isStale: false,
    status: "active",
    portfolioStatus: "active",
    portfolioOrder: undefined,
    canvasPosition: undefined,
    nextAction: null,
    ...overrides,
  };
}

const PROJECT_NAMES = new Map([
  ["project-beta", "project-beta"],
  ["project-gamma", "project-gamma"],
]);

describe("TodaysDirectionsPanel", () => {
  afterEach(cleanup);

  describe("empty state (directions = null)", () => {
    it("renders the dashed-border CTA card with the primary button", () => {
      render(
        <TodaysDirectionsPanel
          directions={null}
          projectNames={PROJECT_NAMES}
          sessionsToday={[]}
          topPendingQa={[]}
          now={NOW}
        />,
      );
      expect(
        screen.getByText(/No directions written yet/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Generate Today's Directions/i }),
      ).toBeInTheDocument();
    });

    it("shows live sessions touched today as a list of project links", () => {
      render(
        <TodaysDirectionsPanel
          directions={null}
          projectNames={PROJECT_NAMES}
          sessionsToday={[
            makeProject({
              slug: "project-beta",
              name: "project-beta",
              hasActiveSession: true,
              sessionStatusText: "Validating index",
            }),
          ]}
          topPendingQa={[]}
          now={NOW}
        />,
      );
      expect(
        screen.getByText(/Sessions touched today \(1\)/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/Validating index/)).toBeInTheDocument();
      const link = screen.getByRole("link", { name: /project-beta/i });
      expect(link).toHaveAttribute("href", "/project/project-beta/session");
    });

    it("shows top pending QA items with deep links to each project's QA page", () => {
      const items: TopPendingQaItem[] = [
        {
          slug: "project-beta",
          projectName: "project-beta",
          description: "Validate skill loads",
        },
      ];
      render(
        <TodaysDirectionsPanel
          directions={null}
          projectNames={PROJECT_NAMES}
          sessionsToday={[]}
          topPendingQa={items}
          now={NOW}
        />,
      );
      expect(screen.getByText(/Top pending QA \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Validate skill loads/i)).toBeInTheDocument();
      const link = screen.getByRole("link", { name: /project-beta/i });
      expect(link).toHaveAttribute("href", "/project/project-beta/qa");
    });

    it("shows fallback empty messages when both lists are empty", () => {
      render(
        <TodaysDirectionsPanel
          directions={null}
          projectNames={PROJECT_NAMES}
          sessionsToday={[]}
          topPendingQa={[]}
          now={NOW}
        />,
      );
      expect(
        screen.getByText(/No sessions updated today yet/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/No pending QA items across the portfolio/i),
      ).toBeInTheDocument();
    });
  });

  describe("populated state", () => {
    it("renders the for_date pill and QA progress count", () => {
      render(
        <TodaysDirectionsPanel
          directions={makeDirections({
            qaRefs: [
              {
                qaId: "q_aaaaa",
                slug: "project-beta",
                checked: false,
                description: "First check",
              },
              {
                qaId: "q_bbbbb",
                slug: "project-beta",
                checked: true,
                description: "Second check (already done)",
              },
            ],
          })}
          projectNames={PROJECT_NAMES}
          sessionsToday={[]}
          topPendingQa={[]}
          now={NOW}
        />,
      );
      expect(screen.getByText("2026-05-07")).toBeInTheDocument();
      expect(screen.getByText(/QA: 1\/2 done/i)).toBeInTheDocument();
    });

    it("renders one QaCheckboxRow per ref, in order", () => {
      render(
        <TodaysDirectionsPanel
          directions={makeDirections({
            qaRefs: [
              {
                qaId: "q_aaaaa",
                slug: "project-beta",
                checked: false,
                description: "One",
              },
              {
                qaId: "q_bbbbb",
                slug: "project-beta",
                checked: false,
                description: "Two",
              },
            ],
          })}
          projectNames={PROJECT_NAMES}
          sessionsToday={[]}
          topPendingQa={[]}
          now={NOW}
        />,
      );
      expect(screen.getByTestId("qa-row-q_aaaaa")).toBeInTheDocument();
      expect(screen.getByTestId("qa-row-q_bbbbb")).toBeInTheDocument();
    });

    it("hides the QA card section when there are zero QA refs", () => {
      render(
        <TodaysDirectionsPanel
          directions={makeDirections({ qaRefs: [] })}
          projectNames={PROJECT_NAMES}
          sessionsToday={[]}
          topPendingQa={[]}
          now={NOW}
        />,
      );
      expect(screen.queryByText(/QA items today/i)).not.toBeInTheDocument();
      expect(screen.getByText(/No QA items/i)).toBeInTheDocument();
    });

    it("renders the Regenerate button (not the primary one)", () => {
      render(
        <TodaysDirectionsPanel
          directions={makeDirections()}
          projectNames={PROJECT_NAMES}
          sessionsToday={[]}
          topPendingQa={[]}
          now={NOW}
        />,
      );
      expect(
        screen.getByRole("button", { name: /Regenerate/i }),
      ).toBeInTheDocument();
    });

    it("shows the StaleBanner when for_date is older than now", () => {
      render(
        <TodaysDirectionsPanel
          directions={makeDirections({
            frontmatter: {
              schema: "cc-dash/today-directions@1",
              generated: "2026-05-06T08:30:00-06:00",
              for_date: "2026-05-06",
            },
          })}
          projectNames={PROJECT_NAMES}
          sessionsToday={[]}
          topPendingQa={[]}
          now={NOW}
        />,
      );
      expect(screen.getByText(/Directions are stale/i)).toBeInTheDocument();
      expect(
        screen.getByText(/regenerate to refresh today's plan/i),
      ).toBeInTheDocument();
    });

    it("does NOT show the StaleBanner when for_date matches today", () => {
      render(
        <TodaysDirectionsPanel
          directions={makeDirections()}
          projectNames={PROJECT_NAMES}
          sessionsToday={[]}
          topPendingQa={[]}
          now={NOW}
        />,
      );
      expect(
        screen.queryByText(/Directions are stale/i),
      ).not.toBeInTheDocument();
    });
  });
});
