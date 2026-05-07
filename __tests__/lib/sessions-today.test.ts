import { describe, it, expect } from "vitest";
import { pickSessionsTouchedToday } from "@/lib/projects/sessions-today";
import type { ProjectCardData } from "@/lib/projects/get-projects";

const NOON = new Date("2026-05-07T12:00:00-06:00");

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

describe("pickSessionsTouchedToday", () => {
  it("includes only projects with hasActiveSession AND lastUpdated on today", () => {
    const projects = [
      makeProject({
        slug: "today-active",
        hasActiveSession: true,
        lastUpdated: "2026-05-07T08:30:00-06:00",
      }),
      makeProject({
        slug: "today-no-session",
        hasActiveSession: false,
        lastUpdated: "2026-05-07T08:30:00-06:00",
      }),
      makeProject({
        slug: "yesterday-active",
        hasActiveSession: true,
        lastUpdated: "2026-05-06T22:00:00-06:00",
      }),
    ];

    const result = pickSessionsTouchedToday(projects, NOON);
    expect(result.map((p) => p.slug)).toEqual(["today-active"]);
  });

  it("treats local-tz midnight boundaries strictly", () => {
    const projects = [
      makeProject({
        slug: "early",
        hasActiveSession: true,
        // 23:59 yesterday local time
        lastUpdated: "2026-05-06T23:59:00-06:00",
      }),
      makeProject({
        slug: "late",
        hasActiveSession: true,
        // 00:01 today local time
        lastUpdated: "2026-05-07T00:01:00-06:00",
      }),
    ];
    const result = pickSessionsTouchedToday(projects, NOON);
    expect(result.map((p) => p.slug)).toEqual(["late"]);
  });

  it("returns empty array when nothing matches", () => {
    const projects = [
      makeProject({ slug: "ghost", lastUpdated: null }),
      makeProject({
        slug: "old",
        hasActiveSession: true,
        lastUpdated: "2026-04-01T10:00:00-06:00",
      }),
    ];
    const result = pickSessionsTouchedToday(projects, NOON);
    expect(result).toEqual([]);
  });
});
