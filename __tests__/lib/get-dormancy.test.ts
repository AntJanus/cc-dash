import { describe, it, expect } from "vitest";
import { getDormancy } from "@/lib/projects/get-dormancy";

const NOW = new Date("2026-07-14T12:00:00Z");

describe("getDormancy", () => {
  it("reports inactive dormancy when dormant_until is null", () => {
    expect(getDormancy(null, { now: NOW })).toEqual({
      isDormant: false,
      daysUntilReturn: 0,
    });
  });

  it("reports active dormancy for a future date and rounds days up", () => {
    // 6.5 days away -> a partial day still counts as a day of waiting.
    const result = getDormancy("2026-07-21", { now: NOW });
    expect(result.isDormant).toBe(true);
    expect(result.daysUntilReturn).toBe(7);
  });

  it("counts a same-week return correctly", () => {
    const result = getDormancy("2026-07-16", { now: NOW });
    expect(result.isDormant).toBe(true);
    expect(result.daysUntilReturn).toBe(2);
  });

  it("treats an elapsed dormant_until as no longer dormant", () => {
    expect(getDormancy("2026-07-01", { now: NOW })).toEqual({
      isDormant: false,
      daysUntilReturn: 0,
    });
  });

  it("treats the exact return instant as no longer dormant", () => {
    const noon = new Date("2026-07-14T00:00:00Z");
    // dormant_until parses to midnight UTC of the 14th; at that instant it is over.
    expect(getDormancy("2026-07-14", { now: noon })).toEqual({
      isDormant: false,
      daysUntilReturn: 0,
    });
  });

  it("defaults to the current clock when no now override is given", () => {
    const farFuture = "2999-01-01";
    const result = getDormancy(farFuture);
    expect(result.isDormant).toBe(true);
    expect(result.daysUntilReturn).toBeGreaterThan(0);
  });
});
