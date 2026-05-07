import { describe, it, expect } from "vitest";
import { getPortfolioPulse } from "@/lib/projects/get-portfolio-pulse";
import type { ProjectCardData } from "@/lib/projects/get-projects";

const NOW = new Date("2026-05-01T12:00:00Z");

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
    lastUpdated: daysAgo(1),
    isStale: false,
    status: "active",
    portfolioStatus: "active",
    portfolioOrder: undefined,
    canvasPosition: undefined,
    nextAction: null,
    ...overrides,
  };
}

describe("getPortfolioPulse — nearlyDone lane", () => {
  it("includes projects at 80%+ but not 100%", () => {
    const projects = [
      makeProject({ slug: "a", doneCount: 8, totalCount: 10 }), // 80%
      makeProject({ slug: "b", doneCount: 7, totalCount: 10 }), // 70%
      makeProject({ slug: "c", doneCount: 10, totalCount: 10 }), // 100%
      makeProject({ slug: "d", doneCount: 9, totalCount: 10 }), // 90%
    ];
    const { nearlyDone } = getPortfolioPulse(projects, { now: NOW });
    expect(nearlyDone.map((p) => p.slug).sort()).toEqual(["a", "d"]);
  });

  it("orders by completion percent descending (closest to done first)", () => {
    const projects = [
      makeProject({ slug: "p80", doneCount: 8, totalCount: 10 }),
      makeProject({ slug: "p95", doneCount: 95, totalCount: 100 }),
      makeProject({ slug: "p85", doneCount: 17, totalCount: 20 }),
    ];
    const { nearlyDone } = getPortfolioPulse(projects, { now: NOW });
    expect(nearlyDone.map((p) => p.slug)).toEqual(["p95", "p85", "p80"]);
  });

  it("excludes inactive portfolio projects even if 80%+", () => {
    const projects = [
      makeProject({
        slug: "shelved",
        doneCount: 9,
        totalCount: 10,
        portfolioStatus: "inactive",
      }),
      makeProject({ slug: "active", doneCount: 9, totalCount: 10 }),
    ];
    const { nearlyDone } = getPortfolioPulse(projects, { now: NOW });
    expect(nearlyDone.map((p) => p.slug)).toEqual(["active"]);
  });

  it("ignores projects with zero items (no roadmap)", () => {
    const projects = [makeProject({ slug: "empty", totalCount: 0 })];
    const { nearlyDone } = getPortfolioPulse(projects, { now: NOW });
    expect(nearlyDone).toEqual([]);
  });
});

describe("getPortfolioPulse — recentlyActive lane", () => {
  it("includes projects updated within the recent window", () => {
    const projects = [
      makeProject({ slug: "today", lastUpdated: daysAgo(0) }),
      makeProject({ slug: "yesterday", lastUpdated: daysAgo(1) }),
      makeProject({ slug: "old", lastUpdated: daysAgo(20) }),
    ];
    const { recentlyActive } = getPortfolioPulse(projects, { now: NOW });
    expect(recentlyActive.map((p) => p.slug)).toEqual(["today", "yesterday"]);
  });

  it("excludes projects updated outside the recent window", () => {
    const projects = [makeProject({ slug: "edge", lastUpdated: daysAgo(8) })];
    const { recentlyActive } = getPortfolioPulse(projects, { now: NOW });
    expect(recentlyActive).toEqual([]);
  });

  it("excludes 100%-complete projects (their recent touch was completion)", () => {
    const projects = [
      makeProject({
        slug: "shipped",
        lastUpdated: daysAgo(1),
        doneCount: 5,
        totalCount: 5,
      }),
      makeProject({
        slug: "moving",
        lastUpdated: daysAgo(1),
        doneCount: 2,
        totalCount: 5,
      }),
    ];
    const { recentlyActive } = getPortfolioPulse(projects, { now: NOW });
    expect(recentlyActive.map((p) => p.slug)).toEqual(["moving"]);
  });

  it("excludes projects with no lastUpdated", () => {
    const projects = [makeProject({ slug: "ghost", lastUpdated: null })];
    const { recentlyActive } = getPortfolioPulse(projects, { now: NOW });
    expect(recentlyActive).toEqual([]);
  });
});

describe("getPortfolioPulse — stalled lane", () => {
  it("includes projects untouched for staleDays or longer", () => {
    const projects = [
      makeProject({ slug: "fresh", lastUpdated: daysAgo(2) }),
      makeProject({ slug: "stale", lastUpdated: daysAgo(20) }),
      makeProject({ slug: "very-stale", lastUpdated: daysAgo(60) }),
    ];
    const { stalled } = getPortfolioPulse(projects, { now: NOW });
    // Most stale first
    expect(stalled.map((p) => p.slug)).toEqual(["very-stale", "stale"]);
  });

  it("includes projects with no lastUpdated (treated as oldest)", () => {
    const projects = [
      makeProject({ slug: "ghost", lastUpdated: null }),
      makeProject({ slug: "stale", lastUpdated: daysAgo(20) }),
    ];
    const { stalled } = getPortfolioPulse(projects, { now: NOW });
    expect(stalled[0].slug).toBe("ghost");
  });

  it("excludes complete projects (they're done, not stalled)", () => {
    const projects = [
      makeProject({
        slug: "done",
        status: "complete",
        lastUpdated: daysAgo(60),
      }),
      makeProject({
        slug: "real-stalled",
        status: "stalled",
        lastUpdated: daysAgo(60),
      }),
    ];
    const { stalled } = getPortfolioPulse(projects, { now: NOW });
    expect(stalled.map((p) => p.slug)).toEqual(["real-stalled"]);
  });

  it("excludes intentionally-inactive portfolio projects", () => {
    const projects = [
      makeProject({
        slug: "shelved",
        portfolioStatus: "inactive",
        lastUpdated: daysAgo(60),
      }),
      makeProject({
        slug: "neglected",
        portfolioStatus: "active",
        lastUpdated: daysAgo(60),
      }),
    ];
    const { stalled } = getPortfolioPulse(projects, { now: NOW });
    expect(stalled.map((p) => p.slug)).toEqual(["neglected"]);
  });

  it("respects custom staleDays threshold", () => {
    const projects = [makeProject({ slug: "p", lastUpdated: daysAgo(10) })];
    const tight = getPortfolioPulse(projects, { now: NOW, staleDays: 7 });
    const loose = getPortfolioPulse(projects, { now: NOW, staleDays: 30 });
    expect(tight.stalled.map((p) => p.slug)).toEqual(["p"]);
    expect(loose.stalled).toEqual([]);
  });
});

describe("getPortfolioPulse — defaults", () => {
  it("returns empty lanes when given no projects", () => {
    const lanes = getPortfolioPulse([], { now: NOW });
    expect(lanes).toEqual({
      nearlyDone: [],
      recentlyActive: [],
      stalled: [],
    });
  });

  it("caps each lane at 5 by default", () => {
    const projects = Array.from({ length: 10 }, (_, i) =>
      makeProject({
        slug: `p${i}`,
        lastUpdated: daysAgo(i % 5),
        doneCount: 9,
        totalCount: 10,
      }),
    );
    const lanes = getPortfolioPulse(projects, { now: NOW });
    expect(lanes.nearlyDone.length).toBeLessThanOrEqual(5);
    expect(lanes.recentlyActive.length).toBeLessThanOrEqual(5);
    expect(lanes.stalled.length).toBeLessThanOrEqual(5);
  });
});
