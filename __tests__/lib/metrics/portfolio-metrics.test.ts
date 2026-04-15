import { describe, it, expect } from "vitest";
import {
  computeStatusDistribution,
  computeItemCounts,
  computeVelocity,
  computeProgressDistribution,
  computeStaleProjects,
  computeMostActive,
  computePortfolioMetrics,
} from "@/lib/metrics/portfolio-metrics";
import type { ProjectCardData } from "@/lib/projects/get-projects";
import type { ActivityEvent } from "@/lib/activity/types";

/** Factory for minimal ProjectCardData. */
function makeProject(
  overrides: Partial<ProjectCardData> = {},
): ProjectCardData {
  return {
    slug: "test-project",
    name: "Test Project",
    description: "",
    path: "/tmp/test-project",
    doneCount: 0,
    totalCount: 10,
    hasActiveSession: false,
    sessionStatusText: null,
    lastUpdated: "2026-04-10T12:00:00Z",
    isStale: false,
    status: "inactive",
    portfolioStatus: "active",
    portfolioOrder: undefined,
    ...overrides,
  };
}

/** Factory for minimal ActivityEvent. */
function makeEvent(overrides: Partial<ActivityEvent> = {}): ActivityEvent {
  return {
    id: "evt-1",
    type: "roadmap_item_completed",
    timestamp: "2026-04-10T12:00:00Z",
    projectSlug: "test-project",
    projectName: "Test Project",
    title: "Completed: Something",
    ...overrides,
  };
}

describe("computeStatusDistribution", () => {
  it("counts projects by status", () => {
    const projects = [
      makeProject({ slug: "a", status: "active" }),
      makeProject({ slug: "b", status: "active" }),
      makeProject({ slug: "c", status: "stalled" }),
      makeProject({ slug: "d", status: "complete" }),
      makeProject({ slug: "e", status: "inactive" }),
    ];

    const dist = computeStatusDistribution(projects);
    expect(dist).toEqual({ active: 2, stalled: 1, complete: 1, inactive: 1 });
  });

  it("returns zeros for empty project list", () => {
    expect(computeStatusDistribution([])).toEqual({
      active: 0,
      stalled: 0,
      complete: 0,
      inactive: 0,
    });
  });
});

describe("computeItemCounts", () => {
  it("aggregates done and total counts across projects", () => {
    const projects = [
      makeProject({ doneCount: 5, totalCount: 10 }),
      makeProject({ doneCount: 3, totalCount: 8 }),
    ];

    const counts = computeItemCounts(projects);
    expect(counts.done).toBe(8);
    expect(counts.total).toBe(18);
    expect(counts.planned).toBe(10);
  });

  it("handles empty list", () => {
    const counts = computeItemCounts([]);
    expect(counts).toEqual({ done: 0, inProgress: 0, planned: 0, total: 0 });
  });
});

describe("computeVelocity", () => {
  const now = new Date("2026-04-15T12:00:00Z");

  it("returns correct number of week buckets", () => {
    const buckets = computeVelocity([], 8, now);
    expect(buckets).toHaveLength(8);
  });

  it("counts completions in the correct week bucket", () => {
    const events = [
      makeEvent({
        timestamp: "2026-04-14T10:00:00Z",
        type: "roadmap_item_completed",
      }),
      makeEvent({
        timestamp: "2026-04-13T10:00:00Z",
        type: "session_work_completed",
      }),
      makeEvent({
        timestamp: "2026-04-07T10:00:00Z",
        type: "roadmap_item_completed",
      }),
    ];

    const buckets = computeVelocity(events, 8, now);
    // Most recent bucket (last in array since oldest-first) should have the recent events
    const lastBucket = buckets[buckets.length - 1];
    expect(lastBucket.count).toBeGreaterThanOrEqual(1);
  });

  it("ignores non-completion events", () => {
    const events = [
      makeEvent({ timestamp: "2026-04-14T10:00:00Z", type: "session_started" }),
      makeEvent({
        timestamp: "2026-04-14T10:00:00Z",
        type: "roadmap_item_started",
      }),
    ];

    const buckets = computeVelocity(events, 4, now);
    expect(buckets.every((b) => b.count === 0)).toBe(true);
  });

  it("returns buckets in oldest-first order", () => {
    const buckets = computeVelocity([], 4, now);
    const starts = buckets.map((b) => b.weekStart);
    const sorted = [...starts].sort();
    expect(starts).toEqual(sorted);
  });

  it("each bucket has a human-readable label", () => {
    const buckets = computeVelocity([], 2, now);
    for (const b of buckets) {
      expect(b.label).toMatch(/\w+ \d+ – \w+ \d+/);
    }
  });
});

describe("computeProgressDistribution", () => {
  it("distributes projects into correct percentage buckets", () => {
    const projects = [
      makeProject({ slug: "a", doneCount: 0, totalCount: 10 }), // 0%
      makeProject({ slug: "b", doneCount: 3, totalCount: 10 }), // 30%
      makeProject({ slug: "c", doneCount: 6, totalCount: 10 }), // 60%
      makeProject({ slug: "d", doneCount: 9, totalCount: 10 }), // 90%
      makeProject({ slug: "e", doneCount: 10, totalCount: 10 }), // 100%
    ];

    const buckets = computeProgressDistribution(projects);
    expect(buckets).toHaveLength(5);

    expect(buckets[0].label).toBe("0–25%");
    expect(buckets[0].count).toBe(1);
    expect(buckets[0].projects).toContain("a");

    expect(buckets[1].label).toBe("25–50%");
    expect(buckets[1].count).toBe(1);
    expect(buckets[1].projects).toContain("b");

    expect(buckets[2].label).toBe("50–75%");
    expect(buckets[2].count).toBe(1);
    expect(buckets[2].projects).toContain("c");

    expect(buckets[3].label).toBe("75–99%");
    expect(buckets[3].count).toBe(1);
    expect(buckets[3].projects).toContain("d");

    expect(buckets[4].label).toBe("100%");
    expect(buckets[4].count).toBe(1);
    expect(buckets[4].projects).toContain("e");
  });

  it("puts 0-item projects in 0–25% bucket", () => {
    const projects = [
      makeProject({ slug: "empty", doneCount: 0, totalCount: 0 }),
    ];
    const buckets = computeProgressDistribution(projects);
    expect(buckets[0].count).toBe(1);
    expect(buckets[0].projects).toContain("empty");
  });

  it("handles exact boundaries correctly", () => {
    const projects = [
      makeProject({ slug: "a", doneCount: 25, totalCount: 100 }), // 25% -> 25-50 bucket
      makeProject({ slug: "b", doneCount: 50, totalCount: 100 }), // 50% -> 50-75 bucket
      makeProject({ slug: "c", doneCount: 75, totalCount: 100 }), // 75% -> 75-99 bucket
    ];
    const buckets = computeProgressDistribution(projects);
    expect(buckets[1].projects).toContain("a");
    expect(buckets[2].projects).toContain("b");
    expect(buckets[3].projects).toContain("c");
  });
});

describe("computeStaleProjects", () => {
  const now = new Date("2026-04-15T12:00:00Z");

  it("identifies projects not updated in 7+ days", () => {
    const projects = [
      makeProject({
        slug: "fresh",
        name: "Fresh",
        lastUpdated: "2026-04-14T12:00:00Z",
      }),
      makeProject({
        slug: "stale",
        name: "Stale",
        lastUpdated: "2026-04-01T12:00:00Z",
      }),
    ];

    const stale = computeStaleProjects(projects, 7, now);
    expect(stale).toHaveLength(1);
    expect(stale[0].slug).toBe("stale");
    expect(stale[0].daysSinceUpdate).toBe(14);
  });

  it("includes projects with no lastUpdated", () => {
    const projects = [
      makeProject({ slug: "no-date", name: "No Date", lastUpdated: null }),
    ];
    const stale = computeStaleProjects(projects, 7, now);
    expect(stale).toHaveLength(1);
    expect(stale[0].daysSinceUpdate).toBe(-1);
  });

  it("sorts by staleness (most stale first)", () => {
    const projects = [
      makeProject({ slug: "a", lastUpdated: "2026-04-05T00:00:00Z" }),
      makeProject({ slug: "b", lastUpdated: "2026-03-01T00:00:00Z" }),
      makeProject({ slug: "c", lastUpdated: "2026-04-07T00:00:00Z" }),
    ];

    const stale = computeStaleProjects(projects, 7, now);
    expect(stale.map((s) => s.slug)).toEqual(["b", "a", "c"]);
  });

  it("returns empty for all-fresh projects", () => {
    const projects = [
      makeProject({ slug: "a", lastUpdated: "2026-04-14T00:00:00Z" }),
    ];
    expect(computeStaleProjects(projects, 7, now)).toHaveLength(0);
  });

  it("respects custom threshold", () => {
    const projects = [
      makeProject({ slug: "a", lastUpdated: "2026-04-12T00:00:00Z" }), // 3 days old
    ];
    expect(computeStaleProjects(projects, 2, now)).toHaveLength(1);
    expect(computeStaleProjects(projects, 7, now)).toHaveLength(0);
  });
});

describe("computeMostActive", () => {
  it("ranks projects by completion count", () => {
    const events = [
      makeEvent({
        projectSlug: "a",
        projectName: "A",
        type: "roadmap_item_completed",
      }),
      makeEvent({
        projectSlug: "a",
        projectName: "A",
        type: "roadmap_item_completed",
        id: "e2",
      }),
      makeEvent({
        projectSlug: "a",
        projectName: "A",
        type: "roadmap_item_completed",
        id: "e3",
      }),
      makeEvent({
        projectSlug: "b",
        projectName: "B",
        type: "session_work_completed",
      }),
    ];

    const active = computeMostActive(events);
    expect(active).toHaveLength(2);
    expect(active[0].slug).toBe("a");
    expect(active[0].recentCompletions).toBe(3);
    expect(active[1].slug).toBe("b");
    expect(active[1].recentCompletions).toBe(1);
  });

  it("respects limit parameter", () => {
    const events = Array.from({ length: 10 }, (_, i) =>
      makeEvent({
        id: `e${i}`,
        projectSlug: `p${i}`,
        projectName: `P${i}`,
        type: "roadmap_item_completed",
      }),
    );
    expect(computeMostActive(events, 3)).toHaveLength(3);
  });

  it("ignores non-completion events", () => {
    const events = [
      makeEvent({ type: "session_started" }),
      makeEvent({ type: "roadmap_item_started", id: "e2" }),
    ];
    expect(computeMostActive(events)).toHaveLength(0);
  });

  it("tracks latest activity timestamp", () => {
    const events = [
      makeEvent({
        projectSlug: "a",
        projectName: "A",
        timestamp: "2026-04-10T00:00:00Z",
      }),
      makeEvent({
        projectSlug: "a",
        projectName: "A",
        timestamp: "2026-04-14T00:00:00Z",
        id: "e2",
      }),
    ];

    const active = computeMostActive(events);
    expect(active[0].lastActivity).toBe("2026-04-14T00:00:00Z");
  });
});

describe("computePortfolioMetrics", () => {
  it("computes all metrics from projects and events", () => {
    const projects = [
      makeProject({
        slug: "a",
        status: "active",
        doneCount: 5,
        totalCount: 10,
      }),
      makeProject({
        slug: "b",
        status: "complete",
        doneCount: 8,
        totalCount: 8,
      }),
    ];
    const events = [
      makeEvent({ projectSlug: "a", timestamp: "2026-04-14T00:00:00Z" }),
    ];

    const metrics = computePortfolioMetrics(projects, events);

    expect(metrics.totalProjects).toBe(2);
    expect(metrics.overallCompletion).toBe(72); // 13/18 = 72%
    expect(metrics.statusDistribution.active).toBe(1);
    expect(metrics.statusDistribution.complete).toBe(1);
    expect(metrics.itemCounts.done).toBe(13);
    expect(metrics.itemCounts.total).toBe(18);
    expect(metrics.velocity).toHaveLength(8);
    expect(metrics.progressDistribution).toHaveLength(5);
    expect(metrics.mostActive).toHaveLength(1);
    expect(Array.isArray(metrics.staleProjects)).toBe(true);
  });

  it("handles empty data", () => {
    const metrics = computePortfolioMetrics([], []);
    expect(metrics.totalProjects).toBe(0);
    expect(metrics.overallCompletion).toBe(0);
    expect(metrics.itemCounts.total).toBe(0);
    expect(metrics.mostActive).toHaveLength(0);
  });
});
