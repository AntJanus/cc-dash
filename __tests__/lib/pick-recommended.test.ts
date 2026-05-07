import { describe, it, expect } from "vitest";
import {
  scoreProject,
  pickRecommendedProjects,
} from "@/lib/projects/pick-recommended";
import type { ProjectCardData } from "@/lib/projects/get-projects";

const NOW = new Date("2026-05-07T12:00:00Z");

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
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
    lastUpdated: daysAgo(3),
    isStale: false,
    status: "inactive",
    portfolioStatus: "active",
    portfolioOrder: undefined,
    canvasPosition: undefined,
    nextAction: null,
    ...overrides,
  };
}

const action = (name = "Do thing") => ({
  id: "r_aaaaa",
  name,
  source: "roadmap-planned" as const,
});

describe("scoreProject", () => {
  it("scores +3 for active status (active session or unchecked tasks)", () => {
    const result = scoreProject(makeProject({ status: "active" }), {
      now: NOW,
    });
    expect(result.score).toBeGreaterThanOrEqual(3);
    expect(result.whyTags).toContain("active");
  });

  it("scores +2 for having a nextAction", () => {
    const a = scoreProject(makeProject({ nextAction: null }), { now: NOW });
    const b = scoreProject(makeProject({ nextAction: action() }), { now: NOW });
    expect(b.score - a.score).toBe(2);
    expect(b.whyTags).toContain("actionable");
  });

  it("scores +1 for portfolio-active status", () => {
    const inactive = scoreProject(
      makeProject({ portfolioStatus: "inactive" }),
      { now: NOW },
    );
    const active = scoreProject(makeProject({ portfolioStatus: "active" }), {
      now: NOW,
    });
    // inactive triggers -3, active +1; difference is 4
    expect(active.score - inactive.score).toBe(4);
  });

  it("scores +1 for warm projects (touched in last 14 days)", () => {
    const cold = scoreProject(makeProject({ lastUpdated: daysAgo(30) }), {
      now: NOW,
    });
    const warm = scoreProject(makeProject({ lastUpdated: daysAgo(7) }), {
      now: NOW,
    });
    expect(warm.score - cold.score).toBe(1);
    expect(warm.whyTags).toContain("warm");
  });

  it("penalises -2 for projects touched today", () => {
    const today = scoreProject(makeProject({ lastUpdated: daysAgo(0) }), {
      now: NOW,
    });
    const yesterday = scoreProject(makeProject({ lastUpdated: daysAgo(1) }), {
      now: NOW,
    });
    expect(yesterday.score - today.score).toBe(2);
  });

  it("penalises -3 for complete projects", () => {
    const result = scoreProject(makeProject({ status: "complete" }), {
      now: NOW,
    });
    expect(result.score).toBeLessThan(0);
  });

  it("penalises -3 for portfolio-inactive projects", () => {
    const result = scoreProject(makeProject({ portfolioStatus: "inactive" }), {
      now: NOW,
    });
    expect(result.score).toBeLessThan(0);
  });

  it("a fully ideal candidate scores high and accumulates why-tags", () => {
    const ideal = makeProject({
      status: "active",
      portfolioStatus: "active",
      nextAction: action("Ship it"),
      lastUpdated: daysAgo(3),
    });
    const result = scoreProject(ideal, { now: NOW });
    // +3 active, +2 actionable, +1 portfolio-active, +1 warm = +7
    expect(result.score).toBe(7);
    expect(result.whyTags).toContain("active");
    expect(result.whyTags).toContain("actionable");
    expect(result.whyTags).toContain("warm");
  });
});

describe("pickRecommendedProjects", () => {
  function seqRandom(values: number[]): () => number {
    let i = 0;
    return () => values[i++ % values.length];
  }

  it("returns at most `limit` projects (default 2)", () => {
    const projects = Array.from({ length: 6 }, (_, i) =>
      makeProject({
        slug: `p${i}`,
        status: "active",
        nextAction: action(),
        lastUpdated: daysAgo(2),
      }),
    );
    const picks = pickRecommendedProjects(projects, { now: NOW });
    expect(picks).toHaveLength(2);
  });

  it("only picks from the top score bucket", () => {
    const projects = [
      makeProject({
        slug: "high",
        status: "active",
        nextAction: action(),
        lastUpdated: daysAgo(3),
      }),
      makeProject({ slug: "low", status: "complete", lastUpdated: daysAgo(0) }),
    ];
    const picks = pickRecommendedProjects(projects, {
      now: NOW,
      bucketSize: 4,
    });
    expect(picks.map((pick) => pick.project.slug)).toEqual(["high"]);
  });

  it("returns whyTags and score on each pick", () => {
    const projects = [
      makeProject({
        slug: "p",
        status: "active",
        nextAction: action(),
        lastUpdated: daysAgo(3),
      }),
    ];
    const picks = pickRecommendedProjects(projects, { now: NOW });
    expect(picks[0].score).toBe(7);
    expect(picks[0].whyTags).toContain("active");
    expect(picks[0].whyTags).toContain("actionable");
  });

  it("shuffles within the top bucket deterministically given a seeded random", () => {
    const projects = Array.from({ length: 4 }, (_, i) =>
      makeProject({
        slug: `p${i}`,
        status: "active",
        nextAction: action(),
        lastUpdated: daysAgo(3),
      }),
    );
    const picksA = pickRecommendedProjects(projects, {
      now: NOW,
      random: seqRandom([0.99, 0.5, 0.5, 0.5]),
    });
    const picksB = pickRecommendedProjects(projects, {
      now: NOW,
      random: seqRandom([0.01, 0.0, 0.0, 0.0]),
    });
    expect(picksA[0].project.slug).not.toBe(picksB[0].project.slug);
  });

  it("returns empty array when no projects qualify", () => {
    const picks = pickRecommendedProjects([], { now: NOW });
    expect(picks).toEqual([]);
  });

  it("excludes projects with negative scores by default", () => {
    const projects = [
      makeProject({
        slug: "shelved",
        portfolioStatus: "inactive",
        lastUpdated: daysAgo(60),
      }),
      makeProject({
        slug: "done",
        status: "complete",
        lastUpdated: daysAgo(60),
      }),
    ];
    const picks = pickRecommendedProjects(projects, { now: NOW });
    expect(picks).toEqual([]);
  });
});
