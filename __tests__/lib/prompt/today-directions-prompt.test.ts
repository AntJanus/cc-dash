import { describe, it, expect } from "vitest";
import { assembleTodayDirectionsPrompt } from "@/lib/prompt/today-directions-prompt";
import type { ProjectCardData } from "@/lib/projects/get-projects";
import type { RecommendedPick } from "@/lib/projects/pick-recommended";

const NOW = new Date("2026-05-07T12:00:00-06:00");

function makeProject(
  overrides: Partial<ProjectCardData> = {},
): ProjectCardData {
  return {
    slug: "p",
    name: "Project",
    description: "",
    path: "/Users/user/projects/p",
    doneCount: 0,
    totalCount: 10,
    hasActiveSession: false,
    sessionStatusText: null,
    lastUpdated: NOW.toISOString(),
    isStale: false,
    status: "active",
    portfolioStatus: "active",
    portfolioOrder: undefined,
    canvasPosition: undefined,
    nextAction: null,
    ...overrides,
  };
}

function makePick(overrides: Partial<RecommendedPick> = {}): RecommendedPick {
  return {
    project: makeProject(),
    score: 7,
    whyTags: ["active", "actionable", "warm"],
    ...overrides,
  };
}

describe("assembleTodayDirectionsPrompt", () => {
  it("defaults the output file to the default orchestrator dir", () => {
    const prompt = assembleTodayDirectionsPrompt({
      now: NOW,
      sessionsToday: [],
      topQa: [],
      recommended: [],
    });
    expect(prompt).toContain("~/projects/TODAYS_DIRECTIONS.md");
  });

  it("honors a configured orchestrator dir for the output file path", () => {
    const prompt = assembleTodayDirectionsPrompt({
      now: NOW,
      sessionsToday: [],
      topQa: [],
      recommended: [],
      orchestratorDir: "~/portfolio",
    });
    expect(prompt).toContain("~/portfolio/TODAYS_DIRECTIONS.md");
    expect(prompt).not.toContain("~/projects/TODAYS_DIRECTIONS.md");
  });

  it("includes the cc-dash/today-directions@1 schema literal", () => {
    const prompt = assembleTodayDirectionsPrompt({
      now: NOW,
      sessionsToday: [],
      topQa: [],
      recommended: [],
    });
    expect(prompt).toContain("cc-dash/today-directions@1");
  });

  it("embeds today's calendar date", () => {
    const prompt = assembleTodayDirectionsPrompt({
      now: NOW,
      sessionsToday: [],
      topQa: [],
      recommended: [],
    });
    expect(prompt).toContain("2026-05-07");
  });

  it("lists every session touched today with its working-on line", () => {
    const prompt = assembleTodayDirectionsPrompt({
      now: NOW,
      sessionsToday: [
        makeProject({
          slug: "project-beta",
          name: "project-beta",
          sessionStatusText: "Validating skill index",
        }),
        makeProject({
          slug: "theta-blog",
          name: "theta-blog",
          sessionStatusText: "Drafting Almanac post",
        }),
      ],
      topQa: [],
      recommended: [],
    });
    expect(prompt).toContain("project-beta");
    expect(prompt).toContain("Validating skill index");
    expect(prompt).toContain("theta-blog");
    expect(prompt).toContain("Drafting Almanac post");
  });

  it("includes top QA items with exact ref-marker format", () => {
    const prompt = assembleTodayDirectionsPrompt({
      now: NOW,
      sessionsToday: [],
      topQa: [
        {
          qaId: "q_aaaaa",
          slug: "project-beta",
          projectName: "project-beta",
          description: "Validate skill loads",
        },
      ],
      recommended: [],
    });
    expect(prompt).toContain("ref:q_aaaaa slug:project-beta");
    expect(prompt).toContain("Validate skill loads");
  });

  it("emits cd commands and the why-tags for each recommended project", () => {
    const prompt = assembleTodayDirectionsPrompt({
      now: NOW,
      sessionsToday: [],
      topQa: [],
      recommended: [
        makePick({
          project: makeProject({
            slug: "project-gamma",
            name: "project-gamma",
            path: "/Users/user/projects/project-gamma",
            nextAction: {
              id: "r_aaaaa",
              name: "Add CLI flag for dry-run",
              source: "roadmap-planned",
            },
          }),
        }),
      ],
    });
    expect(prompt).toContain("cd ~/projects/project-gamma");
    expect(prompt).toContain("Add CLI flag for dry-run");
  });

  it("instructs the agent to write the file", () => {
    const prompt = assembleTodayDirectionsPrompt({
      now: NOW,
      sessionsToday: [],
      topQa: [],
      recommended: [],
    });
    expect(prompt.toLowerCase()).toContain("write");
  });
});
