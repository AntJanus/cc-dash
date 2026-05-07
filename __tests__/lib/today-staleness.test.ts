import { describe, it, expect } from "vitest";
import { isDirectionsStale } from "@/lib/projects/today-staleness";

const TODAY = new Date("2026-05-07T12:00:00-06:00");

describe("isDirectionsStale", () => {
  it("returns false when for_date matches today's local date", () => {
    expect(isDirectionsStale("2026-05-07", TODAY)).toBe(false);
  });

  it("returns true when for_date is yesterday", () => {
    expect(isDirectionsStale("2026-05-06", TODAY)).toBe(true);
  });

  it("returns true when for_date is several days old", () => {
    expect(isDirectionsStale("2026-04-28", TODAY)).toBe(true);
  });

  it("returns false when for_date is in the future (user generated ahead)", () => {
    expect(isDirectionsStale("2026-05-08", TODAY)).toBe(false);
  });

  it("returns true when for_date is malformed (treats as stale)", () => {
    expect(isDirectionsStale("not-a-date", TODAY)).toBe(true);
  });

  it("uses local-tz semantics, not UTC", () => {
    // Late-evening US/Mountain: 23:30 local on 2026-05-07
    const lateLocal = new Date("2026-05-08T05:30:00Z");
    expect(isDirectionsStale("2026-05-07", lateLocal)).toBe(false);
  });
});
